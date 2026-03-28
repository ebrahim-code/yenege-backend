const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer"
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String
    },
    otpExpires: {
      type: Date
    },
    // Seller-specific fields
    sellerProfile: {
      businessName: { type: String },
      businessDescription: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      country: { type: String, default: "Ethiopia" },
      verified: { type: Boolean, default: false },
      avatar: { type: String },
      bannerImage: { type: String },
      shopPolicies: { type: String }
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 }
    },
    // E-commerce fields
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 }
      }
    ],
    wishlist: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
    ],
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String, default: "Ethiopia" },
    // User preferences for personalized recommendations
    preferredCategories: [{
      type: String,
      enum: ["Textiles", "Baskets", "Coffee", "Jewelry", "Pottery", "Clothing", "Leather", "Art"]
    }],
    viewedCategories: [{
      category: { type: String },
      count: { type: Number, default: 1 },
      lastViewed: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);