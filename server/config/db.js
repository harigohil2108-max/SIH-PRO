import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
  } catch (error) {
    const message = `MongoDB connection failed: ${error.message}. Check MONGO_URI and whitelist this machine's public IP in MongoDB Atlas Network Access.`;
    console.error(message);
    throw new Error(message);
  }
};

export default connectDB;