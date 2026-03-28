const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, becomeSeller, verifyOTP, updatePreferences, trackViewedCategory } = require("../controllers/authController");
const protect = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, upload.single("bannerImage"), updateProfile);
router.post("/become-seller", protect, becomeSeller);
router.put("/preferences", protect, updatePreferences);
router.post("/track-category", protect, trackViewedCategory);

module.exports = router;