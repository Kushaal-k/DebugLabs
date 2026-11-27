import type {
  DsaRunSummary,
  DsaTestCase,
  DsaTestCaseResult,
  DsaVerdictStatus,
  ExecutionPayload,
  SupportedLanguage,
} from "@debugLabs/shared";

const DEFAULT_TIME_LIMIT_MS = 10_000;
const DEFAULT_MEMORY_LIMIT_MB = 512;

export function buildDsaExecutionPayload(
  language: SupportedLanguage,
  code: string,
  stdin: string
): ExecutionPayload {
  return { language, code, stdin };
}

function getVerdict(
  actual: string,
  expected: string,
  error: string,
  exitCode: number | null,
  timeMs: number,
  memoryUsedKb: number | undefined,
  timeLimitMs: number,
  memoryLimitMb: number
): DsaVerdictStatus {
  const err = error.toLowerCase();

  if (err.includes("timed out") || exitCode === 124 || timeMs > timeLimitMs) {
    return "Time Limit Exceeded";
  }

  if (
    (memoryUsedKb !== undefined && memoryUsedKb > memoryLimitMb * 1024) ||
    err.includes("out of memory") ||
    err.includes("memoryerror") ||
    (exitCode === 137 && err.includes("killed"))
  ) {
    return "Memory Limit Exceeded";
  }

  if (exitCode !== 0) {
    if (exitCode === null && (err.includes("docker.sock") || err.includes("enoent"))) {
      return "Internal Error";
    }
    if (error.includes("error:") || error.includes("javac")) {
      return "Compilation Error";
    }
    return "Runtime Error";
  }

  return actual === expected ? "Accepted" : "Wrong Answer";
}

export function evaluateTestCase(
  stdout: string,
  error: string,
  exitCode: number | null,
  timeMs: number,
  tc: DsaTestCase,
  options: { memoryUsedBytes?: number; timeLimitMs?: number; memoryLimitMb?: number } = {}
): DsaTestCaseResult {
  const actual = (stdout || "").trim().replace(/\r\n/g, "\n");
  const expected = (tc.expectedOutput || "").trim().replace(/\r\n/g, "\n");
  const memoryUsedKb =
    options.memoryUsedBytes !== undefined
      ? Math.round(options.memoryUsedBytes / 1024)
      : undefined;

  const verdict = getVerdict(
    actual,
    expected,
    error || "",
    exitCode,
    timeMs,
    memoryUsedKb,
    options.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS,
    options.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB
  );
  const passed = verdict === "Accepted";

  return {
    testCaseId: tc.id,
    testCaseName: tc.name || tc.id,
    passed,
    verdict,
    actualOutput: actual || (error ? error.trim() : "No output"),
    expectedOutput: tc.expectedOutput.trim(),
    executionTimeMs: Math.round(timeMs * 100) / 100,
    memoryUsedKb,
    errorMessage: passed ? undefined : error || verdict,
    hidden: tc.hidden,
  };
}

export function summarizeRun(results: DsaTestCaseResult[], totalTimeMs: number): DsaRunSummary {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const isOk = passed === total;

  const priority: DsaVerdictStatus[] = [
    "Compilation Error",
    "Time Limit Exceeded",
    "Memory Limit Exceeded",
    "Runtime Error",
    "Internal Error",
    "Wrong Answer",
  ];

  const failedVerdicts = new Set(
    results
      .filter((r) => !r.passed)
      .map((r) =>
        r.verdict ??
        (r.errorMessage?.includes("error:") || r.errorMessage?.includes("javac")
          ? "Compilation Error"
          : "Wrong Answer")
      )
  );

  const verdict: DsaVerdictStatus = isOk
    ? "Accepted"
    : (priority.find((v) => failedVerdicts.has(v)) ?? "Wrong Answer");

  const mems = results.map((r) => r.memoryUsedKb).filter((v): v is number => v !== undefined);

  return {
    total,
    passed,
    failed: total - passed,
    executionTimeMs: Math.round(totalTimeMs * 100) / 100,
    memoryUsedKb: mems.length > 0 ? Math.max(...mems) : undefined,
    results,
    status: isOk ? "passed" : "failed",
    verdict,
  };
}
