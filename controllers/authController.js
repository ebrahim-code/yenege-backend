const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Helper function to format user response
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  sellerProfile: user.sellerProfile,
  stats: user.stats,
  createdAt: user.createdAt
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, sellerProfile } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || "buyer"
    };

    // If registering as seller, include seller profile data
    if (role === "seller" && sellerProfile) {
      userData.sellerProfile = {
        ...sellerProfile,
        businessName: sellerProfile.businessName || name
      };
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, sellerProfile } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (sellerProfile) updateData.sellerProfile = sellerProfile;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Become a seller (upgrade from buyer)
exports.becomeSeller = async (req, res) => {
  try {
    const { businessName, businessDescription, phone, address, city } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "seller") {
      return res.status(400).json({ message: "You are already a seller" });
    }

    user.role = "seller";
    user.sellerProfile = {
      businessName: businessName || user.name,
      businessDescription: businessDescription || "",
      phone: phone || "",
      address: address || "",
      city: city || "",
      verified: false
    };

    await user.save();

    res.json({
      message: "You are now a seller!",
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};