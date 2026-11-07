export interface ServiceStatus {
  service: string;
  status: "ok";
}

export type SUPPORTED_LANGUAGES = "javascript" | "python" | "java" | "cpp";

export interface ExecutionPayload {
  code: string;
  language: SUPPORTED_LANGUAGES;
  stdin?: string;
}

export interface ExecutionResult {
  status: "Completed" | "Failed";
  stdout?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  exitCode?: number | null;
}