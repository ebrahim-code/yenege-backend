const express = require("express");
const router = express.Router();
const {
    getUserProfile,
    syncCart,
    toggleWishlist,
    getUsers,
    updateUserRole,
    deleteUser
} = require("../controllers/userController");
const protect = require("../middleware/auth");

router.route("/profile").get(protect, getUserProfile);
router.route("/cart").post(protect, syncCart);
router.route("/wishlist").post(protect, toggleWishlist);

// Admin routes
router.route("/").get(protect, getUsers);
router.route("/:id/role").put(protect, updateUserRole);
router.route("/:id").delete(protect, deleteUser);

module.exports = router;
