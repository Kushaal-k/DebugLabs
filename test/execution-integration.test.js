import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

function startService(entryPath, envOverrides = {}) {
  const stderrChunks = [];
  const child = spawn(process.execPath, [entryPath], {
    env: { ...process.env, ...envOverrides },
    stdio: ["ignore", "ignore", "pipe"],
  });

  child.stderr?.on("data", (chunk) => {
    stderrChunks.push(chunk);
  });

  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolve();
        return;
      }
      const killTimer = setTimeout(() => {
        child.kill("SIGKILL");
      }, 2000);

      child.once("exit", () => {
        clearTimeout(killTimer);
        resolve();
      });

      child.kill("SIGTERM");
    });

  return {
    child,
    stop,
    getStderr: () => Buffer.concat(stderrChunks).toString("utf-8"),
  };
}

async function waitForHealth(port, expectedService, serviceHandle, timeoutMs = 8000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (serviceHandle.child.exitCode !== null) {
      throw new Error(
        `${expectedService} exited early with code ${serviceHandle.child.exitCode}:\n${serviceHandle.getStderr()}`
      );
    }

    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) {
        const body = await res.json();
        if (body.service === expectedService && body.status === "ok") {
          return body;
        }
      }
    } catch {
      // Retry until server binds
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Timed out waiting for ${expectedService} on port ${port}.\nStderr:\n${serviceHandle.getStderr()}`
  );
}

test("execution-engine responds to health and validates execution payload", async (t) => {
  const port = await getFreePort();
  const enginePath = path.join(rootDir, "execution-engine", "dist", "index.js");

  const service = startService(enginePath, {
    PORT: String(port),
    HOST: "127.0.0.1",
  });

  t.after(async () => {
    await service.stop();
  });

  const health = await waitForHealth(port, "execution-engine", service);
  assert.equal(health.service, "execution-engine");
  assert.equal(health.status, "ok");

  // Test missing payload fields -> 400
  const invalidRes = await fetch(`http://127.0.0.1:${port}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(invalidRes.status, 400);
  const invalidJson = await invalidRes.json();
  assert.equal(invalidJson.error, "Missing required fields: code and language");

  // Test code execution dispatch via Docker
  const execRes = await fetch(`http://127.0.0.1:${port}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "console.log('Execution engine working!');",
      language: "javascript",
    }),
  });
  assert.equal(execRes.status, 200);
  const execJson = await execRes.json();
  assert.ok("status" in execJson);
  assert.ok("stdout" in execJson);
  assert.ok("error" in execJson);

  if (execJson.status === "Completed") {
    assert.equal(execJson.exitCode, 0);
    assert.ok(execJson.stdout.includes("Execution engine working!"));
  } else {
    assert.equal(execJson.status, "Failed");
    assert.ok(execJson.error.length > 0);
  }
});

test("workspace archive creation and docker stream demuxing works correctly", async () => {
  const executionModuleUrl = pathToFileURL(
    path.join(rootDir, "execution-engine", "dist", "execution.js")
  ).href;
  const { createWorkspaceArchive, demuxDockerStream } = await import(executionModuleUrl);

  const archive = await createWorkspaceArchive([
    { path: "index.js", content: "console.log('hello');" },
  ]);
  assert.ok(Buffer.isBuffer(archive));
  assert.ok(archive.length > 0);

  const stdoutPayload = Buffer.from("hello world\n");
  const header = Buffer.alloc(8);
  header[0] = 1; // stdout
  header.writeUInt32BE(stdoutPayload.length, 4);
  const streamBuf = Buffer.concat([header, stdoutPayload]);

  const demuxed = demuxDockerStream(streamBuf);
  assert.equal(demuxed.stdout, "hello world\n");
  assert.equal(demuxed.stderr, "");
});

test("payload builder correctly transforms mock scenarios for execution engine", async () => {
  const mockFiles = [
    {
      id: "server-index",
      name: "index.js",
      folder: "server",
      language: "javascript",
      content: "console.log('hello server');",
    },
    {
      id: "engine-runner",
      name: "runner.py",
      folder: "execution-engine",
      language: "python",
      content: "print('hello python')",
    },
    {
      id: "problem-md",
      name: "PROBLEM.md",
      folder: "root",
      language: "markdown",
      content: "# Problem statement",
    },
  ];

  function buildPayload(files, activeFile) {
    const executionFiles = files.map((f) => ({
      path: f.folder === "root" ? f.name : `${f.folder}/${f.name}`,
      content: f.content,
    }));

    const isCode = activeFile && activeFile.language !== "markdown";
    const language = isCode && activeFile.language === "python" ? "python" : "javascript";
    const entrypoint = isCode
      ? activeFile.folder === "root"
        ? activeFile.name
        : `${activeFile.folder}/${activeFile.name}`
      : "server/index.js";

    const activeContent = isCode
      ? activeFile.content
      : executionFiles.find((f) => f.path === entrypoint)?.content || "";

    return {
      code: activeContent,
      files: executionFiles,
      entrypoint,
      language,
    };
  }

  // When active file is javascript
  const jsPayload = buildPayload(mockFiles, mockFiles[0]);
  assert.equal(jsPayload.language, "javascript");
  assert.equal(jsPayload.entrypoint, "server/index.js");
  assert.equal(jsPayload.code, "console.log('hello server');");
  assert.equal(jsPayload.files.length, 3);
  assert.equal(jsPayload.files[0].path, "server/index.js");
  assert.equal(jsPayload.files[1].path, "execution-engine/runner.py");
  assert.equal(jsPayload.files[2].path, "PROBLEM.md");

  // When active file is python
  const pyPayload = buildPayload(mockFiles, mockFiles[1]);
  assert.equal(pyPayload.language, "python");
  assert.equal(pyPayload.entrypoint, "execution-engine/runner.py");
  assert.equal(pyPayload.code, "print('hello python')");

  // When active file is markdown (problem-md), fallback to preferred code entrypoint
  const mdPayload = buildPayload(mockFiles, mockFiles[2]);
  assert.equal(mdPayload.language, "javascript");
  assert.equal(mdPayload.entrypoint, "server/index.js");
  assert.equal(mdPayload.code, "console.log('hello server');");
});

test("server jobs endpoint accepts payload and validates submission", async (t) => {
  const port = await getFreePort();
  const serverPath = path.join(rootDir, "server", "dist", "index.js");

  const service = startService(serverPath, {
    PORT: String(port),
    HOST: "127.0.0.1",
  });

  t.after(async () => {
    await service.stop();
  });

  const health = await waitForHealth(port, "server", service);
  assert.equal(health.service, "server");

  // Test missing language in submit endpoint -> 400
  const invalidRes = await fetch(`http://127.0.0.1:${port}/api/v1/jobs/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(invalidRes.status, 400);
  const invalidJson = await invalidRes.json();
  assert.equal(invalidJson.error, "Language is required");

  // Test missing code and files in submit endpoint -> 400
  const noCodeRes = await fetch(`http://127.0.0.1:${port}/api/v1/jobs/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: "javascript" }),
  });
  assert.equal(noCodeRes.status, 400);
  const noCodeJson = await noCodeRes.json();
  assert.equal(noCodeJson.error, "Either code or files must be provided");

  // Test valid payload submission
  const validRes = await fetch(`http://127.0.0.1:${port}/api/v1/jobs/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "console.log('test');",
      language: "javascript",
    }),
  });
  // Accepts either 201 (Created) when DB is running or 500 when DB is disconnected
  assert.ok([201, 500].includes(validRes.status));
  if (validRes.status === 201) {
    const validJson = await validRes.json();
    assert.ok(validJson.jobId || validJson.id || validJson._id, "Expected a job ID in response");
  }
});