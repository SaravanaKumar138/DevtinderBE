const socket = require("socket.io");
const Chat = require("../models/chat");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const room = [userId, targetUserId].sort().join("_");
      console.log("Joining room: " + firstName + " " + room);
      socket.join(room);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, userId, targetUserId, text }) => {
        try {
            const roomId = [userId, targetUserId].sort().join("_");
            console.log(firstName+" "+text);
            try {
              let chat = await Chat.findOne({
                participants: { $all: [userId, targetUserId] },
              });
              if (!chat) {
                chat = new Chat({
                  participants: [userId, targetUserId],
                  messages: [],
                });
              }
              chat.messages.push({
                senderId: userId,
                text,
              });
              await chat.save();
              const now = new Date();
              io.to(roomId).emit("messageRecieved", { firstName, text, timestamp: now.toLocaleTimeString() }); //sending message to the room
            }
            catch(err) {
              console.log(err);
            }
         
        } catch (err) {}
      }
    );

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

module.exports = initializeSocket;
