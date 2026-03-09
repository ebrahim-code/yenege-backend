const Notification = require('../models/Notification');

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
    try {
        const notification = await Notification.create(req.body);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort('-createdAt')
            .limit(50)
            .populate('relatedUser', 'name email')
            .populate('relatedProduct', 'title image')
            .populate('relatedOrder', 'orderNumber totalAmount');
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            user: req.user._id, 
            read: false 
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
