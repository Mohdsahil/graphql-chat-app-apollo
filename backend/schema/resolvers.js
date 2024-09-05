const bcrypt = require('bcryptjs');

const { PubSub } = require('graphql-subscriptions');
const User = require('../models/User');
const Message = require('../models/Message');
const { generateToken } = require("../middleware/auth")

const pubsub = new PubSub();

const resolvers = {
  Query: {
    users: async (_, __, Usss) => {
      console.log("Usss:::", Usss)
      const data =  await User.find()
      return data;
    },
    messagesBetween: async (_, { senderId, receiverId }, { }) => {
      // Fetch chat history between two users
      
      const data = await Message.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      }).sort({ createdAt: 1 }).populate('sender').populate('receiver');
     
      return data
    },
  },
  
  Mutation: {
    async register(_, { username, password }) {
      const userExists = await User.findOne({ username });
      if (userExists) {
        throw new Error('Username already taken');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      });

      const user = await newUser.save();
      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token
      };
    },
    
    async login(_, { username, password }) {
      const user = await User.findOne({ username });

      if (!user) {
        throw new Error('User not found');
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw new Error('Invalid credentials');
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token
      };
    },

    sendMessage: async (_, { senderId, receiverId, content }, { }) => {
      const newMessage = new Message({ sender: senderId, receiver: receiverId, content });
      await newMessage.save();

      // Publish the message to the subscription
     // Fetch the sender and receiver to ensure their data is included
     const sender = await User.findById(senderId);
     const receiver = await User.findById(receiverId);

     // Publish the message to the subscription

      
      pubsub.publish("MESSAGE_SENT", {
          messageSent: {
            ...newMessage.toObject(),
            sender: { ...sender.toObject(), id: sender._id.toString() },
            receiver: { ...receiver.toObject(), id: receiver._id.toString() },
            id: newMessage._id.toString()
          }
        });

      // Ensure IDs are strings
      return {
        ...newMessage.toObject(),
        sender: { ...sender.toObject(), id: sender._id.toString() },
        receiver: { ...receiver.toObject(), id: receiver._id.toString() },
        id: newMessage._id.toString()
      };
    },

    startVideoCall: async (_, { receiverId }, { userId }) => {
      const videoCall = { id: new Date().getTime().toString(), callerId: userId, receiverId, status: 'ringing' };
      pubsub.publish(`INCOMING_VIDEO_CALL`, { incomingVideoCall: videoCall });
      return videoCall;
    },

    acceptVideoCall: (_, { callId }) => {
      const videoCall = { id: callId, status: 'accepted', callTime: new Date().toISOString() };
      pubsub.publish('VIDEO_CALL_ACCEPTED', { videoCallAccepted: videoCall });
      return videoCall;
    },

    rejectVideoCall: (_, { callId }) => {
      const videoCall = { id: callId, status: 'rejected' };
      pubsub.publish('VIDEO_CALL_REJECTED', { videoCallRejected: videoCall });
      return videoCall;
    },

    async addIceCandidate(_, { callId, candidate }) {
      // Publish ICE candidate to the corresponding room
      pubsub.publish(`ICE_CANDIDATE_${callId}`, {
        iceCandidate: JSON.parse(candidate),
      });
      return true;
    },

  },

  Subscription: {
    messageSent: {
      
      subscribe: (_, varls, variables) => {
        
        console.log("++++++++++++++++++Subscribe.....")
        const data = pubsub.asyncIterator("MESSAGE_SENT");
        
        return data
      },
      next: (_, {}, {}) => {
        
      },
      resolve: (payload, { receiverId }) => {
        console.log("=================resolve.....", payload, receiverId)
        return payload.messageSent
        // if (payload.messageSent.receiver.id.toString() === receiverId) {
        //   return payload.messageSent;
        // }
        // return null;
      },
    },
    incomingVideoCall: {
      subscribe: (_, payload) => {
        console.log("++++++++++++++++++incomingVideoCall++++++++++++")
        console.log(":payload:", payload)
         return pubsub.asyncIterator(`INCOMING_VIDEO_CALL`)
      },
      resolve: (payload, payload2) => {
        console.log("=================resolve.....", payload, payload2)
        return payload.incomingVideoCall
        // if (payload.messageSent.receiver.id.toString() === receiverId) {
        //   return payload.messageSent;
        // }
        // return null;
      },
    },
    videoCallAccepted: {
      subscribe: (_, { callId }) => pubsub.asyncIterator(`VIDEO_CALL_ACCEPTED_${callId}`),
    },
    videoCallRejected: {
      subscribe: (_, { callId }) => pubsub.asyncIterator(`VIDEO_CALL_REJECTED_${callId}`),
    },

    iceCandidate: {
      subscribe: (_, { callId }) => pubsub.asyncIterator(`ICE_CANDIDATE_${callId}`),
    },
  }
};

module.exports = resolvers;
