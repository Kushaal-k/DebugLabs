import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { executeCode } from "./execution.js";
import type { ExecutionPayload } from "@debugLabs/shared";

interface ExecutionJobData extends ExecutionPayload {
    id: string;
}

export const worker = new Worker<ExecutionJobData>(
    "execution-queue",
    async (job: Job<ExecutionJobData>) => {
        console.log(`[Worker] Picked up job ${job.data.id}`);
        return await executeCode({
            code: job.data.code,
            files: job.data.files,
            entrypoint: job.data.entrypoint,
            language: job.data.language,
            stdin: job.data.stdin,
            command: job.data.command,
        });
    },
    {
        connection: {
            host: process.env.REDIS_HOST ?? "localhost",
            port: Number(process.env.REDIS_PORT ?? 6379),
        },
        concurrency: 2,
    }
);

worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
});

let lastRedisWarn = 0;
worker.on("error", (err) => {
    const now = Date.now();
    if (now - lastRedisWarn > 10000) {
        lastRedisWarn = now;
        console.warn(`[execution-engine worker] Redis is offline (${err.message}). Background queue is paused, direct execution remains active.`);
    }
});

