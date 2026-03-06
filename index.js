const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

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
app.use("/api/reviews", require("./routes/reviews"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});