const express = require("express");
const router = express.Router();
const {
    getUserProfile,
    syncCart,
    toggleWishlist,
    getUsers,
    updateUserRole,
    deleteUser,
    getPublicProfile
} = require("../controllers/userController");
const protect = require("../middleware/auth");
const adminProtect = require("../middleware/auth");

// Custom middleware to check admin role
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: "Not authorized as admin" });
    }
};

router.route("/profile").get(protect, getUserProfile);
router.route("/cart").post(protect, syncCart);
router.route("/wishlist").post(protect, toggleWishlist);

// Admin routes (must come before dynamic routes)
router.route("/").get(protect, getUsers);
router.route("/:id/delete").delete(protect, adminOnly, deleteUser);
router.route("/:id/role").put(protect, adminOnly, updateUserRole);

// Public profile route (comes last)
router.route("/:id").get(getPublicProfile);

module.exports = router;
