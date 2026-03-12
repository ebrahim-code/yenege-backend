require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const verifyExistingUsers = async () => {
    try {
        await connectDB();
        
        console.log("Finding users who are not email verified...");
        // Update all existing users who have isEmailVerified = false or undefined
        const result = await User.updateMany(
            { $or: [{ isEmailVerified: false }, { isEmailVerified: { $exists: false } }] },
            { $set: { isEmailVerified: true } }
        );

        console.log(`Success! Verified ${result.modifiedCount} legacy users.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

verifyExistingUsers();
