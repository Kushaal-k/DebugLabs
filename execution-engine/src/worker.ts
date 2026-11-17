import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { spawn } from "node:child_process";
import { executeCode } from "./execution.js";
import type { ExecutionPayload, ExecutionResult } from "@debugLabs/shared";

interface ExecutionJobData extends ExecutionPayload {
  id: string;
}

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

export const worker = new Worker<ExecutionJobData, ExecutionResult>(
  "execution-queue",
  async (job: Job<ExecutionJobData, ExecutionResult>) => {
    const jobId = job.data.id ?? job.id;
    console.log(`[Worker] Picked up job ${jobId}`);

    const result = await executeCode({
      code: job.data.code,
      files: job.data.files,
      entrypoint: job.data.entrypoint,
      language: job.data.language,
      stdin: job.data.stdin,
      command: job.data.command,
    });

    // If Docker/engine failed before user code ran (exitCode === null), throw so BullMQ can retry
    if (result.status === "Failed" && result.exitCode === null) {
      throw new Error(result.error || "Code execution engine failure");
    }

    return result;
  },
  {
    connection: {
      host: redisHost,
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ Worker
      retryStrategy(times: number) {
        return Math.min(times * 1000, 5000);
      },
    },
    concurrency: 2,
    lockDuration: 30_000, // Should exceed EXECUTION_TIMEOUT_MS (10s) + container startup overhead
  }
);

worker.on("completed", (job, result) => {
  const jobId = job.data.id ?? job.id;
  console.log(`[Worker] Job ${jobId} finished with status: ${result.status}`);
});

worker.on("failed", (job, err) => {
  const jobId = job?.data?.id ?? job?.id;
  console.error(`[Worker] Job ${jobId} failed:`, err);
});

let lastWorkerErrorLog = 0;
worker.on("error", (err) => {
  const now = Date.now();
  if (now - lastWorkerErrorLog > 8000) {
    lastWorkerErrorLog = now;
    console.warn(`[Worker] Redis connection issue: ${err.message} (Is Redis running on ${redisHost}?)`);
  }
});

// Graceful shutdown so running containers finish before exit
const shutdown = async (signal: string) => {
  console.log(`[Worker] Received ${signal}, closing worker...`);
  await worker.close();
  process.exit(0);
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));