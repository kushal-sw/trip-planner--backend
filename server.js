// Load and validate environment variables first
require('./src/config/env');

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io to HTTP server
const { Server } = require('socket.io');
const setupSocket = require('./src/socket/collaborative');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // In production, close server gracefully
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});
