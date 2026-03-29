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
  preferredCategories: user.preferredCategories || [],
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 3600000; // 1 hour

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || "buyer",
      isEmailVerified: false,
      otp,
      otpExpires
    };

    // If registering as seller, include seller profile data
    if (role === "seller" && sellerProfile) {
      userData.sellerProfile = {
        ...sellerProfile,
        businessName: sellerProfile.businessName || name
      };
    }

    const user = await User.create(userData);
    
    // Send verification email
    const verificationEmail = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Yenege!</h1>
          <p style="color: #e5e7eb; margin-top: 10px;">Ethiopia's Premier Online Marketplace</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #4b5563; line-height: 1.6;">Hello ${name},</p>
          <p style="color: #4b5563; line-height: 1.6;">Thank you for registering on Yenege! To complete your registration, please use the verification code below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">This code will expire in <strong>1 hour</strong>.</p>
          <p style="color: #4b5563; line-height: 1.6;">If you didn't create this account, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Yenege Team</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yenege Marketplace. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailSent = await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - Yenege Marketplace',
      html: verificationEmail
    });

    if (!emailSent) {
      console.error('[REGISTER] Failed to send verification email to:', user.email);
      // Don't fail registration, but log the error
    }

    // Generate auth token
    const token = generateToken(user._id);

    // Respond with token but frontend should still show OTP verification
    res.status(201).json({
      message: "Registration successful. Please verify your email with the code sent to your inbox.",
      token,
      user: formatUserResponse(user),
      requiresVerification: true
    });

    // Notify admins in the background (non-blocking)
    User.find({ role: 'admin' }).then(admins => {
      const notifications = admins.map(admin => ({
        user: admin._id,
        type: 'new_user',
        title: 'New User Registered',
        message: `${user.name} (${user.email}) has registered as ${user.role}`,
        relatedUser: user._id
      }));
      return Notification.insertMany(notifications);
    }).catch(err => console.error('[NOTIFY] Admin notification error:', err));

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // OTP is valid
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Automatically log the user in after successful verification
    const token = generateToken(user._id);

    res.json({ 
      message: "Account verified successfully",
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
    const { name, phone, address, city } = req.body;
    let { sellerProfile } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;

    // If it comes from FormData, it might be a string
    if (typeof sellerProfile === 'string') {
      try {
        sellerProfile = JSON.parse(sellerProfile);
      } catch (e) {
        console.error("Error parsing sellerProfile", e);
      }
    }

    if (sellerProfile) {
      updateData.sellerProfile = sellerProfile;
    }

    if (req.file) {
      const bannerUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      if (!updateData.sellerProfile) updateData.sellerProfile = {};
      updateData.sellerProfile.bannerImage = bannerUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
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

// Update user category preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { preferredCategories } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (preferredCategories) {
      user.preferredCategories = preferredCategories;
    }

    await user.save();

    res.json({
      message: "Preferences updated successfully",
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Track viewed category
exports.trackViewedCategory = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find if category already exists in viewedCategories
    const viewedCategory = user.viewedCategories.find(vc => vc.category === category);

    if (viewedCategory) {
      // Update existing category
      viewedCategory.count += 1;
      viewedCategory.lastViewed = new Date();
    } else {
      // Add new category
      user.viewedCategories.push({
        category,
        count: 1,
        lastViewed: new Date()
      });
    }

    await user.save();

    res.json({
      message: "Category view tracked",
      viewedCategories: user.viewedCategories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};