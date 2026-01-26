const socket = require("socket.io");
const Chat = require("../models/chat");
const { redisClient } = require("../config/redis");

// The key will expire in 60 seconds if not refreshed
const HEARTBEAT_TIMEOUT = 60;

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      // 1. Join a personal room for multi-tab management
      socket.join(userId);

      // 2. Set individual key in Redis with Expiration (TTL)
      // Key: user:online:123, Value: true, Expires in 60s
      await redisClient.set(`user:online:${userId}`, "true", {
        EX: HEARTBEAT_TIMEOUT,
      });

      // Notify others
      io.emit("userStatusUpdate", { userId, status: "online" });
    }

    // 3. HEARTBEAT EVENT: Client sends this every ~25 seconds
    socket.on("heartbeat", async () => {
      if (userId) {
        // Refresh the expiration timer back to 60 seconds
        await redisClient.expire(`user:online:${userId}`, HEARTBEAT_TIMEOUT);
      }
    });

    socket.on("joinChat", async ({ loggedInUserId, targetUserId }) => {
      const roomId = [loggedInUserId, targetUserId].sort().join("_");
      socket.join(roomId);

      // 4. Check status using "exists" instead of "sIsMember"
      const isOnline = await redisClient.exists(`user:online:${targetUserId}`);

      socket.emit("targetUserStatus", {
        userId: targetUserId,
        status: isOnline ? "online" : "offline",
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
          chat.messages.push({ senderId: loggedInUserId, text });
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
        // Check if other tabs for this user are still connected
        const matchingSockets = await io.in(userId).fetchSockets();

        if (matchingSockets.length === 0) {
          // No tabs left: Clean up Redis immediately
          await redisClient.del(`user:online:${userId}`);
          io.emit("userStatusUpdate", { userId, status: "offline" });
        }
      }
    });
  });
};

module.exports = initializeSocket;
