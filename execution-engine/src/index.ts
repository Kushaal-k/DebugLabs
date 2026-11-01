import express from "express";
import type { ServiceStatus } from "@debugLabs/shared";

const app = express();
const port = Number(process.env.PORT ?? 3002);
const host = process.env.HOST ?? "127.0.0.1";

app.use(express.json());

app.get("/health", (_req, res) => {
  const result: ServiceStatus = {
    service: "execution-engine",
    status: "ok",
  };

  res.json(result);
});

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
