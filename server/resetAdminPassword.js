// Use this file to reset admin password
// Run this file using: node resetAdminPassword.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const newPassword = "Admin@123";

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    const user = await User.findOneAndUpdate(
      {
        email: "admin@nivara.local",
        role: "ADMIN",
      },
      {
        password: hashedPassword,
      },
      {
        new: true,
      }
    );

    if (!user) {
      console.log("Admin account not found.");
      process.exit(1);
    }

    console.log("Admin password reset successfully.");
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error(
      "Password reset failed:",
      error
    );

    process.exit(1);
  }
};

resetPassword();