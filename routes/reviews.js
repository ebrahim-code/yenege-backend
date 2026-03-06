const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createReview,
  getProductReviews,
  getSellerReviews,
  updateReview,
  deleteReview,
  markHelpful,
  reportReview,
} = require("../controllers/reviewController");

// Public routes
router.get("/product/:productId", getProductReviews);
router.get("/seller/:sellerId", getSellerReviews);

// Protected routes
router.post("/", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);
router.post("/:reviewId/helpful", protect, markHelpful);
router.post("/:reviewId/report", protect, reportReview);

module.exports = router;
