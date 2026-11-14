import Dockerode from "dockerode";
import tar from "tar-stream";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import type {
  ExecutionFile,
  ExecutionPayload,
  ExecutionResult,
  SUPPORTED_LANGUAGES,
} from "@debugLabs/shared";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

export const WORKSPACE_DIR = "/tmp/workspace";

const LANGUAGE_IMAGES: Record<SUPPORTED_LANGUAGES, string> = {
  javascript: "node:24-slim",
  python: "python:3.12-slim",
  java: "openjdk:21",
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

export async function createWorkspaceArchive(files: readonly ExecutionFile[]): Promise<Buffer> {
  const pack = tar.pack();

  for (const file of files) {
    const entryPath = file.path.replace(/^\/+/, "");
    pack.entry({ name: `workspace/${entryPath}` }, file.content);
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

export const ensureImageExists = async (image: string): Promise<void> => {
  try {
    await docker.getImage(image).inspect();
  } catch {
    console.log(`[execution engine] Pulling ${image}...`);
    const stream = await docker.pull(image);
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
    console.log(`[execution engine] Pulled ${image} successfully.`);
  }
};

function resolveRunCommand(payload: ExecutionPayload, entrypoint: string): string[] {
  if (payload.command) {
    return ["sh", "-c", payload.command];
  }

  switch (payload.language) {
    case "javascript":
      return ["node", `${WORKSPACE_DIR}/${entrypoint}`];
    case "python":
      return ["python3", `${WORKSPACE_DIR}/${entrypoint}`];
    case "cpp":
      return [
        "sh",
        "-c",
        `rm -rf /tmp/out && mkdir -p /tmp/out && g++ -O2 -o /tmp/out/main $(find ${WORKSPACE_DIR} -name '*.cpp') && /tmp/out/main`,
      ];
    case "java":
      return [
        "sh",
        "-c",
        `rm -rf /tmp/out && mkdir -p /tmp/out && javac $(find ${WORKSPACE_DIR} -name '*.java') -d /tmp/out && java -cp /tmp/out Main`,
      ];
    default:
      return ["node", `${WORKSPACE_DIR}/${entrypoint}`];
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
      const cleanPath = file.path.replace(/^\/+/, "");
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
      process.env.NODE_PATH || "",
      rootNodeModules,
      parentNodeModules,
    ]
      .filter(Boolean)
      .join(":");

    const child = spawn(bin, args, {
      cwd: tempDir,
      env: {
        ...process.env,
        PORT: process.env.PORT,
        NODE_PATH: nodePath,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (payload.stdin && child.stdin) {
      child.stdin.write(payload.stdin);
      child.stdin.end();
    }

    const MAX_OUTPUT_SIZE = 1024 * 1024;

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

      const serverCheckTimer = setTimeout(() => {
        if (!isDone) {
          if (
            stdoutResult.includes("Server listening") ||
            stdoutResult.includes("listening on") ||
            stdoutResult.includes("listening")
          ) {
            child.kill("SIGTERM");
            finish(0);
          }
        }
      }, 1500);

      const hardTimeoutTimer = setTimeout(() => {
        clearTimeout(serverCheckTimer);
        if (!isDone) {
          child.kill("SIGKILL");
          if (stderrResult.length === 0 && stdoutResult.length > 0) {
            finish(0);
          } else {
            stderrResult += "\n[Execution timeout]: Process ran longer than 5 seconds.";
            finish(124);
          }
        }
      }, 5000);
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

  const executionTime = performance.now() - startTime;

  return {
    status,
    stdout: stdoutResult,
    error: stderrResult,
    executionTime,
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
    console.log("[execution engine] Docker is not available. Using local sandbox execution fallback.");
    return executeLocally(payload, entrypoint, files);
  }

  const image = LANGUAGE_IMAGES[language];
  let status: "Completed" | "Failed" = "Failed";
  let stdoutResult = "";
  let stderrResult = "";
  let executionTime = 0;
  let memoryUsage = 0;
  let exitCode: number | null = 1;

  try {
    await ensureImageExists(image);

    const archive = await createWorkspaceArchive(files);
    const startTime = performance.now();
    const cmd = resolveRunCommand(payload, entrypoint);

    const container = await docker.createContainer({
      Image: image,
      User: "1000",
      WorkingDir: WORKSPACE_DIR,
      HostConfig: {
        Runtime: "runc",
        Memory: 512 * 1024 * 1024,
        CpuQuota: 100000,
      },
      NetworkDisabled: true,
      StopTimeout: 10000,
      Cmd: cmd,
      AttachStdin: Boolean(stdin),
      OpenStdin: Boolean(stdin),
      StdinOnce: Boolean(stdin),
    });

    await container.putArchive(archive, { path: "/tmp" });

    let stdinStream: NodeJS.ReadWriteStream | undefined;
    if (stdin) {
      stdinStream = await container.attach({
        stream: true,
        stdin: true,
        stdout: false,
        stderr: false,
      });
    }

    await container.start();

    if (stdinStream && stdin) {
      stdinStream.write(stdin);
      stdinStream.end();
    }

    const waitResult = await container.wait();
    exitCode = waitResult.StatusCode;
    executionTime = performance.now() - startTime;
    status = exitCode === 0 ? "Completed" : "Failed";

    try {
      const stats = await container.stats({ stream: false });
      memoryUsage = stats.memory_stats?.max_usage ?? 0;
    } catch {
      memoryUsage = 0;
    }

    const rawLogs = (await container.logs({
      stdout: true,
      stderr: true,
    })) as unknown as Buffer;

    const demuxed = demuxDockerStream(Buffer.isBuffer(rawLogs) ? rawLogs : Buffer.from(rawLogs));
    const MAX_OUTPUT_SIZE = 1024 * 1024;
    stdoutResult = demuxed.stdout.slice(0, MAX_OUTPUT_SIZE);
    stderrResult = demuxed.stderr.slice(0, MAX_OUTPUT_SIZE);

    await container.remove({ force: true });
  } catch (error) {
    status = "Failed";
    stderrResult = error instanceof Error ? error.message : "Unknown error";
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
