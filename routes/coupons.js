const express = require("express");
const router = express.Router();
const { createCoupon, getCoupons, validateCoupon, deleteCoupon } = require("../controllers/couponController");
const protect = require("../middleware/auth");

router.post("/", protect, createCoupon);
router.get("/", protect, getCoupons);
router.post("/validate", validateCoupon);
router.delete("/:id", protect, deleteCoupon);

module.exports = router;
