const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            text: String,
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            read: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
