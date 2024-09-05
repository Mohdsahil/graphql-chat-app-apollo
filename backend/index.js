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
const cors = require('cors')

// Import Socket.io for video chat signaling
const { Server } = require('socket.io');

const startServer = async () => {
  await mongoose.connect(process.env.DB_URL, {});

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const app = express();
  // Enable CORS for all routes
  app.use(cors());
  
  const httpServer = http.createServer(app);

  // WebSocket for GraphQL subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
      authenticateToken(ctx.connectionParams.authentication);
    },
    onConnect: async (ctx) => {
      console.log("Connected to GraphQL WebSocket...");
    },
    onDisconnect(ctx, code, reason) {
      console.log('GraphQL WebSocket Disconnected!', code, reason);
    },
  }, wsServer);

  // Apollo Server Setup
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => {
      const token = req.headers.authentication || '';
      const user = authenticateToken(token);
      return { userId: user.id }; // Adjust based on your authentication logic
    },
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

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  // Socket.io server for WebRTC signaling
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Allow requests from the frontend origin
      methods: ["GET", "POST"],
    },
    // path: '/video', // Different path for video chat signaling
  });

  // Socket.io for WebRTC signaling
  io.on('connection', (socket) => {
    console.log('New user connected for video chat:', socket.id);

    socket.on('join-room', (roomId) => {
      console.log(`${socket.id} joined room: ${roomId}`);
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('signal', (data) => {
      console.log('Received signal from:', socket.id);
      socket.to(data.room).emit('signal', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from video chat:', socket.id);
    });
  });

  // Start the HTTP server
  httpServer.listen(4000, () => {
    console.log('Server running on http://localhost:4000/graphql');
    console.log('WebRTC signaling server running on ws://localhost:4000/video');
  });
};

// Call the async function to start the server
startServer().catch(error => {
  console.error('Error starting server:', error);
});