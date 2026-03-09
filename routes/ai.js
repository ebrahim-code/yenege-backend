const express = require('express');
const router = express.Router();
const { chat, getRecommendations, sellerAssist } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/chat', chat);
router.post('/recommendations', getRecommendations);

// Protected routes (require authentication)
router.post('/seller-assist', protect, sellerAssist);

module.exports = router;
