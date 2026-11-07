import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
    },
    stdin: {
        type: String
    },
    language: {
        type: String,
        required: true
    },
    stdout: {
        type: String,
    },
    error: {
        type: String,
    },
    executionTime: {
        type: Number
    },
    memoryUsed: {
        type: Number
    },
    exitCode: {
        type: Number
    },
    status: {
        type: String,
        enum: ["Queued", "Running", "Completed", "Failed"],
        default: "Queued"
    }
}, 
    {
        timestamps: true,
    }
)

export const ResponseModel = mongoose.model("Response", responseSchema);