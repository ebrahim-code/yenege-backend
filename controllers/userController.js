const User = require("../models/User");

// @desc    Get user profile (includes cart & wishlist)
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("cart.product", "title price image seller")
            .populate("wishlist", "title price image");

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                sellerProfile: user.sellerProfile,
                cart: user.cart,
                wishlist: user.wishlist,
                phone: user.phone,
                address: user.address,
                city: user.city,
                country: user.country
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sync cart from local storage to database
// @route   POST /api/users/cart
// @access  Private
exports.syncCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Expecting an array of { product: productId, quantity: Number }
        user.cart = req.body.cartItems;
        await user.save();

        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add/Remove from wishlist
// @route   POST /api/users/wishlist
// @access  Private
exports.toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: "User not found" });

        const index = user.wishlist.indexOf(productId);
        if (index > -1) {
            user.wishlist.splice(index, 1); // remove
        } else {
            user.wishlist.push(productId); // add
        }

        await user.save();
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized as admin" });
        }
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized as admin" });
        }
        const { role, verified } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            if (role !== undefined) user.role = role;
            if (verified !== undefined) {
                if (!user.sellerProfile) user.sellerProfile = {};
                user.sellerProfile.verified = verified;
            }
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Delete a user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized as admin" });
        }
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot delete your own admin account" });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get public user profile for seller store
// @route   GET /api/users/:id
// @access  Public
exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -email -otp -otpExpires");
        
        if (!user) return res.status(404).json({ message: "Seller not found" });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
