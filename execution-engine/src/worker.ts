import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { executeCode } from "./execution.js";
import type { ExecutionPayload } from "@debugLabs/shared";

interface ExecutionJobData extends ExecutionPayload {
    id: string;
}

// BullMQ worker to check for jobs in queue - execution-queue and then execute it
export const worker = new Worker<ExecutionJobData>(
    "execution-queue",
    async (job: Job<ExecutionJobData>) => {
        console.log(`[Worker] Picked up job ${job.data.id}`);
        return await executeCode({
            code: job.data.code,
            stdin: job.data.stdin,
            language: job.data.language,
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

