const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

module.exports = connectDB;
