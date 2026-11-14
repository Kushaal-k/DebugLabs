import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/debuglabs";

mongoose
  .connect(mongoUri, { serverSelectionTimeoutMS: 2000 })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
