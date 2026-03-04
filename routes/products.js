const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  getSellerProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const protect = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected seller routes
router.get("/seller/my-products", protect, getSellerProducts);
router.post("/", protect, upload.single("image"), createProduct);
router.put("/:id", protect, upload.single("image"), updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;