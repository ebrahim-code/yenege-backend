const express = require("express");
const router = express.Router();
const {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");
const protect = require("../middleware/auth");

router.route("/")
    .get(protect, getUserNotifications)
    .post(protect, createNotification);

router.get("/unread/count", protect, getUnreadCount);
router.put("/read-all", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);

module.exports = router;
