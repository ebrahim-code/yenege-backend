const Product = require("../models/Product");
const User = require("../models/User");

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const product = new Product({
      title,
      description,
      price,
      category,
      image: `/uploads/${req.file.filename}`,
      user: req.user._id,
    });

    const savedProduct = await product.save();

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
    const { title, description, price, category } = req.body;
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;

    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // Decrease seller's product count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.totalProducts": -1 }
    });

    res.json({ message: "Product deleted successfully" });
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
  deleteProduct
};