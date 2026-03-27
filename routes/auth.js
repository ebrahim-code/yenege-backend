const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, becomeSeller, verifyOTP, updatePreferences, trackViewedCategory } = require("../controllers/authController");
const protect = require("../middleware/auth");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/become-seller", protect, becomeSeller);
router.put("/preferences", protect, updatePreferences);
router.post("/track-category", protect, trackViewedCategory);

module.exports = router;