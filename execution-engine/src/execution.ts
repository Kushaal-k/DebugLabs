import Dockerode from "dockerode";
import { ResponseModel } from "./models/response.model.js";
import { PassThrough } from "node:stream";

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

export type SUPPORTED_LANGUAGES = "javascript" | "python" | "java" | "cpp";

const LANGUAGE_IMAGES: Record<SUPPORTED_LANGUAGES, string> = {
  javascript: "node:20",
  python: "python:3.12",
  java: "openjdk:21",
  cpp: "gcc:13",
};

const LANGUAGES_RUN_COMMANDS: Record<
    SUPPORTED_LANGUAGES,
    (code: string) => string[]
> = {
  javascript: (code) => ["node", "--input-type=module", "-e", code],
  python: (code) => ["python3", "-c", code],
  java: (code) => ["java", "-cp", code, "Main"],
  cpp: (code) => ["sh", "-c", `cat > /tmp/stdin.txt && echo '${code.replace(/'/g, "'\\''")}' > /tmp/main.cpp && g++ -o /tmp/main /tmp/main.cpp && /tmp/main < /tmp/stdin.txt`]
};

export const ensureImageExists = async (image: string): Promise<void> => {
    try {
        console.log(`[execution engine] Checking for ${image} locally...`);
        await docker.getImage(image).inspect();
        console.log(`[execution engine] ${image} already exists locally.`);
    } catch (error) {
        // Pull the image if it doesn't exist
        const stream = await docker.pull(image);

        await new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        })

        console.log(`[execution engine] Pulled ${image} from Docker Hub.`);
    }
}


export async function executeCode(job_id: string) {

    console.log(`[execution engine] Processing job: ${job_id}`);

    let status;
    let stdoutResult = "";
    let stderrResult = "";
    let executionTime = 0;
    let memoryUsage = 0;
    let exitCode: number | null = 1;

    try {
        const job = await ResponseModel.findById(job_id);

        if (!job) {
            console.error(`[execution engine] Job with ID ${job_id} not found.`);
            return;
        }

        const { code, stdin, language } = job;
        const image = LANGUAGE_IMAGES[language as SUPPORTED_LANGUAGES];

        await ensureImageExists(image);

        const startTime = performance.now();

        const container = await docker.createContainer({
            Image: image,
            User: "/1000",
            WorkingDir: "/tmp",
            HostConfig: {
                Binds: ["/tmp:/tmp"],
                Runtime: "runc",
                Memory: 256 * 1024 * 1024, // 256MB
                CpuQuota: 100000,
            },
            NetworkDisabled: true,
            StopTimeout: 10000,
            Cmd: LANGUAGES_RUN_COMMANDS[language as SUPPORTED_LANGUAGES](code),
            AttachStdin: true,
            OpenStdin: true,
            StdinOnce: true,
        })

        //Stream for stdin input
        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: false,
            stderr: false,
        });

        await container.start();

        stream.write(stdin || "");
        stream.end();

        let stdoutData = "", stderrData = "";
        const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

        const logsStream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true,
        })
        const stdoutStream = new PassThrough();
        const stderrStream = new PassThrough();

        docker.modem.demuxStream(logsStream, stdoutStream, stderrStream);

        stdoutStream.on("data", (chunk) => {
            stdoutData += chunk.toString();
            if (stdoutData.length > MAX_OUTPUT_SIZE) {
                stdoutData = stdoutData.slice(0, MAX_OUTPUT_SIZE);
                stdoutStream.destroy();
            }
        });

        stderrStream.on("data", (chunk) => {
            stderrData += chunk.toString();
            if (stderrData.length > MAX_OUTPUT_SIZE) {
                stderrData = stderrData.slice(0, MAX_OUTPUT_SIZE);
                stderrStream.destroy();
            }
        });

        await new Promise((resolve) => logsStream.on("end", resolve));

        stdoutResult = stdoutData;
        executionTime = performance.now() - startTime;
        memoryUsage = (await container.stats({ stream: false })).memory_stats.max_usage;
        exitCode = (await container.wait()).StatusCode;

        status = exitCode === 0 ? "Completed" : "Failed";

        await job.updateOne({
            $set: {
                status,
                stdout: stdoutResult,
                error: stderrResult,
                executionTime,
                memoryUsed: memoryUsage,
                exitCode,
            }
        })

        try {
            await container.remove({ force: true });
        } catch (error) {
            console.error(`[execution engine] Error removing container: ${error}`);
        }
    } catch (error) {
        console.error(`[execution engine] Error executing job ${job_id}: ${error}`);

        status = "Failed";
        stderrResult = error instanceof Error ? error.message : "Unknown error";
        executionTime = 0;
        memoryUsage = 0;
        exitCode = 1;

        try {
            await ResponseModel.findByIdAndUpdate(job_id, {
                $set: {
                    status,
                    error: stderrResult,
                    executionTime,
                    memoryUsed: memoryUsage,
                    exitCode,
                }
            });
        } catch (error) {
            console.error(`[execution engine] Error updating job ${job_id} after failure: ${error}`);
        }
    }

    return {
        status, 
        stdout: stdoutResult,
        error: stderrResult,
        executionTime,
        memoryUsed: memoryUsage,
        exitCode
    };
}