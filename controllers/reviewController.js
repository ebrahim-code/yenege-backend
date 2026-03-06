const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");

// CREATE REVIEW
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      seller: product.user,
      rating,
      comment,
      images: images || [],
    });

    // Update product rating and review count
    const reviews = await Review.find({ product: productId });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
    });

    // Update seller stats
    const sellerReviews = await Review.find({ seller: product.user });
    const sellerAverageRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;

    await User.findByIdAndUpdate(product.user, {
      "stats.rating": Math.round(sellerAverageRating * 10) / 10,
      "stats.reviewCount": sellerReviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCT REVIEWS
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "highest":
        sortOption = { rating: -1 };
        break;
      case "lowest":
        sortOption = { rating: 1 };
        break;
      case "helpful":
        sortOption = { helpful: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ product: productId });

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: new require("mongoose").Types.ObjectId(productId) } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      ratingStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SELLER REVIEWS
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ seller: sellerId })
      .populate("user", "name")
      .populate("product", "title image")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ seller: sellerId });

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE REVIEW
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // Recalculate product rating
    const reviews = await Review.find({ product: review.product });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(averageRating * 10) / 10,
    });

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const productId = review.product;
    const sellerId = review.seller;

    await review.deleteOne();

    // Recalculate product rating
    const reviews = await Review.find({ product: productId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
    });

    // Recalculate seller rating
    const sellerReviews = await Review.find({ seller: sellerId });
    const sellerAverageRating = sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
      : 0;

    await User.findByIdAndUpdate(sellerId, {
      "stats.rating": Math.round(sellerAverageRating * 10) / 10,
      "stats.reviewCount": sellerReviews.length,
    });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MARK REVIEW AS HELPFUL
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.helpful += 1;
    await review.save();

    res.json({ message: "Review marked as helpful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REPORT REVIEW
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.reported = true;
    review.reportReason = reason;
    await review.save();

    res.json({ message: "Review reported successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
