import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: false,
    },
    files: [fileSchema],
    entrypoint: {
      type: String,
    },
    command: {
      type: String,
    },
    stdin: {
      type: String,
    },
    language: {
      type: String,
      required: true,
    },
    stdout: {
      type: String,
    },
    error: {
      type: String,
    },
    executionTime: {
      type: Number,
    },
    memoryUsed: {
      type: Number,
    },
    exitCode: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Queued", "Running", "Completed", "Failed"],
      default: "Queued",
    },
  },
  {
    timestamps: true,
  }
);

export const ResponseModel = mongoose.model("Response", responseSchema);
