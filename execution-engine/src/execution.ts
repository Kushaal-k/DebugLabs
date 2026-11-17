import fs from "node:fs";
import path from "node:path";
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
};

const DEFAULT_ENTRYPOINTS: Record<SUPPORTED_LANGUAGES, string> = {
  javascript: "index.js",
  python: "main.py",
  java: "Main.java",
  cpp: "main.cpp",
};

export async function isDockerAvailable(): Promise<boolean> {
  const socketPath = "/var/run/docker.sock";
  try {
    if (!fs.existsSync(socketPath)) {
      return false;
    }
    const pingPromise = docker.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Docker ping timed out")), 1000)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}

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
    let currentDir = "";
    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
      if (!createdDirs.has(currentDir)) {
        createdDirs.add(currentDir);
        pack.entry({
          name: currentDir,
          type: "directory",
          uid: 1000,
          gid: 1000,
          mode: 0o755,
        });
      }
    }

    const contentBuffer = Buffer.from(file.content, "utf-8");
    pack.entry(
      {
        name: fullEntryPath,
        size: contentBuffer.length,
        uid: 1000,
        gid: 1000,
        mode: 0o644,
      },
      contentBuffer
    );
  }

  pack.finalize();

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pack.on("data", (chunk: Buffer) => chunks.push(chunk));
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);
  });
}

export function demuxDockerStream(buffer: Buffer): { stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";
  let offset = 0;

  while (offset + 8 <= buffer.length) {
    const streamType = buffer.readUInt8(offset);
    const frameSize = buffer.readUInt32BE(offset + 4);
    offset += 8;

    if (offset + frameSize > buffer.length) {
      break;
    }

    const payload = buffer.subarray(offset, offset + frameSize).toString("utf-8");
    offset += frameSize;

    if (streamType === 1) {
      stdout += payload;
    } else if (streamType === 2) {
      stderr += payload;
    }
  }

  if (!stdout && !stderr && buffer.length > 0) {
    stdout = buffer.toString("utf-8");
  }

  return { stdout, stderr };
}

async function ensureImageExists(image: string): Promise<void> {
  try {
    await docker.getImage(image).inspect();
  } catch {
    console.log(`[execution engine] Pulling ${image}...`);
    const stream = await docker.pull(image);
    await new Promise<void>((resolve, reject) => {
      docker.modem.followProgress(stream, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

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

export async function executeLocally(
  payload: ExecutionPayload,
  entrypoint: string,
  files: ExecutionFile[]
): Promise<ExecutionResult> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "debuglabs-run-"));
  const startTime = performance.now();
  let stdoutResult = "";
  let stderrResult = "";
  let exitCode: number | null = 1;
  let status: "Completed" | "Failed" = "Failed";

  try {
    for (const file of files) {
      const cleanPath = sanitizeRelativePath(file.path);
      const targetPath = path.join(tempDir, cleanPath);
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, file.content, "utf-8");
    }

    let bin = "node";
    let args: string[] = [];

    if (payload.command) {
      bin = "sh";
      args = ["-c", payload.command];
    } else {
      switch (payload.language) {
        case "javascript":
          bin = "node";
          args = [path.join(tempDir, entrypoint)];
          break;
        case "python":
          bin = "python3";
          args = [path.join(tempDir, entrypoint)];
          break;
        case "cpp":
          bin = "sh";
          args = [
            "-c",
            `rm -rf "${tempDir}/out" && mkdir -p "${tempDir}/out" && g++ -O2 -o "${tempDir}/out/main" $(find "${tempDir}" -name '*.cpp') && "${tempDir}/out/main"`,
          ];
          break;
        case "java":
          bin = "sh";
          args = [
            "-c",
            `rm -rf "${tempDir}/out" && mkdir -p "${tempDir}/out" && javac $(find "${tempDir}" -name '*.java') -d "${tempDir}/out" && java -cp "${tempDir}/out" Main`,
          ];
          break;
        default:
          bin = "node";
          args = [path.join(tempDir, entrypoint)];
          break;
      }
    }

    const rootNodeModules = path.resolve(process.cwd(), "node_modules");
    const parentNodeModules = path.resolve(process.cwd(), "../node_modules");
    const nodePath = [
      rootNodeModules,
      parentNodeModules,
      process.env.NODE_PATH || "",
    ]
      .filter(Boolean)
      .join(":");

    const child = spawn(bin, args, {
      cwd: tempDir,
      env: {
        ...process.env,
        PORT: process.env.PORT || "3000",
        NODE_PATH: nodePath,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (payload.stdin && child.stdin) {
      child.stdin.write(payload.stdin);
      child.stdin.end();
    }

    child.stdout?.on("data", (chunk: Buffer) => {
      if (stdoutResult.length < MAX_OUTPUT_SIZE) {
        stdoutResult += chunk.toString("utf-8");
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderrResult.length < MAX_OUTPUT_SIZE) {
        stderrResult += chunk.toString("utf-8");
      }
    });

    await new Promise<void>((resolve) => {
      let isDone = false;

      const finish = (code: number | null) => {
        if (isDone) return;
        isDone = true;
        exitCode = code;
        resolve();
      };

      child.on("error", (err) => {
        stderrResult += `\n${err.message}`;
        finish(1);
      });

      child.on("close", (code) => {
        finish(code ?? 0);
      });

      const serverTimer = setTimeout(() => {
        if (!isDone && (stdoutResult.includes("Server listening") || stdoutResult.includes("listening on") || stdoutResult.includes("listening"))) {
          child.kill("SIGTERM");
          finish(0);
        }
      }, 1500);

      const timeoutTimer = setTimeout(() => {
        clearTimeout(serverTimer);
        if (!isDone) {
          child.kill("SIGKILL");
          finish(stdoutResult.length > 0 && stderrResult.length === 0 ? 0 : 124);
        }
      }, EXECUTION_TIMEOUT_MS);
    });

    status = exitCode === 0 ? "Completed" : "Failed";
  } catch (err) {
    status = "Failed";
    stderrResult += err instanceof Error ? err.message : String(err);
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }

  return {
    status,
    stdout: stdoutResult,
    error: stderrResult,
    executionTime: performance.now() - startTime,
    memoryUsed: process.memoryUsage().heapUsed,
    exitCode,
  };
}

export async function executeCode(payload: ExecutionPayload): Promise<ExecutionResult> {
  const { language, stdin } = payload;
  const entrypoint = payload.entrypoint || DEFAULT_ENTRYPOINTS[language];
  const files: ExecutionFile[] =
    payload.files && payload.files.length > 0
      ? payload.files
      : [{ path: entrypoint, content: payload.code ?? "" }];

  const dockerReady = await isDockerAvailable();
  if (!dockerReady) {
    console.log("[execution engine] Docker is not available. Using local sandbox fallback.");
    return executeLocally(payload, entrypoint, files);
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
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    if (
      errorMsg.includes("docker.sock") ||
      errorMsg.includes("ENOENT") ||
      errorMsg.includes("ECONNREFUSED") ||
      errorMsg.includes("connect")
    ) {
      console.warn("[execution engine] Docker daemon unavailable, falling back to local sandbox execution.");
      return executeLocally(payload, entrypoint, files);
    }
    status = "Failed";
    stderrResult = errorMsg;
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
