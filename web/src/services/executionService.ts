import type { ProjectFile } from '../types/workspace';
import type {
  ExecutionFile,
  ExecutionPayload,
  ExecutionResult as SharedExecutionResult,
} from '@debugLabs/shared';

export type EngineMode = 'auto' | 'direct' | 'queue';

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryMb: number;
  modeUsed: 'direct' | 'queue';
  passedTests?: number;
  totalTests?: number;
}

const ENGINE_URL =
  (import.meta.env.VITE_ENGINE_URL as string | undefined)?.replace(/\/+$/, '') ||
  '/api/engine';

const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/+$/, '') ||
  '/api';

function detectLanguage(file?: ProjectFile | null): 'javascript' | 'python' | 'java' | 'cpp' {
  if (!file) return 'javascript';
  const name = file.name.toLowerCase();
  if (name.endsWith('.py') || file.language === 'python') return 'python';
  if (name.endsWith('.java') || file.language === 'java') return 'java';
  if (name.endsWith('.cpp') || name.endsWith('.cc') || file.language === 'cpp') return 'cpp';
  return 'javascript';
}

function buildPayload(files: ProjectFile[]): ExecutionPayload {
  const executionFiles: ExecutionFile[] = files.map((f) => ({
    path: f.folder === 'root' ? f.name : `${f.folder}/${f.name}`,
    content: f.content,
  }));

  // Identify primary executable file
  const preferred = executionFiles.find((f) =>
    f.path === 'server/index.js' || f.path.endsWith('index.js')
  );
  const entrypoint = preferred ? preferred.path : executionFiles[0]?.path || 'index.js';
  const activeFile = files.find((f) =>
    (f.folder === 'root' ? f.name : `${f.folder}/${f.name}`) === entrypoint
  );
  const language = detectLanguage(activeFile);
  const code = activeFile?.content || executionFiles.find((f) => f.path === entrypoint)?.content || '';

  return {
    code,
    language,
    entrypoint,
    files: executionFiles,
  };
}

async function executeDirect(payload: ExecutionPayload): Promise<ExecutionResult> {
  const res = await fetch(`${ENGINE_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Direct execution failed (${res.status}): ${errorText || res.statusText}`);
  }

  const data: SharedExecutionResult = await res.json();
  const exitCode = data.exitCode ?? (data.status === 'Completed' ? 0 : 1);

  return {
    success: data.status === 'Completed' && exitCode === 0,
    stdout: data.stdout || '',
    stderr: data.error || '',
    exitCode,
    executionTimeMs: Math.round(data.executionTime || 0),
    memoryMb: Number(((data.memoryUsed || 0) / (1024 * 1024)).toFixed(1)),
    modeUsed: 'direct',
  };
}

async function executeQueue(payload: ExecutionPayload, maxAttempts = 30): Promise<ExecutionResult> {
  const submitRes = await fetch(`${SERVER_URL}/v1/jobs/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    throw new Error(`Queue submission failed (${submitRes.status}): ${errorText || submitRes.statusText}`);
  }

  const { jobId } = await submitRes.json();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 800));
    const statusRes = await fetch(`${SERVER_URL}/v1/jobs/${jobId}`);
    if (!statusRes.ok) continue;

    const job = await statusRes.json();
    if (job.status === 'Completed' || job.status === 'Failed') {
      const exitCode = job.exitCode ?? (job.status === 'Completed' ? 0 : 1);
      return {
        success: job.status === 'Completed' && exitCode === 0,
        stdout: job.stdout || '',
        stderr: job.error || '',
        exitCode,
        executionTimeMs: Math.round(job.executionTime || 0),
        memoryMb: Number(((job.memoryUsed || 0) / (1024 * 1024)).toFixed(1)),
        modeUsed: 'queue',
      };
    }
  }

  throw new Error(`Execution timed out waiting for queue job ${jobId}`);
}

export async function runProjectVerification(
  files: ProjectFile[],
  mode: EngineMode = 'auto'
): Promise<ExecutionResult> {
  const payload = buildPayload(files);

  if (mode === 'direct') {
    return await executeDirect(payload);
  }

  if (mode === 'queue') {
    return await executeQueue(payload);
  }

  // 'auto' mode: try direct first, fall back to queue if direct fails
  try {
    return await executeDirect(payload);
  } catch (directErr) {
    console.warn('Direct execution failed, attempting queue:', directErr);
    try {
      return await executeQueue(payload);
    } catch {
      throw directErr;
    }
  }
}
