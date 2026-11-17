import express from "express";
import type { ExecutionResult, ServiceStatus } from "@debugLabs/shared";
import mongoose from "mongoose";
import { QueueEvents, Queue } from "bullmq";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
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

const redisHost = process.env.REDIS_HOST ?? "127.0.0.1";
if (redisHost === "127.0.0.1" || redisHost === "localhost") {
  try {
    spawn("redis-server", ["--daemonize", "yes", "--dir", "/tmp"], {
      stdio: "ignore",
      detached: true,
    }).unref();
  } catch {
    // Ignore if redis-server is not installed
  }
}

export const connection = {
  host: redisHost,
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    return Math.min(times * 1000, 5000);
  },
};

export const executionQueue = new Queue("execution-queue", { connection });
export const queueEvents = new QueueEvents("execution-queue", { connection });

let lastRedisErrorLog = 0;
const logRedisError = (source: string, error: Error) => {
  const now = Date.now();
  if (now - lastRedisErrorLog > 8000) {
    lastRedisErrorLog = now;
    console.warn(`[server] Redis connection issue on ${source}: ${error.message} (Is Redis running on ${redisHost}?)`);
  }
};

queueEvents.on("error", (error) => logRedisError("QueueEvents", error));
executionQueue.on("error", (error) => logRedisError("ExecutionQueue", error));

queueEvents.on("completed", async ({ jobId, returnvalue }) => {
  try {
    const result: ExecutionResult =
      typeof returnvalue === "string" ? JSON.parse(returnvalue) : returnvalue;

    if (mongoose.isValidObjectId(jobId)) {
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
    }

    io.emit(`result:${jobId}`, { jobId, result });
  } catch (error) {
    console.error(`[QueueEvents] Error handling completed job ${jobId}:`, error);
  }
});

queueEvents.on("failed", async ({ jobId, failedReason }) => {
  try {
    if (mongoose.isValidObjectId(jobId)) {
      await ResponseModel.findByIdAndUpdate(jobId, {
        $set: {
          status: "Failed",
          error: failedReason,
        },
      });
    }

    io.emit(`result:${jobId}`, { jobId, error: failedReason });
  } catch (error) {
    console.error(`[QueueEvents] Error handling failed job ${jobId}:`, error);
  }
});

app.use("/api/v1/jobs", jobRoutes);

httpServer.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

const shutdown = () => {
  try {
    httpServer.closeAllConnections?.();
    httpServer.close();
    io.close();
    queueEvents.close().catch(() => {});
    executionQueue.close().catch(() => {});
  } finally {
    process.exit(0);
  }
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
