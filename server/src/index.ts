import express from "express";
import type { ServiceStatus } from "@debugLabs/shared";
import { QueueEvents, Queue } from "bullmq";
import { Server } from "socket.io";
import { createServer } from "node:http";
import "./db/index.js";
import { ResponseModel } from "./models/response.model.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
    }
});

app.use(express.json());

app.get("/health", (_req, res) => {
  const result: ServiceStatus = {
    service: "server",
    status: "ok",
  };

  res.json(result);
});

export const connection = {
    host: 'localhost',
    port: 6379,
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://127.0.0.1:3002";

export const executionQueue = new Queue("execution-queue", { connection })
export const queueEvents = new QueueEvents("execution-queue", { connection })

// app.post("/submit", async (req, res) => {
//   const payload: ExecutionPayload = req.body;

//   const job = await ResponseModel.create({
//     code: payload.code,
//     stdin: payload.stdin,
//     language: payload.language,
//     status: "Running",
//   });

//   try {
//     const response = await fetch(`${ENGINE_URL}/execute`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const result: ExecutionResult = await response.json();

//     // 3. Update MongoDB with results
//     await job.updateOne({
//       $set: {
//         status: result.status,
//         stdout: result.stdout,
//         error: result.error,
//         executionTime: result.executionTime,
//         memoryUsed: result.memoryUsed,
//         exitCode: result.exitCode,
//       },
//     });

//     res.json({ jobId: job._id, ...result });
//   } catch (err) {
//     await job.updateOne({
//       $set: {
//         status: "Failed",
//         error: err instanceof Error ? err.message : "Execution failed",
//       },
//     });
//     res.status(500).json({ error: "Failed to reach execution engine" });
//   }
// });

queueEvents.on("completed", async ({ jobId, returnvalue }) => {
  const result = typeof returnvalue === "string" ? JSON.parse(returnvalue) : returnvalue;

  await ResponseModel.findByIdAndUpdate(jobId, {
    $set: {
      status: result.status,
      stdout: result.stdout,
      error: result.error,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
      exitCode: result.exitCode,
    },
  });

  io.emit(`result:${jobId}`, { jobId, result });
});

queueEvents.on("failed", async ({ jobId, failedReason }) => {
  await ResponseModel.findByIdAndUpdate(jobId, {
    $set: {
      status: "Failed",
      error: failedReason,
    },
  });

  io.emit(`result:${jobId}`, { jobId, error: failedReason });
});

import jobRoutes from "./routes/jobs.routes.js";
app.use("/api/v1/jobs", jobRoutes);

httpServer.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});
  