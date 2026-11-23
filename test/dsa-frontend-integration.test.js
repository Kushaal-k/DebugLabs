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

async function waitForHealth(port, expectedService, timeoutMs = 10000) {
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
      // Retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timed out waiting for ${expectedService} on port ${port}`);
}

test("Frontend DSA Service API Integration Test", async (t) => {
  const enginePort = await getFreePort();
  const serverPort = await getFreePort();

  const enginePath = path.join(rootDir, "execution-engine", "dist", "index.js");
  const serverPath = path.join(rootDir, "server", "dist", "index.js");

  const engineProcess = spawn(process.execPath, [enginePath], {
    env: { ...process.env, PORT: String(enginePort), HOST: "127.0.0.1" },
    stdio: ["ignore", "ignore", "ignore"],
  });

  const serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: String(serverPort),
      HOST: "127.0.0.1",
      EXECUTION_ENGINE_URL: `http://127.0.0.1:${enginePort}`,
    },
    stdio: ["ignore", "ignore", "ignore"],
  });

  t.after(() => {
    engineProcess.kill("SIGKILL");
    serverProcess.kill("SIGKILL");
  });

  await waitForHealth(enginePort, "execution-engine");
  await waitForHealth(serverPort, "server");

  const apiBase = `http://127.0.0.1:${serverPort}/api/v1/dsa`;

  // 1. Problems list with descriptions and categories
  const resList = await fetch(`${apiBase}/problems`);
  assert.equal(resList.status, 200);
  const problems = await resList.json();
  assert.ok(Array.isArray(problems));
  assert.ok(problems.length >= 7);

  const twoSumSummary = problems.find((p) => p.id === "two-sum");
  assert.ok(twoSumSummary);
  assert.equal(twoSumSummary.title, "Two Sum");
  assert.equal(twoSumSummary.difficulty, "Easy");
  assert.ok(twoSumSummary.description);

  // 2. Problem details with starter code and test cases
  const resDetail = await fetch(`${apiBase}/problems/two-sum`);
  assert.equal(resDetail.status, 200);
  const twoSum = await resDetail.json();
  assert.equal(twoSum.id, "two-sum");
  assert.ok(twoSum.starterCode.javascript);
  assert.ok(!twoSum.starterCode.javascript.includes("BUG:"));
  assert.ok(twoSum.testCases.length > 0);
  assert.equal(twoSum.bugDescription, undefined);
  assert.equal(twoSum.hints, undefined);

  // 3. Run buggy starter code via API -> returns Wrong Answer summary
  const resRunBuggy = await fetch(`${apiBase}/problems/two-sum/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      language: "javascript",
      code: twoSum.starterCode.javascript,
    }),
  });
  assert.equal(resRunBuggy.status, 200);
  const buggySummary = await resRunBuggy.json();
  assert.equal(buggySummary.status, "failed");
  assert.equal(buggySummary.verdict, "Wrong Answer");
  assert.equal(buggySummary.passed, 0);

  // 4. Run fixed code via API -> returns Accepted summary
  const fixedJsCode = twoSum.starterCode.javascript.replace(
    "${seen.get(complement) + 1} ${i + 1}",
    "${seen.get(complement)} ${i}"
  );

  const resRunFixed = await fetch(`${apiBase}/problems/two-sum/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      language: "javascript",
      code: fixedJsCode,
    }),
  });
  assert.equal(resRunFixed.status, 200);
  const fixedSummary = await resRunFixed.json();
  assert.equal(fixedSummary.status, "passed");
  assert.equal(fixedSummary.verdict, "Accepted");
  assert.equal(fixedSummary.passed, twoSum.testCases.length);

  // 5. Submit fixed code -> returns Accepted submission result
  const resSubmit = await fetch(`${apiBase}/problems/two-sum/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      language: "javascript",
      code: fixedJsCode,
    }),
  });
  assert.equal(resSubmit.status, 200);
  const submissionResult = await resSubmit.json();
  assert.equal(submissionResult.status, "Accepted");
  assert.ok(submissionResult.submissionId);
  assert.equal(submissionResult.passedCount, submissionResult.totalCount);
  assert.ok(submissionResult.totalCount > twoSum.testCases.length); // Includes hidden test cases
});
