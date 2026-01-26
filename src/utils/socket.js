const socket = require("socket.io");
const Chat = require("../models/chat");
const { redisClient } = require("../config/redis");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
      if (userId) {
        await redisClient.sAdd("online_users", userId);
        io.emit("userStatusUpdate", { userId, status: "online" });
      }
    socket.on("joinChat", async ({ loggedInUserId, targetUserId }) => {
      const roomId = [loggedInUserId, targetUserId].sort().join("_");
      socket.join(roomId);
      const isOnline = await redisClient.sIsMember("online_users", targetUserId);
      socket.emit("targetUserStatus", { 
        userId: targetUserId, 
        status: isOnline ? "online" : "offline" 
      });
      console.log("Joined room:", roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, loggedInUserId, targetUserId, text }) => {
        const roomId = [loggedInUserId, targetUserId].sort().join("_");
        try {
          let chat = await Chat.findOne({
            participants: { $all: [loggedInUserId, targetUserId] },
          });
          if (!chat) {
            chat = new Chat({
              participants: [loggedInUserId, targetUserId],
              messages: [],
            });
          }
          chat.messages.push({
            senderId: loggedInUserId,
            text,
          });
          await chat.save();
        } catch (err) {
          console.log(err);
        }
        io.to(roomId).emit("messageReceived", {
          senderId: loggedInUserId,
          firstName,
          lastName,
          text,
        });
      },
    );
    socket.on("disconnect", async () => {  
      if (userId) {
      const matchingSockets = await io.in(userId).fetchSockets();

    if (matchingSockets.length === 0) {
      await redisClient.sRem("online_users", userId);
      io.emit("userStatusUpdate", { userId, status: "offline" });
    }}});
  });
};

module.exports = initializeSocket;
