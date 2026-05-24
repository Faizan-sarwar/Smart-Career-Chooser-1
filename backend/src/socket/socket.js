// backend/src/socket/socket.js
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'], // Your React frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Store online users: { userId: socketId }
const userSocketMap = {}; 

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on('connection', (socket) => {
  // Grab the userId from the frontend connection request
  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Broadcast the list of currently online users to EVERYONE connected
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  // Listen for disconnects
  socket.on('disconnect', () => {
    delete userSocketMap[userId];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

export { app, server, io };