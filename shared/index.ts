export interface ServiceStatus {
  service: string;
  status: "ok";
}

export type SUPPORTED_LANGUAGES = "javascript" | "python" | "java" | "cpp" | "c" | "csharp";
export type SupportedLanguage = SUPPORTED_LANGUAGES;

export const SUPPORTED_LANGUAGES_LIST: readonly SupportedLanguage[] = [
  "javascript",
  "python",
  "java",
  "cpp",
  "c",
  "csharp",
] as const;

export const DSA_DIFFICULTIES: readonly DsaDifficulty[] = [
  "Easy",
  "Medium",
  "Hard",
] as const;

export interface ExecutionFile {
  path: string;
  content: string;
  readOnly?: boolean;
}

export interface ExecutionPayload {
  code?: string;
  files?: ExecutionFile[];
  entrypoint?: string;
  language: SUPPORTED_LANGUAGES;
  stdin?: string;
  command?: string;
}

export interface ExecutionResult {
  status: "Completed" | "Failed";
  stdout: string;
  error: string;
  executionTime: number;
  memoryUsed: number;
  exitCode: number | null;
}

export interface BatchExecutionCase {
  id: string;
  stdin: string;
  timeLimitMs?: number;
}

export interface BatchExecutionPayload extends ExecutionPayload {
  cases: BatchExecutionCase[];
}

export interface BatchExecutionCaseResult {
  id: string;
  status: "Completed" | "Failed";
  stdout: string;
  error: string;
  executionTime: number;
  memoryUsed: number;
  exitCode: number | null;
}

export interface BatchExecutionResult {
  compileError?: string;
  results: BatchExecutionCaseResult[];
}

export type DsaDifficulty = "Easy" | "Medium" | "Hard";

export type DsaVerdictStatus =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Runtime Error"
  | "Compilation Error"
  | "Internal Error";

export type DsaRunStatus = "passed" | "failed" | "error";

export interface DsaExample {
  id: number;
  input: string;
  output: string;
  explanation?: string;
}

export interface DsaTestCase {
  id: string;
  name?: string;
  input: string;
  expectedOutput: string;
  hidden?: boolean;
  isCustom?: boolean;
  explanation?: string;
}

export interface DsaTestCaseResult {
  testCaseId: string;
  testCaseName?: string;
  passed: boolean;
  verdict?: DsaVerdictStatus;
  actualOutput: string;
  expectedOutput: string;
  executionTimeMs: number;
  memoryUsedKb?: number;
  errorMessage?: string;
  hidden?: boolean;
}

export interface DsaRunSummary {
  total: number;
  passed: number;
  failed: number;
  executionTimeMs: number;
  memoryUsedKb?: number;
  results: DsaTestCaseResult[];
  status: DsaRunStatus;
  verdict?: DsaVerdictStatus;
}

export interface DsaProblem {
  id: string;
  title: string;
  difficulty: DsaDifficulty;
  category: string;
  tags: string[];
  description: string;
  bugDescription?: string;
  hints?: string[];
  entrypointMethod?: string;
  examples: DsaExample[];
  constraints: string[];
  starterCode: Partial<Record<SupportedLanguage, string>>;
  testCases: DsaTestCase[];
  hiddenTestCases?: DsaTestCase[];
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface DsaProblemSummary {
  id: string;
  title: string;
  difficulty: DsaDifficulty;
  category: string;
  tags: string[];
  solved?: boolean;
  description?: string;
  languages?: SupportedLanguage[];
}

export interface LanguageOption {
  id: SupportedLanguage;
  name: string;
  extension: string;
  version: string;
  monacoLanguage: string;
}

export interface DsaRunRequest {
  problemId: string;
  language: SupportedLanguage;
  code: string;
  customTestCases?: DsaTestCase[];
}

export interface DsaVerifyRequest {
  problemId: string;
  language: SupportedLanguage;
  code: string;
}

export interface DsaSubmissionResult {
  submissionId: string;
  problemId: string;
  status: DsaVerdictStatus;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  memoryUsedKb?: number;
  details?: DsaTestCaseResult[];
}
