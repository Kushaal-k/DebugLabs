import type { Request, Response } from "express";
import crypto from "node:crypto";
import type {
  DsaRunRequest,
  DsaRunSummary,
  DsaSubmissionResult,
  DsaTestCase,
  DsaTestCaseResult,
  DsaVerifyRequest,
  ExecutionPayload,
  ExecutionResult,
  SupportedLanguage,
} from "@debugLabs/shared";
import {
  getDsaProblemSummaries,
  getDsaProblemForClient,
  getDsaProblemWithHidden,
  buildDsaExecutionPayload,
  evaluateTestCase,
  summarizeRun,
} from "../challenges/dsa/index.js";

const EXEC_URL = process.env.EXECUTION_ENGINE_URL || "http://127.0.0.1:3002";

async function executeViaEngine(payload: ExecutionPayload): Promise<ExecutionResult> {
  const res = await fetch(`${EXEC_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine error (${res.status}): ${text}`);
  }

  return (await res.json()) as ExecutionResult;
}

async function runCases(
  language: SupportedLanguage,
  code: string,
  cases: DsaTestCase[]
): Promise<DsaRunSummary> {
  const results: DsaTestCaseResult[] = [];
  let totalTime = 0;

  for (const tc of cases) {
    const payload = buildDsaExecutionPayload(language, code, tc.input);
    const out = await executeViaEngine(payload);
    totalTime += out.executionTime || 0;
    const tcResult = evaluateTestCase(
      out.stdout,
      out.error,
      out.exitCode,
      out.executionTime,
      tc
    );
    results.push(tcResult);
  }

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
    const summary = await runCases(language, code, cases);
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
    const summary = await runCases(language, code, allCases);

    const result: DsaSubmissionResult = {
      submissionId: crypto.randomUUID(),
      problemId: id,
      status: summary.verdict || (summary.status === "passed" ? "Accepted" : "Wrong Answer"),
      passedCount: summary.passed,
      totalCount: summary.total,
      executionTimeMs: summary.executionTimeMs,
      details: summary.results,
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to submit solution" });
  }
};
