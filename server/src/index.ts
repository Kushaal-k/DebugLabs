import express from "express";
import type { ServiceStatus } from "@debugLabs/shared";
import type { ExecutionPayload, ExecutionResult } from "@debugLabs/shared";
import { ResponseModel } from "./models/response.model.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.use(express.json());

app.get("/health", (_req, res) => {
  const result: ServiceStatus = {
    service: "server",
    status: "ok",
  };

  res.json(result);
});

const ENGINE_URL = process.env.ENGINE_URL ?? "http://127.0.0.1:3002";

app.post("/submit", async (req, res) => {
  const payload: ExecutionPayload = req.body;

  const job = await ResponseModel.create({
    code: payload.code,
    stdin: payload.stdin,
    language: payload.language,
    status: "Running",
  });

  try {
    const response = await fetch(`${ENGINE_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ExecutionResult = await response.json();

    // 3. Update MongoDB with results
    await job.updateOne({
      $set: {
        status: result.status,
        stdout: result.stdout,
        error: result.error,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        exitCode: result.exitCode,
      },
    });

    res.json({ jobId: job._id, ...result });
  } catch (err) {
    await job.updateOne({
      $set: {
        status: "Failed",
        error: err instanceof Error ? err.message : "Execution failed",
      },
    });
    res.status(500).json({ error: "Failed to reach execution engine" });
  }
});

const server = app.listen(port, host, (error) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }

  const address = server.address();
  if (address && typeof address !== "string") {
    console.log(`Server running at http://${host}:${address.port}`);
  }
});
