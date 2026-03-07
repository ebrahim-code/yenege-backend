const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
    },
    { timestamps: true }
);

// Prevent users from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
reviewSchema.statics.getAverageRating = async function (productId) {
    const obj = await this.aggregate([
        {
            $match: { product: productId },
        },
        {
            $group: {
                _id: "$product",
                averageRating: { $avg: "$rating" },
                numOfReviews: { $sum: 1 },
            },
        },
    ]);

    try {
        await this.model("Product").findByIdAndUpdate(productId, {
            rating: obj.length > 0 ? obj[0].averageRating : 0,
            reviewCount: obj.length > 0 ? obj[0].numOfReviews : 0,
        });
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
reviewSchema.post("save", function () {
    this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before remove
reviewSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await doc.constructor.getAverageRating(doc.product);
    }
});

module.exports = mongoose.model("Review", reviewSchema);
