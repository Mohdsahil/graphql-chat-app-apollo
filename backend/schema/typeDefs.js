const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID
    username: String
    token: String
    createdAt: String
  }
  
  type Message {
    id: ID
    content: String
    sender: User
    receiver: User
    createdAt: String
  }

   type Query {
    users: [User]
    messagesBetween(senderId: ID!, receiverId: ID!): [Message]
  }

  type VideoCall {
    id: ID!
    callerId: ID!
    receiverId: ID!
    status: String!
    callTime: String
  }

  type IceCandidate {
    candidate: String
  }
    
  type Mutation {
    register(username: String!, password: String!): User
    login(username: String!, password: String!): User
    sendMessage(senderId: ID!, receiverId: ID!, content: String!): Message
    startVideoCall(receiverId: ID!): VideoCall
    acceptVideoCall(callId: ID!): VideoCall
    rejectVideoCall(callId: ID!): VideoCall
    addIceCandidate(callId: ID!, candidate: String!): Boolean
  }

 type Subscription {
    messageSent(receiverId: ID!): Message
    incomingVideoCall(receiverId: ID!): VideoCall
    videoCallAccepted(callId: ID!): VideoCall
    videoCallRejected(callId: ID!): VideoCall
     iceCandidate(callId: ID!): IceCandidate
  }
`;

module.exports = typeDefs;
