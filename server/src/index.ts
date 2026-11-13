import express from "express";
import type { ServiceStatus } from "@debugLabs/shared";
import { QueueEvents, Queue } from "bullmq";
import { Server } from "socket.io";
import { createServer } from "node:http";
import "./db/index.js";
import { ResponseModel } from "./models/response.model.js";
import jobRoutes from "./routes/jobs.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
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
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const executionQueue = new Queue("execution-queue", { connection });
export const queueEvents = new QueueEvents("execution-queue", { connection });

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

app.use("/api/v1/jobs", jobRoutes);

httpServer.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
