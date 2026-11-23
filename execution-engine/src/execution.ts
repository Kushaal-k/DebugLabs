import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { spawn } from "node:child_process";
import Dockerode from "dockerode";
import tar from "tar-stream";
import type {
  ExecutionFile,
  ExecutionPayload,
  ExecutionResult,
  SUPPORTED_LANGUAGES,
} from "@debugLabs/shared";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

export const WORKSPACE_DIR = "/tmp/workspace";
const EXECUTION_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_SIZE = 1024 * 1024;

const LANGUAGE_IMAGES: Record<SUPPORTED_LANGUAGES, string> = {
  javascript: "node:24-slim",
  python: "python:3.12-slim",
  java: "eclipse-temurin:21-jdk",
  cpp: "gcc:14",
  c: "gcc:14",
  csharp: "mcr.microsoft.com/dotnet/sdk:8.0-alpine",
};

const DEFAULT_ENTRYPOINTS: Record<SUPPORTED_LANGUAGES, string> = {
  javascript: "index.js",
  python: "main.py",
  java: "Main.java",
  cpp: "main.cpp",
  c: "main.c",
  csharp: "Program.cs",
};

function sanitizeRelativePath(rawPath: string): string {
  const normalized = path.posix.normalize(rawPath).replace(/^\/+/, "");
  if (
    !normalized ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    throw new Error(`Invalid file path: "${rawPath}"`);
  }
  return normalized;
}

export async function createWorkspaceArchive(files: readonly ExecutionFile[]): Promise<Buffer> {
  const pack = tar.pack();
  const createdDirs = new Set<string>(["workspace"]);

  pack.entry({
    name: "workspace",
    type: "directory",
    uid: 1000,
    gid: 1000,
    mode: 0o755,
  });

  for (const file of files) {
    const entryPath = sanitizeRelativePath(file.path);
    const fullEntryPath = `workspace/${entryPath}`;

    const parts = fullEntryPath.split("/");
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i).join("/");
      if (!createdDirs.has(dirPath)) {
        createdDirs.add(dirPath);
        pack.entry({
          name: dirPath,
          type: "directory",
          uid: 1000,
          gid: 1000,
          mode: 0o755,
        });
      }
    }

    pack.entry(
      {
        name: fullEntryPath,
        uid: 1000,
        gid: 1000,
        mode: 0o644,
      },
      file.content
    );
  }

  pack.finalize();

  const chunks: Buffer[] = [];
  for await (const chunk of pack) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }

  return Buffer.concat(chunks);
}

const STREAM_HEADER_SIZE = 8;
const STREAM_TYPE_STDERR = 2;

export function demuxDockerStream(buffer: Buffer): { stdout: string; stderr: string } {
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  let offset = 0;

  while (offset + STREAM_HEADER_SIZE <= buffer.length) {
    const streamType = buffer[offset];
    const payloadLength = buffer.readUInt32BE(offset + 4);
    const payloadStart = offset + STREAM_HEADER_SIZE;
    const payloadEnd = payloadStart + payloadLength;

    if (streamType === undefined || streamType > STREAM_TYPE_STDERR || payloadEnd > buffer.length) {
      stdoutChunks.push(buffer.subarray(offset));
      return {
        stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
      };
    }

    const payload = buffer.subarray(payloadStart, payloadEnd);
    (streamType === STREAM_TYPE_STDERR ? stderrChunks : stdoutChunks).push(payload);
    offset = payloadEnd;
  }

  if (offset < buffer.length) {
    stdoutChunks.push(buffer.subarray(offset));
  }

  return {
    stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
    stderr: Buffer.concat(stderrChunks).toString("utf-8"),
  };
}

const activePulls = new Map<string, Promise<void>>();

export const ensureImageExists = async (image: string): Promise<void> => {
  try {
    await docker.getImage(image).inspect();
    return;
  } catch {
    // Image not present locally; pull below
  }

  let pullPromise = activePulls.get(image);
  if (!pullPromise) {
    pullPromise = (async () => {
      console.log(`[execution engine] Pulling ${image}...`);
      const stream = await docker.pull(image);
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
      console.log(`[execution engine] Pulled ${image} successfully.`);
    })().finally(() => {
      activePulls.delete(image);
    });

    activePulls.set(image, pullPromise);
  }

  await pullPromise;
};

