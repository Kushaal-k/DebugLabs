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

export interface TerminalCreatePayload {
  roomId: string;
  cols?: number;
  rows?: number;
  language?: SupportedLanguage;
  workspaceId?: string;
  initialFiles?: readonly ExecutionFile[];
}

export interface TerminalDataPayload {
  sessionId: string;
  data: string;
}

export interface TerminalResizePayload {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface TerminalKillPayload {
  sessionId: string;
}

export interface TerminalOutputPayload {
  sessionId: string;
  data: string;
}

export interface TerminalExitPayload {
  sessionId: string;
  exitCode: number | null;
}

export interface TerminalClientToServerEvents {
  "terminal:create": (payload: TerminalCreatePayload) => void;
  "terminal:data": (payload: TerminalDataPayload) => void;
  "terminal:resize": (payload: TerminalResizePayload) => void;
  "terminal:kill": (payload: TerminalKillPayload) => void;
}

export interface TerminalServerToClientEvents {
  "terminal:created": (payload: { sessionId: string }) => void;
  "terminal:output": (payload: TerminalOutputPayload) => void;
  "terminal:exit": (payload: TerminalExitPayload) => void;
  "terminal:error": (payload: { sessionId?: string; error: string }) => void;
}
