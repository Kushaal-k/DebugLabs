import type { Request, Response } from "express";
import crypto from "node:crypto";
import type {
  BatchExecutionPayload,
  BatchExecutionResult,
  DsaRunRequest,
  DsaRunSummary,
  DsaSubmissionResult,
  DsaTestCase,
  DsaVerifyRequest,
  SupportedLanguage,
} from "@debugLabs/shared";
import {
  getDsaProblemSummaries,
  getDsaProblemForClient,
  getDsaProblemWithHidden,
  evaluateTestCase,
  summarizeRun,
} from "../challenges/dsa/index.js";

const EXEC_URL = process.env.EXECUTION_ENGINE_URL || "http://127.0.0.1:3002";

async function executeBatchViaEngine(
  payload: BatchExecutionPayload
): Promise<BatchExecutionResult> {
  const res = await fetch(`${EXEC_URL}/execute-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine error (${res.status}): ${text}`);
  }

  return (await res.json()) as BatchExecutionResult;
}

async function runCases(
  language: SupportedLanguage,
  code: string,
  cases: DsaTestCase[],
  limits?: { timeLimitMs?: number; memoryLimitMb?: number }
): Promise<DsaRunSummary> {
  const batch = await executeBatchViaEngine({
    language,
    code,
    cases: cases.map((tc) => ({
      id: tc.id,
      stdin: tc.input,
      timeLimitMs: limits?.timeLimitMs,
    })),
  });

  const byId = new Map(batch.results.map((r) => [r.id, r]));
  const results = cases.map((tc) => {
    const out = byId.get(tc.id) ?? {
      id: tc.id,
      status: "Failed" as const,
      stdout: "",
      error: batch.compileError || "Missing execution result",
      executionTime: 0,
      memoryUsed: 0,
      exitCode: 1,
    };
    return evaluateTestCase(out.stdout, out.error, out.exitCode, out.executionTime, tc, {
      memoryUsedBytes: out.memoryUsed,
      timeLimitMs: limits?.timeLimitMs,
      memoryLimitMb: limits?.memoryLimitMb,
    });
  });

  const totalTime = results.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0);
  return summarizeRun(results, totalTime);
}

export const getProblems = async (req: Request, res: Response) => {
  try {
    const { difficulty, category, search } = req.query;
    const list = getDsaProblemSummaries({
      difficulty: typeof difficulty === "string" ? difficulty : undefined,
      category: typeof category === "string" ? category : undefined,
      search: typeof search === "string" ? search : undefined,
    });
    res.json(list);
  } catch {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
};

export const getProblemById = async (req: Request<{ id: string }>, res: Response) => {
  const problem = getDsaProblemForClient(req.params.id);
  if (!problem) return res.status(404).json({ error: "Problem not found" });
  res.json(problem);
};

export const runProblem = async (
  req: Request<{ id: string }, {}, DsaRunRequest>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { language, code, customTestCases } = req.body;
    if (!language || !code) return res.status(400).json({ error: "Missing language or code" });

    const problem = getDsaProblemWithHidden(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const cases = customTestCases?.length ? customTestCases : problem.testCases;
    const summary = await runCases(language, code, cases, {
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
    });
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to run test cases" });
  }
};

export const submitProblem = async (
  req: Request<{ id: string }, {}, DsaVerifyRequest>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { language, code } = req.body;
    if (!language || !code) return res.status(400).json({ error: "Missing language or code" });

    const problem = getDsaProblemWithHidden(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const allCases = [...problem.testCases, ...(problem.hiddenTestCases || [])];
    const summary = await runCases(language, code, allCases, {
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
    });

    const result: DsaSubmissionResult = {
      submissionId: crypto.randomUUID(),
      problemId: id,
      status: summary.verdict || (summary.status === "passed" ? "Accepted" : "Wrong Answer"),
      passedCount: summary.passed,
      totalCount: summary.total,
      executionTimeMs: summary.executionTimeMs,
      memoryUsedKb: summary.memoryUsedKb,
      details: summary.results,
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to submit solution" });
  }
};
