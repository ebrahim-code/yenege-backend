const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
    },

    originalPrice: {
      type: Number,
    },

    image: {
      type: String,
      required: true,
    },

    images: [{
      type: String
    }],

    category: {
      type: String,
      required: true,
      enum: ["Textiles", "Baskets", "Coffee", "Jewelry", "Pottery", "Clothing", "Leather", "Art", "Shoes", "Other"],
    },

    condition: {
      type: String,
      enum: ["new", "like-new", "good", "fair"],
      default: "new"
    },

    stock: {
      type: Number,
      default: 1,
      min: 0
    },

    status: {
      type: String,
      enum: ["active", "sold", "draft"],
      default: "active"
    },

    views: {
      type: Number,
      default: 0
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    reviewCount: {
      type: Number,
      default: 0
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: [{
      type: String
    }],

    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model("Product", productSchema);