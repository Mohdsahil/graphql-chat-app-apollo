const bcrypt = require('bcryptjs');

const { PubSub } = require('graphql-subscriptions');
const User = require('../models/User');
const Message = require('../models/Message');
const { generateToken } = require("../middleware/auth")

const pubsub = new PubSub();

const resolvers = {
  Query: {
    users: async (_, __, { }) => {
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
  },

  Subscription: {
    messageSent: {
      
      subscribe: (_, varls, variables) => {
        
        console.log("++++++++++++++++++Subscribe.....")
        const data = pubsub.asyncIterator("MESSAGE_SENT");
        
        return data
      },
      next: (_, {}, {}) => {
        console.log(":data:", data)
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
  }
};

module.exports = resolvers;
