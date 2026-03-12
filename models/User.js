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
      bannerImage: { type: String }
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
    country: { type: String, default: "Ethiopia" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);