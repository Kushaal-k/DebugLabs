import Dockerode from "dockerode";

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


