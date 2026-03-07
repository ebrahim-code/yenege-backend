const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// @desc    Create or get conversation between two users
// @route   POST /api/messages/conversations
// @access  Private
exports.createOrGetConversation = async (req, res) => {
    try {
        const { userId } = req.body; // The other user's ID
        const myId = req.user._id;

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [myId, userId] }
        }).populate("participants", "name email sellerProfile avatar role");

        // If not, create new
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [myId, userId],
            });
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "name email sellerProfile avatar role");
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all conversations for logged in user
// @route   GET /api/messages/conversations
// @access  Private
exports.getUserConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate("participants", "name email sellerProfile avatar role")
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { conversationId: req.params.conversationId, sender: { $ne: req.user._id }, read: false },
            { $set: { read: true } }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;

        const message = await Message.create({
            conversationId,
            sender: req.user._id,
            text,
        });

        // Update conversation lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: {
                text,
                sender: req.user._id,
                read: false
            }
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
