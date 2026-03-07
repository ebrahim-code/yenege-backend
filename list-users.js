const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const connectDB = require("./config/db");

dotenv.config();

const listUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({}, 'name email role');
        console.log("Registered Users:");
        console.table(users.map(u => ({ name: u.name, email: u.email, role: u.role })));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
