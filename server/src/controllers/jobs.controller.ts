import type { Request, Response } from "express";
import type { ExecutionPayload } from "@debugLabs/shared";
import { ResponseModel } from "../models/response.model.js";
import { executionQueue } from "../index.js";

const submitJob = async (req: Request<{}, {}, ExecutionPayload>, res: Response) => {
    try {
        const payload: ExecutionPayload = req.body;

        const job = await ResponseModel.create({
            code: payload.code,
            stdin: payload.stdin,
            language: payload.language,
            status: "Queued",
        });

        const job_id = job._id.toString();

        await executionQueue.add("execution-job",
            {
                id: job_id,
                code: payload.code,
                stdin: payload.stdin,
                language: payload.language,
            },
            {
                jobId: job_id,
                removeOnComplete: true,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        )

        res.status(201).json({ 
            jobId: job._id,
            status: job.status,
        });
    } catch (error) {
        console.error("submitJob error:", error);
        res.status(500).json({ error: "Failed to submit job" });
    }
}

const getJobStatus = async (req: Request<{ jobId: string }>, res: Response) => {
    const { jobId } = req.params;

    try {
        const job = await ResponseModel.findById(jobId);

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        const result = {
            status: job.status,
            stdout: job.stdout,
            error: job.error,
            executionTime: job.executionTime,
            memoryUsed: job.memoryUsed,
            exitCode: job.exitCode,
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve job status" });
    }
}

export { submitJob, getJobStatus };