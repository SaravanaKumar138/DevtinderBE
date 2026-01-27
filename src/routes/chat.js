
const express = require("express");
const Chat = require("../models/chat");
const { userAuth } = require("../middleware/auth");

const chatRouter = express.Router();

// chatRouter.get("/:targetUserId", userAuth, async (req, res) => {
//     const { targetUserId} = req.params; 
//     const userId  = req.user._id;
//     try {
//         let chat = await Chat.findOne({
//             participants: { $all : [userId, targetUserId]},
//         }).populate({
//             path: "messages.senderId",
//             select: "firstName lastName"
//         });
//         if (!chat) {
//             chat = new Chat({
//                 participants: [userId, targetUserId],
//                 messages: [],
//             });
//             await chat.save();
//         }
//         res.status(200).json(chat);
//     }   
//     catch(err) {
//         console.log(err);
//     }
// });

chatRouter.get("/:targetUserId", userAuth, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    // 1. Get pagination parameters from query string (e.g., ?page=1&limit=20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        // 2. Find the chat first to check if it exists and get total message count
        let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
        });

        // 3. If no chat exists, create one (only on the first page load)
        if (!chat) {
            if (page > 1) return res.status(200).json({ messages: [], hasMore: false });
            
            chat = new Chat({
                participants: [userId, targetUserId],
                messages: [],
            });
            await chat.save();
            return res.status(200).json({ messages: [], hasMore: false });
        }

        const totalMessages = chat.messages.length;

        /**
         * 4. Slicing Logic for Infinite Scroll (Top-to-Bottom)
         * We want the messages from the end of the array.
         * Example: 100 messages, limit 20.
         * Page 1: last 20 messages (index 80-100) -> slice [-20, 20]
         * Page 2: messages 60-80 -> slice [-40, 20]
         */
        const sliceStart = -(page * limit);
        
        // Refetch with Slice and Populate
        const paginatedChat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
        }).select({
            // Get only the slice of messages we need
            messages: { $slice: [sliceStart, limit] },
            participants: 1
        }).populate({
            path: "messages.senderId",
            select: "firstName lastName"
        });

        res.status(200).json({
            messages: paginatedChat.messages,
            // 5. Tell the frontend if there are more messages to fetch
            hasMore: totalMessages > page * limit 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = chatRouter;