const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, becomeSeller, verifyEmail } = require("../controllers/authController");
const protect = require("../middleware/auth");

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/become-seller", protect, becomeSeller);

module.exports = router;