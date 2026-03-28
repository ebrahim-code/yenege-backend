const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const { title, description, price, originalPrice, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const product = new Product({
      title,
      description,
      price,
      originalPrice,
      category,
      image: req.file.path,  // Cloudinary URL
      user: req.user._id,
    });

    const savedProduct = await product.save();

    // Notify admins about new product
    try {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        user: admin._id,
        type: 'new_product',
        title: 'New Product Uploaded',
        message: `${req.user.name} has uploaded a new product: ${title}`,
        relatedProduct: savedProduct._id,
        relatedUser: req.user._id
      }));
      await Notification.insertMany(notifications);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    // Update seller's product count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.totalProducts": 1 }
    });

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PRODUCTS (for buyers)
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, seller } = req.query;
    let query = {};

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by seller
    if (seller) {
      query.user = seller;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(query)
      .populate("user", "name email sellerProfile stats role")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("user", "name email sellerProfile stats role");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SELLER'S PRODUCTS
const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id })
      .populate("user", "name email sellerProfile")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { title, description, price, originalPrice, category } = req.body;
    
    // Fetch the existing product
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // Auto-track previous price if price changed AND seller didn't explicitly set originalPrice
    let pendingOriginalPrice = product.originalPrice;
    if (price && Number(price) !== product.price) {
      pendingOriginalPrice = product.price; // the old price becomes the originalPrice
    }
    // But if originalPrice is explicitly sent in req.body, trust it
    if (originalPrice !== undefined) {
      pendingOriginalPrice = originalPrice;
    }

    // Update in-place
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.originalPrice = pendingOriginalPrice;
    product.category = category || product.category;
    
    if (req.file) {
      product.image = req.file.path; // New uploaded image
    }

    const savedProduct = await product.save();

    res.json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    let product;

    if (req.user.role === "admin") {
      // Admin can delete any product
      product = await Product.findByIdAndDelete(req.params.id);
    } else {
      // Seller can only delete their own product
      product = await Product.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // Decrease seller's product count
    await User.findByIdAndUpdate(product.user, {
      $inc: { "stats.totalProducts": -1 }
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TOGGLE FEATURED
const toggleFeatured = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newFeaturedStatus = !product.isFeatured;
    
    // Use findByIdAndUpdate to avoid full document validation, 
    // ensuring we can toggle featured even if legacy fields (like category) are messy.
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isFeatured: newFeaturedStatus },
      { new: true, runValidators: false }
    );
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE SHIPPING COST (Admin Only)
const updateShippingCost = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const { shippingCost } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.shippingCost = Number(shippingCost) || 0;
    const updatedProduct = await product.save();
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  updateShippingCost
};