const Order = require("../models/Order");
const Product = require("../models/Product");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: "No order items" });
        } else {
            // For each order, we might have items from different sellers.
            // E-commerce platforms usually split orders by seller.
            // Let's assume frontend grouped them by seller, or we split them here.

            const ordersBySeller = {};

            orderItems.forEach((item) => {
                // Assume frontend passes item.seller ID
                const sellerId = item.seller;
                if (!ordersBySeller[sellerId]) {
                    ordersBySeller[sellerId] = {
                        buyer: req.user._id,
                        seller: sellerId,
                        items: [],
                        shippingAddress,
                        paymentMethod,
                        totalAmount: 0 // Will accumulate
                    };
                }
                ordersBySeller[sellerId].items.push(item);
                ordersBySeller[sellerId].totalAmount += item.price * item.quantity;
            });

            const orderPromises = Object.values(ordersBySeller).map(async (orderData) => {
                const order = new Order(orderData);
                return await order.save();
            });

            const createdOrders = await Promise.all(orderPromises);

            res.status(201).json(createdOrders);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders (Buyer)
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user._id }).populate("seller", "name email sellerProfile.businessName").sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in seller orders (Seller)
// @route   GET /api/orders/sellerorders
// @access  Private/Seller
exports.getSellerOrders = async (req, res) => {
    try {
        if (req.user.role !== "seller" && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized as seller" });
        }
        const orders = await Order.find({ seller: req.user._id }).populate("buyer", "name email").sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Seller
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to update this order" });
        }

        order.status = status;
        if (status === "Delivered") {
            order.deliveredAt = Date.now();
            order.isPaid = true; // Assuming COD, paid when delivered. 
            order.paidAt = Date.now();
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
