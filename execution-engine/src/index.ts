import express from "express";
import type { ServiceStatus, ExecutionPayload } from "@debugLabs/shared";
import { executeCode } from "./execution.js";
import "./worker.js";

const app = express();
const port = Number(process.env.PORT ?? 3002);
const host = process.env.HOST ?? "0.0.0.0";

app.use(express.json());

app.get("/health", (_req, res) => {
  const result: ServiceStatus = {
    service: "execution-engine",
    status: "ok",
  };

  res.json(result);
});

app.post("/execute", async (req, res) => {
  const payload: ExecutionPayload = req.body;

  if(!payload.code || !payload.language) {
    return res.status(400).json({ error: "Missing required fields: code and language" });
  }

  try {
    const result = await executeCode(payload);
    res.json(result);
  } catch (error) {
    console.error(`[execution engine] Error executing code: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
})

const server = app.listen(port, host, (error) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }

  const address = server.address();
  if (address && typeof address !== "string") {
    console.log(`Execution engine running at http://${host}:${address.port}`);
  }
});
