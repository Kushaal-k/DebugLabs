import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { executeCode } from "./execution.js";
import type { ExecutionPayload } from "@debugLabs/shared";

interface ExecutionJobData extends ExecutionPayload {
    id: string;
}

const redisHost = process.env.REDIS_HOST ?? "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT ?? 6379);

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
            host: redisHost,
            port: redisPort,
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
            retryStrategy(times: number) {
                return Math.min(times * 1000, 5000);
            },
        },
        concurrency: 2,
    }
);

let lastRedisErrorLog = 0;
worker.on("error", (error) => {
    const now = Date.now();
    if (now - lastRedisErrorLog > 8000) {
        lastRedisErrorLog = now;
        console.warn(`[engine] Redis connection issue: ${error.message} (Is Redis running on ${redisHost}:${redisPort}?)`);
    }
});

worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
});
