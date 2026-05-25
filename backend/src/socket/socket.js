// backend/src/socket/socket.js
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// userId → socketId
const userSocketMap = {};
// Track typing timeouts to auto-expire stale typing states
const typingTimeouts = new Map();

export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return null;
  return userSocketMap[String(receiverId)];
};

io.on('connection', (socket) => {
  // 🚨 CRITICAL FIX: Ensure userId is treated as a clean string
  const userId = String(socket.handshake.query.userId);

  if (userId && userId !== 'undefined' && userId !== 'null') {
    userSocketMap[userId] = socket.id;
    console.log(`🟢 User connected: ${userId}`); // Helps you debug in terminal
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  }

  // ── TYPING INDICATORS ──────────────────────────────────────────
  socket.on('typing', ({ to }) => {
    if (!userId || !to) return;
    const recipientSocket = userSocketMap[to];
    if (!recipientSocket) return;

    io.to(recipientSocket).emit('userTyping', { from: userId });

    const key = `${userId}:${to}`;
    if (typingTimeouts.has(key)) clearTimeout(typingTimeouts.get(key));
    typingTimeouts.set(
      key,
      setTimeout(() => {
        io.to(recipientSocket).emit('userStopTyping', { from: userId });
        typingTimeouts.delete(key);
      }, 4000)
    );
  });

  socket.on('stopTyping', ({ to }) => {
    if (!userId || !to) return;
    const recipientSocket = userSocketMap[to];
    if (!recipientSocket) return;

    io.to(recipientSocket).emit('userStopTyping', { from: userId });

    const key = `${userId}:${to}`;
    if (typingTimeouts.has(key)) {
      clearTimeout(typingTimeouts.get(key));
      typingTimeouts.delete(key);
    }
  });

  // ── DISCONNECT ─────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log(`🔴 User disconnected: ${userId}`);
      delete userSocketMap[userId];

      for (const [key, handle] of typingTimeouts.entries()) {
        if (key.startsWith(`${userId}:`)) {
          clearTimeout(handle);
          typingTimeouts.delete(key);
        }
      }
      io.emit('getOnlineUsers', Object.keys(userSocketMap));
    }
  });
});

export { app, server, io };