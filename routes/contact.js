const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// POST /api/contact  – requires user to be logged in
// Finds an admin, creates/gets a conversation, sends the message
router.post('/', protect, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required.' });
  }

  try {
    const myId = req.user._id;

    // Find an admin user to receive the message
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'No admin found to receive your message.' });
    }

    const adminId = admin._id;

    // Create or find existing conversation between user and admin
    let conversation = await Conversation.findOne({
      participants: { $all: [myId, adminId] }
    }).populate('participants', 'name email role');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, adminId],
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role');
    }

    // Format the message text with subject header
    const fullText = `📬 [${subject}]\n\n${message}`;

    // Send the message
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: myId,
      text: fullText,
    });

    // Update conversation lastMessage
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: {
        text: fullText,
        sender: myId,
        read: false,
      },
    });

    // Create notification for the admin
    await Notification.create({
      user: adminId,
      type: 'new_message',
      title: 'New Contact Message',
      message: `New message: [${subject}] — ${message.substring(0, 80)}`,
      relatedUser: myId,
    });

    res.status(201).json({
      message: 'Your message has been sent to the admin successfully!',
      conversationId: conversation._id,
    });
  } catch (err) {
    console.error('Contact route error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
