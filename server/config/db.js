import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to connect to MongoDB");
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGO_URI);
    await connectionPromise;

    console.log("MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
