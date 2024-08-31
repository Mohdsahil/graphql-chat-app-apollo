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

  type Mutation {
    register(username: String!, password: String!): User
    login(username: String!, password: String!): User
    sendMessage(senderId: ID!, receiverId: ID!, content: String!): Message
  }

 type Subscription {
    messageSent(receiverId: ID!): Message
  }
`;

module.exports = typeDefs;
