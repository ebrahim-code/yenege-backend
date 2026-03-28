const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: ['https://yenege-tesfa.netlify.app', 'https://yenege.netlify.app', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
});

app.use(cors({
  origin: ['https://yenege-tesfa.netlify.app', 'https://yenege.netlify.app', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/users", require("./routes/users"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/coupons", require("./routes/coupons"));

// Socket.io real-time messaging
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with their userId
  socket.on("addNewUser", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Send message
  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    try {
      // Send to receiver in real-time
      io.to(receiverId).emit("getMessage", {
        sender: senderId,
        text,
        createdAt: new Date().toISOString()
      });
      
      // Emit notification for new message
      io.to(receiverId).emit("notification", {
        type: 'new_message',
        title: 'New Message',
        message: 'You have received a new message'
      });
      
      console.log(`Message sent from ${senderId} to ${receiverId}`);
    } catch (error) {
      console.error("Socket send message error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  // Warn if email is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('⚠️  WARNING: EMAIL_USER or EMAIL_PASS environment variables are NOT SET. Email verification will not work!');
  } else {
    console.log(`📧 Email configured for: ${process.env.EMAIL_USER}`);
  }
});