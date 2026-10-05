const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const { canEditTrip } = require('../utils/canAccessTrip');
const { admin } = require('../config/firebase');

// In-memory registry of active users per itinerary room: Map<roomKey, Map<socketId, { userId, name, avatar }>>
const activeRooms = new Map();

const setupSocket = (io) => {
  // Socket.io Hybrid Authentication Middleware (JWT + Firebase ID Token)
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Strategy 1: Verify internal JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('name email role avatar');
        if (user) {
          socket.user = user;
          socket.authType = 'jwt';
          return next();
        }
      } catch (jwtErr) {
        // Fall through to Strategy 2 (Firebase verification)
      }

      // Strategy 2: Verify Firebase ID Token
      if (admin && typeof admin.auth === 'function') {
        try {
          const decodedFirebase = await admin.auth().verifyIdToken(token);
          if (decodedFirebase && decodedFirebase.uid) {
            const { uid, email, name, picture } = decodedFirebase;
            let user = await User.findOne({
              $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])],
            }).select('name email role avatar');

            if (!user) {
              const randomPassword = crypto.randomBytes(16).toString('hex');
              user = await User.create({
                name: name || (email ? email.split('@')[0] : 'Firebase User'),
                email: email || `${uid}@firebase.local`,
                password: randomPassword,
                firebaseUid: uid,
                avatar: picture || '',
                role: 'user',
              });
            }

            socket.user = user;
            socket.authType = 'firebase';
            return next();
          }
        } catch (firebaseErr) {
          return next(new Error(`Authentication error: ${firebaseErr.message}`));
        }
      }

      return next(new Error('Authentication error: Invalid or expired token'));
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.user.name} (${socket.id})`);

    // 1. Join itinerary room
    socket.on('join-itinerary', async ({ itineraryId }) => {
      try {
        if (!itineraryId) return;

        const itinerary = await Itinerary.findById(itineraryId);
        if (!itinerary) {
          socket.emit('error', { message: 'Itinerary not found' });
          return;
        }

        // Room access control: Only owner or users shared with 'edit' can join
        const canEdit = await canEditTrip(socket.user._id, itinerary.tripId);
        if (!canEdit) {
          socket.emit('error', {
            message: 'Forbidden: You must have edit permission to join collaborative editing',
          });
          return;
        }

        const roomKey = `itinerary_${itineraryId}`;
        socket.join(roomKey);
        socket.currentRoom = roomKey;

        // Register user into active room tracking
        if (!activeRooms.has(roomKey)) {
          activeRooms.set(roomKey, new Map());
        }
        activeRooms.get(roomKey).set(socket.id, {
          userId: socket.user._id.toString(),
          name: socket.user.name,
          avatar: socket.user.avatar,
        });

        const userList = Array.from(activeRooms.get(roomKey).values());
        io.to(roomKey).emit('room-users-updated', {
          room: roomKey,
          users: userList,
        });

        console.log(`👤 ${socket.user.name} joined room ${roomKey}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // 2. Leave itinerary room
    socket.on('leave-itinerary', ({ itineraryId }) => {
      const roomKey = `itinerary_${itineraryId}`;
      socket.leave(roomKey);

      if (activeRooms.has(roomKey)) {
        activeRooms.get(roomKey).delete(socket.id);
        const userList = Array.from(activeRooms.get(roomKey).values());
        io.to(roomKey).emit('room-users-updated', {
          room: roomKey,
          users: userList,
        });
      }
    });

    // 3. Broadcast real-time itinerary updates
    socket.on('itinerary-update', ({ itineraryId, data }) => {
      const roomKey = `itinerary_${itineraryId}`;
      socket.to(roomKey).emit('itinerary-updated', {
        itineraryId,
        data,
        updatedBy: {
          id: socket.user._id,
          name: socket.user.name,
        },
      });
    });

    // 4. Activity added notification
    socket.on('activity-added', ({ itineraryId, activity }) => {
      const roomKey = `itinerary_${itineraryId}`;
      socket.to(roomKey).emit('activity-added', {
        itineraryId,
        activity,
        addedBy: socket.user.name,
      });
    });

    // 5. Activity updated notification
    socket.on('activity-updated', ({ itineraryId, activity }) => {
      const roomKey = `itinerary_${itineraryId}`;
      socket.to(roomKey).emit('activity-updated', {
        itineraryId,
        activity,
        updatedBy: socket.user.name,
      });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      if (socket.currentRoom && activeRooms.has(socket.currentRoom)) {
        activeRooms.get(socket.currentRoom).delete(socket.id);
        const userList = Array.from(activeRooms.get(socket.currentRoom).values());
        io.to(socket.currentRoom).emit('room-users-updated', {
          room: socket.currentRoom,
          users: userList,
        });
      }
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
