import express from "express";
import type { ExecutionResult, ServiceStatus } from "@debugLabs/shared";
import mongoose from "mongoose";
import { QueueEvents, Queue } from "bullmq";
import { Server } from "socket.io";
import { createServer } from "node:http";
import "./db/index.js";
import { ResponseModel } from "./models/response.model.js";
import jobRoutes from "./routes/jobs.routes.js";
import dsaRoutes from "./routes/dsa.routes.js";

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
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/", (_req, res) => {
  const webUrl = process.env.WEB_URL ?? "http://localhost:5173";
  res.redirect(webUrl);
});

app.get("/health", (_req, res) => {
  const result: ServiceStatus = {
    service: "server",
    status: "ok",
  };

  res.json(result);
});

const redisHost = process.env.REDIS_HOST ?? "127.0.0.1";

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

let hasLoggedRedisWarning = false;
const logRedisError = (_source: string, error: Error) => {
  if (!hasLoggedRedisWarning) {
    hasLoggedRedisWarning = true;
    console.info(`[server] Redis is offline (${error.message}). Direct execution mode active for DSA debugging.`);
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
app.use("/api/v1/dsa", dsaRoutes);

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
