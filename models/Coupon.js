const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percent", "fixed"],
      default: "percent"
    },
    discountValue: {
      type: Number,
      required: true
    },
    expirationDate: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: null // null for unlimited
    },
    usageCount: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
