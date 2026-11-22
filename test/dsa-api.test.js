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

test("DSA Server API End-to-End Test", async (t) => {
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

  // 1. GET /api/v1/dsa/problems
  const resList = await fetch(`http://127.0.0.1:${serverPort}/api/v1/dsa/problems`);
  assert.equal(resList.status, 200);
  const problems = await resList.json();
  assert.ok(Array.isArray(problems));
  assert.ok(problems.length >= 7);
  assert.ok(problems.some((p) => p.id === "two-sum"));
  assert.ok(problems.some((p) => p.id === "binary-search"));

  // 2. GET /api/v1/dsa/problems/:id
  const resDetail = await fetch(`http://127.0.0.1:${serverPort}/api/v1/dsa/problems/two-sum`);
  assert.equal(resDetail.status, 200);
  const twoSum = await resDetail.json();
  assert.equal(twoSum.id, "two-sum");
  assert.ok(twoSum.starterCode.javascript);
  assert.ok(twoSum.starterCode.cpp);
  assert.ok(twoSum.starterCode.python);
  assert.ok(twoSum.starterCode.java);
  assert.ok(twoSum.testCases.length > 0);
  // Ensure hidden test cases are stripped from client
  assert.equal(twoSum.hiddenTestCases, undefined);

  // 3. POST /api/v1/dsa/problems/two-sum/run (Buggy starter code -> Wrong Answer)
  const resRunBuggy = await fetch(
    `http://127.0.0.1:${serverPort}/api/v1/dsa/problems/two-sum/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: "two-sum",
        language: "javascript",
        code: twoSum.starterCode.javascript,
      }),
    }
  );
  assert.equal(resRunBuggy.status, 200);
  const runBuggySummary = await resRunBuggy.json();
  assert.equal(runBuggySummary.status, "failed");
  assert.equal(runBuggySummary.verdict, "Wrong Answer");
  assert.equal(runBuggySummary.passed, 0);

  // 4. POST /api/v1/dsa/problems/two-sum/run with fixed C++ code -> Accepted
  const fixedCppCode = `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            cout << seen[complement] << " " << i << "\\n";
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
`;

  const resRunFixedCpp = await fetch(
    `http://127.0.0.1:${serverPort}/api/v1/dsa/problems/two-sum/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: "two-sum",
        language: "cpp",
        code: fixedCppCode,
      }),
    }
  );
  assert.equal(resRunFixedCpp.status, 200);
  const runFixedSummary = await resRunFixedCpp.json();
  assert.equal(runFixedSummary.status, "passed");
  assert.equal(runFixedSummary.verdict, "Accepted");
  assert.equal(runFixedSummary.passed, 3);
  assert.equal(runFixedSummary.total, 3);

  // 5. POST /api/v1/dsa/problems/two-sum/submit (Grading with hidden test cases)
  const resSubmit = await fetch(
    `http://127.0.0.1:${serverPort}/api/v1/dsa/problems/two-sum/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: "two-sum",
        language: "cpp",
        code: fixedCppCode,
      }),
    }
  );
  assert.equal(resSubmit.status, 200);
  const submissionResult = await resSubmit.json();
  assert.equal(submissionResult.status, "Accepted");
  assert.ok(submissionResult.totalCount > 3); // Includes hidden test cases!
  assert.equal(submissionResult.passedCount, submissionResult.totalCount);
});
