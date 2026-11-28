import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { executeCode } from "./execution.js";

interface ExecutionPayload {
    code: string;
    files?: Record<string, string>;
    entrypoint: string;
    language: string;
    stdin?: string;
    command?: string;
}

interface ExecutionJobData extends ExecutionPayload {
    id: string;
}

export const worker = new Worker<ExecutionJobData>(
    "execution-queue",
    async (job: Job<ExecutionJobData>) => {
        console.log(`[Worker] Picked up job ${job.data.id}`);
        return await executeCode({
            code: job.data.code,
            files: job.data.files
                ? Object.entries(job.data.files).map(([path, content]) => ({ path, content }))
                : undefined,
            entrypoint: job.data.entrypoint,
            language: job.data.language as Parameters<typeof executeCode>[0]["language"],
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

