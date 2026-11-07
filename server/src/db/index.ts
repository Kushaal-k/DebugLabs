import mongoose from "mongoose";
import type { ExecutionPayload, ExecutionResult } from "@debugLabs/shared";
import { ResponseModel } from "../models/response.model.js";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/debuglabs";
await mongoose.connect(mongoUri);