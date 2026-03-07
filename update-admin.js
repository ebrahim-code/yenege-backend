const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const connectDB = require("./config/db");

dotenv.config();

const makeAdmin = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB.");

        const email = "ebrollic@gmail.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = "admin";
        await user.save();

        console.log(`Successfully updated ${user.name} (${email}) to Admin!`);
        process.exit(0);
    } catch (error) {
        console.error("Error updating user:", error);
        process.exit(1);
    }
};

makeAdmin();
