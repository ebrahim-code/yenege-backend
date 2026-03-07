const express = require("express");
const router = express.Router();
const {
    createOrGetConversation,
    getUserConversations,
    getMessages,
    sendMessage
} = require("../controllers/messageController");
const protect = require("../middleware/auth");

router.route("/conversations").post(protect, createOrGetConversation).get(protect, getUserConversations);
router.route("/").post(protect, sendMessage);
router.route("/:conversationId").get(protect, getMessages);

module.exports = router;
