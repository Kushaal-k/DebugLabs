import type {
  DsaRunSummary,
  DsaTestCase,
  DsaTestCaseResult,
  ExecutionPayload,
  SupportedLanguage,
} from "@debugLabs/shared";

export function buildDsaExecutionPayload(
  language: SupportedLanguage,
  code: string,
  stdin: string
): ExecutionPayload {
  return { language, code, stdin };
}

export function evaluateTestCase(
  stdout: string,
  error: string,
  exitCode: number | null,
  timeMs: number,
  tc: DsaTestCase
): DsaTestCaseResult {
  const actual = (stdout || "").trim().replace(/\r\n/g, "\n");
  const expected = (tc.expectedOutput || "").trim().replace(/\r\n/g, "\n");
  const passed = actual === expected && exitCode === 0;

  return {
    testCaseId: tc.id,
    testCaseName: tc.name || tc.id,
    passed,
    actualOutput: actual || (error ? error.trim() : "No output"),
    expectedOutput: tc.expectedOutput.trim(),
    executionTimeMs: Math.round(timeMs * 100) / 100,
    errorMessage: passed ? undefined : (error || undefined),
    hidden: tc.hidden,
  };
}

export function summarizeRun(results: DsaTestCaseResult[], totalTimeMs: number): DsaRunSummary {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const isOk = passed === total;
  const hasError = results.some(
    (r) => r.errorMessage?.includes("error:") || r.errorMessage?.includes("javac")
  );

  return {
    total,
    passed,
    failed: total - passed,
    executionTimeMs: Math.round(totalTimeMs * 100) / 100,
    results,
    status: isOk ? "passed" : "failed",
    verdict: isOk ? "Accepted" : hasError ? "Compilation Error" : "Wrong Answer",
  };
}