function resolveRunCommand(payload: ExecutionPayload, entrypoint: string): string[] {
  if (payload.command) {
    return ["sh", "-c", payload.command];
  }

  const safeEntrypoint = sanitizeRelativePath(entrypoint);

  switch (payload.language) {
    case "javascript":
      return ["node", `${WORKSPACE_DIR}/${safeEntrypoint}`];
    case "python":
      return ["python3", `${WORKSPACE_DIR}/${safeEntrypoint}`];
    case "cpp":
      return [
        "sh",
        "-c",
        `rm -rf /tmp/out && mkdir -p /tmp/out && g++ -O2 -o /tmp/out/main $(find ${WORKSPACE_DIR} -name '*.cpp') && /tmp/out/main`,
      ];
    case "java": {
      const mainClass = safeEntrypoint.replace(/\.java$/, "").replace(/\//g, ".");
      return [
        "sh",
        "-c",
        `rm -rf /tmp/out && mkdir -p /tmp/out && javac $(find ${WORKSPACE_DIR} -name '*.java') -d /tmp/out && java -cp /tmp/out ${mainClass}`,
      ];
    }
    default:
      return ["node", `${WORKSPACE_DIR}/${safeEntrypoint}`];
  }
}

async function executeLocally(
  payload: ExecutionPayload,
  files: readonly ExecutionFile[],
  entrypoint: string
): Promise<ExecutionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "debuglabs-exec-"));
  const startTime = performance.now();
  try {
    for (const file of files) {
      const fullPath = path.join(tmpDir, sanitizeRelativePath(file.path));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, "utf-8");
    }

    const safeEntrypoint = sanitizeRelativePath(entrypoint);
    let cmd = "";
    let args: string[] = [];

    if (payload.command) {
      cmd = "sh";
      args = ["-c", payload.command];
    } else {
      switch (payload.language) {
        case "javascript":
          cmd = process.execPath;
          args = [path.join(tmpDir, safeEntrypoint)];
          break;
        case "python":
          cmd = "python3";
          args = [path.join(tmpDir, safeEntrypoint)];
          break;
        case "cpp":
          cmd = "sh";
          args = [
            "-c",
            `g++ -O2 -std=c++20 "${path.join(tmpDir, safeEntrypoint)}" -o "${path.join(tmpDir, "main")}" && "${path.join(tmpDir, "main")}"`,
          ];
          break;
        case "java": {
          const mainClass = safeEntrypoint.replace(/\.java$/, "").replace(/\//g, ".");
          cmd = "sh";
          args = [
            "-c",
            `javac -d "${tmpDir}" "${path.join(tmpDir, safeEntrypoint)}" && java -cp "${tmpDir}" ${mainClass}`,
          ];
          break;
        }
        case "c":
          cmd = "sh";
          args = [
            "-c",
            `gcc -O2 "${path.join(tmpDir, safeEntrypoint)}" -o "${path.join(tmpDir, "main")}" && "${path.join(tmpDir, "main")}"`,
          ];
          break;
        default:
          cmd = process.execPath;
          args = [path.join(tmpDir, safeEntrypoint)];
          break;
      }
    }

    return await new Promise<ExecutionResult>((resolve) => {
      const child = spawn(cmd, args, {
        cwd: tmpDir,
        env: {
          ...process.env,
          PORT: "3000",
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout?.on("data", (chunk) => stdoutChunks.push(chunk));
      child.stderr?.on("data", (chunk) => stderrChunks.push(chunk));

      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, EXECUTION_TIMEOUT_MS);

      child.on("close", (code) => {
        clearTimeout(timer);
        const executionTime = performance.now() - startTime;
        const stdout = Buffer.concat(stdoutChunks).toString("utf-8").slice(0, MAX_OUTPUT_SIZE);
        let error = Buffer.concat(stderrChunks).toString("utf-8").slice(0, MAX_OUTPUT_SIZE);
        if (timedOut) {
          error = `Execution timed out after ${EXECUTION_TIMEOUT_MS}ms`;
        }

        resolve({
          status: code === 0 && !timedOut ? "Completed" : "Failed",
          stdout,
          error,
          executionTime,
          memoryUsed: 0,
          exitCode: code,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          status: "Failed",
          stdout: "",
          error: err.message,
          executionTime: performance.now() - startTime,
          memoryUsed: 0,
          exitCode: 1,
        });
      });

      if (payload.stdin !== undefined) {
        child.stdin?.write(payload.stdin);
        child.stdin?.end();
      } else {
        child.stdin?.end();
      }
    });
  } catch (err: any) {
    return {
      status: "Failed",
      stdout: "",
      error: err.message || "Local execution failed",
      executionTime: performance.now() - startTime,
      memoryUsed: 0,
      exitCode: 1,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function executeCode(payload: ExecutionPayload): Promise<ExecutionResult> {
  const { language, stdin } = payload;
  const entrypoint = payload.entrypoint || DEFAULT_ENTRYPOINTS[language];
  const files: ExecutionFile[] =
    payload.files && payload.files.length > 0
      ? payload.files
      : [{ path: entrypoint, content: payload.code ?? "" }];

  let isDockerUnavailable = false;
  try {
    await docker.ping();
  } catch {
    isDockerUnavailable = true;
  }

  if (isDockerUnavailable || process.env.USE_LOCAL_EXECUTION === "true") {
    return await executeLocally(payload, files, entrypoint);
  }

  const image = LANGUAGE_IMAGES[language];
  const hasStdin = stdin !== undefined;

  let status: "Completed" | "Failed" = "Failed";
  let stdoutResult = "";
  let stderrResult = "";
  let executionTime = 0;
  let memoryUsage = 0;
  let exitCode: number | null = null;
  let container: Dockerode.Container | undefined;

  try {
    if (!image) throw new Error(`Unsupported language: ${language}`);
    await ensureImageExists(image);

    const archive = await createWorkspaceArchive(files);
    const cmd = resolveRunCommand(payload, entrypoint);

    container = await docker.createContainer({
      Image: image,
      User: "1000:1000",
      WorkingDir: WORKSPACE_DIR,
      Env: [
        "NODE_PATH=/tmp/workspace/node_modules",
        "PORT=3000",
        "PYTHONPATH=/tmp/workspace",
      ],
      HostConfig: {
        Runtime: "runc",
        Memory: 512 * 1024 * 1024,
        MemorySwap: 512 * 1024 * 1024,
        CpuQuota: 100000,
        PidsLimit: 64,
      },
      NetworkDisabled: true,
      StopTimeout: Math.ceil(EXECUTION_TIMEOUT_MS / 1000),
      Cmd: cmd,
      AttachStdin: hasStdin,
      OpenStdin: hasStdin,
      StdinOnce: hasStdin,
    });

    await container.putArchive(archive, { path: "/tmp" });

    let stdinStream: NodeJS.ReadWriteStream | undefined;
    if (hasStdin) {
      stdinStream = await container.attach({
        stream: true,
        stdin: true,
        hijack: true,
      });
      stdinStream.on("error", () => {});
    }

    const startTime = performance.now();
    await container.start();

    if (stdinStream) {
      if (stdin && stdin.length > 0) {
        stdinStream.write(stdin);
      }
      stdinStream.end();
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const waitResult = await Promise.race([
      container.wait().finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(async () => {
          await container?.kill().catch(() => {});
          reject(new Error(`Execution timed out after ${EXECUTION_TIMEOUT_MS}ms`));
        }, EXECUTION_TIMEOUT_MS);
      }),
    ]);

    exitCode = waitResult.StatusCode;
    executionTime = performance.now() - startTime;
    status = exitCode === 0 ? "Completed" : "Failed";

    try {
      const stats = await container.stats({ stream: false });
      memoryUsage = stats.memory_stats?.max_usage ?? stats.memory_stats?.usage ?? 0;
    } catch {
      memoryUsage = 0;
    }

    const rawLogs = (await container.logs({
      stdout: true,
      stderr: true,
    })) as unknown as Buffer;

    const demuxed = demuxDockerStream(Buffer.isBuffer(rawLogs) ? rawLogs : Buffer.from(rawLogs));
    stdoutResult = demuxed.stdout.slice(0, MAX_OUTPUT_SIZE);
    stderrResult = demuxed.stderr.slice(0, MAX_OUTPUT_SIZE);
  } catch (error) {
    status = "Failed";
    stderrResult = error instanceof Error ? error.message : "Unknown error";
  } finally {
    if (container) {
      await container.remove({ force: true }).catch(() => {});
    }
  }

  return {
    status,
    stdout: stdoutResult,
    error: stderrResult,
    executionTime,
    memoryUsed: memoryUsage,
    exitCode,
  };
}
