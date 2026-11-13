export interface ServiceStatus {
  service: string;
  status: "ok";
}

export type SUPPORTED_LANGUAGES = "javascript" | "python" | "java" | "cpp";
export type SupportedLanguage = SUPPORTED_LANGUAGES;

export interface ExecutionFile {
  path: string;
  content: string;
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