const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: "No order items" });
        }

        // Resolve missing sellers by looking up the product
        const resolvedItems = await Promise.all(orderItems.map(async (item) => {
            if (!item.seller) {
                const product = await Product.findById(item.product);
                if (product) {
                    item.seller = product.user;
                }
            }
            return item;
        }));

        // Group items by seller
        const ordersBySeller = {};
        resolvedItems.forEach((item) => {
            const sellerId = item.seller?.toString() || 'unknown';
            if (!ordersBySeller[sellerId]) {
                ordersBySeller[sellerId] = {
                    buyer: req.user._id,
                    seller: item.seller,
                    items: [],
                    shippingAddress,
                    paymentMethod,
                    totalAmount: 0
                };
            }
            ordersBySeller[sellerId].items.push(item);
            ordersBySeller[sellerId].totalAmount += item.price * item.quantity;
        });

        // Filter out any group without a valid seller
        const validOrders = Object.values(ordersBySeller).filter(o => o.seller);

        if (validOrders.length === 0) {
            return res.status(400).json({ message: "Could not determine seller for any item" });
        }

        const orderPromises = validOrders.map(async (orderData) => {
            const order = new Order(orderData);
            return await order.save();
        });

        const createdOrders = await Promise.all(orderPromises);
        
        // Send notifications to admin and sellers
        try {
            // Notify all admins about new order
            const admins = await User.find({ role: 'admin' });
            const adminNotifications = admins.map(admin => ({
                user: admin._id,
                type: 'new_order',
                title: 'New Order Placed',
                message: `A new order has been placed on Yenege marketplace`,
                relatedOrder: createdOrders[0]._id
            }));
            await Notification.insertMany(adminNotifications);
            
            // Notify sellers about their orders
            const sellerNotifications = validOrders.map((orderData, index) => ({
                user: orderData.seller,
                type: 'new_order',
                title: 'New Order Received',
                message: `You have received a new order for ${orderData.items.length} product(s)`,
                relatedOrder: createdOrders[index]._id
            }));
            await Notification.insertMany(sellerNotifications);
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
        
        res.status(201).json(createdOrders);

    } catch (error) {
        console.error('Order creation error:', error);
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

// @desc    Get ALL orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
    try {
        console.log('Admin getAllOrders called by:', req.user.email, 'Role:', req.user.role);
        
        // Check if admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        // Get ALL orders without any filter, sorted by newest first
        const orders = await Order.find({})
            .populate('buyer', 'name email')
            .populate('seller', 'name email sellerProfile.businessName')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${orders.length} total orders`);
        res.json(orders);
    } catch (error) {
        console.error('Error in getAllOrders:', error);
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
