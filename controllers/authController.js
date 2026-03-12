const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

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
      role: role || "buyer",
      isEmailVerified: false,
      emailVerificationToken: crypto.randomBytes(20).toString('hex')
    };

    // If registering as seller, include seller profile data
    if (role === "seller" && sellerProfile) {
      userData.sellerProfile = {
        ...sellerProfile,
        businessName: sellerProfile.businessName || name
      };
    }

    const user = await User.create(userData);

    // Notify admins about new user registration
    try {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        user: admin._id,
        type: 'new_user',
        title: 'New User Registered',
        message: `${user.name} (${user.email}) has registered as ${user.role}`,
        relatedUser: user._id
      }));
      await Notification.insertMany(notifications);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${user.emailVerificationToken}`;
    
    const emailSent = await sendEmail({
      email: user.email,
      subject: 'Verify your Yenege Account',
      html: `
        <h1>Welcome to Yenege!</h1>
        <p>Hi ${user.name}, please click the link below to verify your email address and activate your account:</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    if (!emailSent) {
      console.error("Failed to send verification email to:", user.email);
    }

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Please verify your email to login. Check your inbox." });
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