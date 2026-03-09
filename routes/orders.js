const express = require("express");
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getSellerOrders,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/orderController");
const protect = require("../middleware/auth");

router.route("/").post(protect, createOrder).get(protect, getAllOrders);
router.route("/myorders").get(protect, getMyOrders);
router.route("/sellerorders").get(protect, getSellerOrders);
router.route("/:id/status").put(protect, updateOrderStatus);

module.exports = router;
