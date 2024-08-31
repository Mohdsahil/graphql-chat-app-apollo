require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}.local`
});
const { ApolloServer } = require('apollo-server-express');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const express = require('express');
const http = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const mongoose = require('mongoose');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');
const { authenticateToken } = require('./middleware/auth');

const startServer = async () => {
  await mongoose.connect(process.env.DB_URL, {});

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
       console.log("context:", ctx.connectionParams)
       authenticateToken(ctx.connectionParams.authentication)
    },  
    onConnect: async (ctx) => {
      console.log("Connected...");
    },
    onDisconnect(ctx, code, reason) {
       
      console.log('Disconnected!', code, reason);
    },
  }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    }],
  });

  // Start Apollo Server
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  // Start HTTP server
  httpServer.listen(4000, () => {
    console.log('Server running on http://localhost:4000/graphql');
  });
};

// Call the async function to start the server
startServer().catch(error => {
  console.error('Error starting server:', error);
});
