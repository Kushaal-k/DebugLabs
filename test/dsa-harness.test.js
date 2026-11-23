import test from "node:test";
import assert from "node:assert/strict";
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
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



const {
  buildDsaExecutionPayload,
  evaluateTestCase,
  summarizeRun,
} = await import(path.join(rootDir, "server", "dist", "challenges", "dsa", "harness.js"));

const { TWO_SUM_PROBLEM } = await import(
  path.join(rootDir, "server", "dist", "challenges", "dsa", "problems", "two-sum.js")
);
const { BINARY_SEARCH_PROBLEM } = await import(
  path.join(rootDir, "server", "dist", "challenges", "dsa", "problems", "binary-search.js")
);

function runCodeWithStdin(code, stdin, cmd, filename) {
  const tmpDir = fs.mkdtempSync(path.join(rootDir, "test", "_tmp_dsa_"));
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, code, "utf8");
  try {
    return execSync(cmd, {
      cwd: tmpDir,
      input: stdin,
      encoding: "utf8",
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

test("evaluateTestCase correctly compares stdout to expected output", () => {
  const tc = { id: "tc-1", name: "Case 1", input: "4 9\n2 7 11 15", expectedOutput: "0 1" };

  const passRes = evaluateTestCase("0 1\n", "", 0, 15, tc);
  assert.equal(passRes.passed, true);
  assert.equal(passRes.actualOutput, "0 1");

  const failRes = evaluateTestCase("1 2\n", "", 0, 15, tc);
  assert.equal(failRes.passed, false);
  assert.equal(failRes.actualOutput, "1 2");

  const errRes = evaluateTestCase("", "Segmentation fault", 139, 10, tc);
  assert.equal(errRes.passed, false);
  assert.equal(errRes.actualOutput, "Segmentation fault");
  assert.equal(errRes.errorMessage, "Segmentation fault");
});

test("summarizeRun computes verdicts accurately", () => {
  const tc1 = { id: "tc-1", input: "", expectedOutput: "0 1" };
  const r1 = evaluateTestCase("0 1", "", 0, 10, tc1);
  const r2 = evaluateTestCase("0 1", "", 0, 12, tc1);

  const accSummary = summarizeRun([r1, r2], 22);
  assert.equal(accSummary.status, "passed");
  assert.equal(accSummary.verdict, "Accepted");
  assert.equal(accSummary.passed, 2);
  assert.equal(accSummary.failed, 0);

  const rWrong = evaluateTestCase("1 2", "", 0, 10, tc1);
  const waSummary = summarizeRun([r1, rWrong], 20);
  assert.equal(waSummary.status, "failed");
  assert.equal(waSummary.verdict, "Wrong Answer");
  assert.equal(waSummary.passed, 1);
  assert.equal(waSummary.failed, 1);

  const rCompile = evaluateTestCase("", "javac error: cannot find symbol", 1, 5, tc1);
  const ceSummary = summarizeRun([rCompile], 5);
  assert.equal(ceSummary.status, "failed");
  assert.equal(ceSummary.verdict, "Compilation Error");
});

test("JavaScript starter code flags bug and fixed code passes", () => {
  const tc = TWO_SUM_PROBLEM.testCases[0];

  // 1. Buggy starter code produces "1 2" instead of "0 1"
  const buggyOut = runCodeWithStdin(TWO_SUM_PROBLEM.starterCode.javascript, tc.input, "node index.js", "index.js");
  const buggyRes = evaluateTestCase(buggyOut, "", 0, 10, tc);
  assert.equal(buggyRes.passed, false);
  assert.equal(buggyRes.actualOutput, "1 2");

  // 2. Fixed code produces "0 1"
  const fixedJs = TWO_SUM_PROBLEM.starterCode.javascript.replace(
    "[seen.get(complement) + 1, i + 1]",
    "[seen.get(complement), i]"
  );
  const fixedOut = runCodeWithStdin(fixedJs, tc.input, "node index.js", "index.js");
  const fixedRes = evaluateTestCase(fixedOut, "", 0, 10, tc);
  assert.equal(fixedRes.passed, true);
  assert.equal(fixedRes.actualOutput, "0 1");
});

test("Python starter code flags bug and fixed code passes", () => {
  const tc = BINARY_SEARCH_PROBLEM.testCases[2]; // Target 5 in [5] -> expected 0

  // 1. Buggy code with `while left < right` misses single-element case
  const buggyOut = runCodeWithStdin(BINARY_SEARCH_PROBLEM.starterCode.python, tc.input, "python3 main.py", "main.py");
  const buggyRes = evaluateTestCase(buggyOut, "", 0, 10, tc);
  assert.equal(buggyRes.passed, false);
  assert.equal(buggyRes.actualOutput, "-1");

  // 2. Fixed code with `while left <= right`
  const fixedPy = BINARY_SEARCH_PROBLEM.starterCode.python.replace(
    "while left < right:",
    "while left <= right:"
  );
  const fixedOut = runCodeWithStdin(fixedPy, tc.input, "python3 main.py", "main.py");
  const fixedRes = evaluateTestCase(fixedOut, "", 0, 10, tc);
  assert.equal(fixedRes.passed, true);
  assert.equal(fixedRes.actualOutput, "0");
});

test("C++ starter code flags bug and fixed code passes", () => {
  const tc = TWO_SUM_PROBLEM.testCases[0];

  // 1. Buggy code output
  const buggyOut = runCodeWithStdin(
    TWO_SUM_PROBLEM.starterCode.cpp,
    tc.input,
    "g++ -O2 -std=c++20 main.cpp -o main && ./main",
    "main.cpp"
  );
  const buggyRes = evaluateTestCase(buggyOut, "", 0, 20, tc);
  assert.equal(buggyRes.passed, false);

  // 2. Fixed code
  const fixedCpp = TWO_SUM_PROBLEM.starterCode.cpp.replace(
    "{seen[complement] + 1, i + 1}",
    "{seen[complement], i}"
  );
  const fixedOut = runCodeWithStdin(
    fixedCpp,
    tc.input,
    "g++ -O2 -std=c++20 main.cpp -o main && ./main",
    "main.cpp"
  );
  const fixedRes = evaluateTestCase(fixedOut, "", 0, 20, tc);
  assert.equal(fixedRes.passed, true);
  assert.equal(fixedRes.actualOutput, "0 1");
});

test("DSA execution via engine runs end-to-end", async (t) => {
  const port = await getFreePort();
  const enginePath = path.join(rootDir, "execution-engine", "dist", "index.js");

  const child = spawn(process.execPath, [enginePath], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "ignore", "ignore"],
  });

  t.after(() => {
    child.kill("SIGKILL");
  });

  await waitForHealth(port, "execution-engine");

  const tc = TWO_SUM_PROBLEM.testCases[0];

  // 1. Buggy code
  const buggyPayload = buildDsaExecutionPayload(
    "javascript",
    TWO_SUM_PROBLEM.starterCode.javascript,
    tc.input
  );
  const resBuggy = await fetch(`http://127.0.0.1:${port}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buggyPayload),
  });
  assert.equal(resBuggy.status, 200);
  const execBuggy = await resBuggy.json();
  const evalBuggy = evaluateTestCase(execBuggy.stdout, execBuggy.error, execBuggy.exitCode, execBuggy.executionTime, tc);
  assert.equal(evalBuggy.passed, false);

  // 2. Fixed code
  const fixedJs = TWO_SUM_PROBLEM.starterCode.javascript.replace(
    "[seen.get(complement) + 1, i + 1]",
    "[seen.get(complement), i]"
  );
  const fixedPayload = buildDsaExecutionPayload("javascript", fixedJs, tc.input);
  const resFixed = await fetch(`http://127.0.0.1:${port}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fixedPayload),
  });
  assert.equal(resFixed.status, 200);
  const execFixed = await resFixed.json();
  const evalFixed = evaluateTestCase(execFixed.stdout, execFixed.error, execFixed.exitCode, execFixed.executionTime, tc);
  assert.equal(evalFixed.passed, true);
});
