import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const address = s.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to get port"));
        return;
      }
      s.close((err) => (err ? reject(err) : resolve(address.port)));
    });
    s.on("error", reject);
  });
}

async function waitForHealth(port, expectedService, timeoutMs = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) {
        const body = await res.json();
        if (body.service === expectedService && body.status === "ok") {
          return body;
        }
      }
    } catch {
      // Service not ready yet; retry after delay
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timed out waiting for ${expectedService} on port ${port}`);
}

test("server starts and serves /health on a temporary port", async (t) => {
  const port = await getFreePort();
  const serverPath = path.join(rootDir, "server", "dist", "index.js");

  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: "pipe",
  });

  t.after(() => {
    child.kill("SIGTERM");
  });

  const body = await waitForHealth(port, "server");
  assert.deepEqual(body, { service: "server", status: "ok" });
});

test("execution-engine starts and serves /health on a temporary port", async (t) => {
  const port = await getFreePort();
  const enginePath = path.join(rootDir, "execution-engine", "dist", "index.js");

  const child = spawn(process.execPath, [enginePath], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: "pipe",
  });

  t.after(() => {
    child.kill("SIGTERM");
  });

  const body = await waitForHealth(port, "execution-engine");
  assert.deepEqual(body, { service: "execution-engine", status: "ok" });
});
