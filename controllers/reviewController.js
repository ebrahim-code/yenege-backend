const Review = require("../models/Review");
const Order = require("../models/Order");

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Check if user has purchased this product
        // (Optional, but good for authentic reviews)
        const hasPurchased = await Order.findOne({
            buyer: req.user._id,
            "items.product": productId,
            status: "Delivered", // Optional: only allow review after delivery
        });

        if (!hasPurchased) {
            return res.status(400).json({ message: "You must purchase and receive the product before reviewing." });
        }

        const reviewExists = await Review.findOne({
            product: productId,
            user: req.user._id,
        });

        if (reviewExists) {
            return res.status(400).json({ message: "Product already reviewed" });
        }

        const review = new Review({
            rating: Number(rating),
            comment,
            product: productId,
            user: req.user._id,
        });

        await review.save();
        res.status(201).json({ message: "Review added" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Product already reviewed" });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId }).populate("user", "name");
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
