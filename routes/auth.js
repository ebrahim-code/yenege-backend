const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  becomeSeller,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");
const protect = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/become-seller", protect, becomeSeller);

// Email verification routes
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendVerification);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;