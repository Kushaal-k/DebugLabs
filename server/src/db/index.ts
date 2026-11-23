import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/debuglabs";

export async function connectDB(): Promise<typeof mongoose | null> {
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log("[server] Connected to MongoDB");
    return conn;
  } catch (error) {
    console.info(
      "[server] MongoDB is offline. DSA debugging & execution engine are fully operational."
    );
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}

void connectDB();
