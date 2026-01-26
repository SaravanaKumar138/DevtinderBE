
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
    ,text: {
        type: String,
        required: true,
    },
},{
    timestamps: true
})


const chatSchema = new mongoose.Schema({
    participants: [
        {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    ],
    messages: [messageSchema],//each message has oun schema so i kept separate
})

module.exports = mongoose.model("Chat", chatSchema);