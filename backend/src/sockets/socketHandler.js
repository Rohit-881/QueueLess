const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initSocket = (server) => {
  const clientUrl = process.env.CLIENT_URL;
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || !clientUrl || clientUrl === '*' || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === clientUrl) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for preview/custom domains
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        // Allow anonymous connection for public display screens if needed, but flag as unauthenticated
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_queueless_2026');
      const user = await User.findById(decoded.id).select('_id name role email isActive');

      if (!user || !user.isActive) {
        return next(new Error('Authentication failed: User inactive or not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      // If token is invalid, allow connection as guest or return error
      console.warn('[Socket Auth] Token verification failed:', err.message);
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userDisplay = socket.user ? `${socket.user.name} (${socket.user.role})` : 'Anonymous';
    console.log(`[Socket Connected] Client id: ${socket.id}, User: ${userDisplay}`);

    // If user is authenticated, automatically join their private user room for direct notifications
    if (socket.user) {
      const userRoom = `user:${socket.user._id}`;
      socket.join(userRoom);
    }

    // Join specific queue room for live updates
    socket.on('join:queue', (queueSessionId) => {
      if (!queueSessionId) return;
      const room = `queue:${queueSessionId}`;
      socket.join(room);
      console.log(`[Socket Room] Socket ${socket.id} joined room: ${room}`);
      socket.emit('joined:queue', { room, success: true });
    });

    // Leave queue room
    socket.on('leave:queue', (queueSessionId) => {
      if (!queueSessionId) return;
      const room = `queue:${queueSessionId}`;
      socket.leave(room);
      console.log(`[Socket Room] Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket Disconnected] Client ${socket.id} disconnected. Reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    // Return dummy object if accessed during unit tests without server
    return {
      to: () => ({
        emit: () => {},
      }),
      emit: () => {},
    };
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
