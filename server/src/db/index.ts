import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/debuglabs";

try {
    await mongoose.connect(mongoUri);
} catch (error) {
    console.error("Error connecting to MongoDB:", error);
}
