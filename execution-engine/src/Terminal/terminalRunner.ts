import Dockerode from "dockerode";
import { TerminalCreatePayload } from "@debugLabs/shared";
import { LANGUAGE_IMAGES } from "../execution.js";

export interface TerminalSessionCallbacks {
    readonly onData: (data: string) => void;
    readonly onExit: (exitCode: number | null) => void;
}

export interface TerminalSession {
    readonly sessionId: string;
    readonly roomId: string;
    readonly workspaceId: string;
    readonly container: Dockerode.Container;
    readonly exec: Dockerode.Exec;
    readonly stream: NodeJS.ReadWriteStream;
    readonly callback: TerminalSessionCallbacks;
}

export class TerminalRunner {
    private readonly docker: Dockerode = new Dockerode({ socketPath: "/var/run/docker.sock" });
    private readonly sessions: Map<string, TerminalSession> = new Map();

    public async createSession(
        payload: TerminalCreatePayload,
        callbacks: TerminalSessionCallbacks,
    ): Promise<TerminalSession> {
        const sessionId = crypto.randomUUID();

        const image = LANGUAGE_IMAGES[payload.language ?? "javascript"];

        const container = await this.docker.createContainer({
            Image: image,
            Cmd: ["tail", "-f", "/dev/null"],
            User: "1000",
            WorkingDir: "/tmp/workspace",
            Tty: true,
            OpenStdin: true,
            HostConfig: {
                CapDrop: ["ALL"],
                SecurityOpt: ["no-new-privileges:true"],
                Memory: 512 * 1024 * 1024,
                CpuQuota: 100000,
                AutoRemove: false,
            },
        });

        await container.start();

        const exec = await container.exec({
            Cmd: ["bash"],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            User: "1000",
            WorkingDir: "/tmp/workspace",
        });

        const stream = await exec.start({ hijack: true, stdin: true, Tty: true });

        stream.on("data", (chunk) => {
            const data = chunk.toString("utf-8");
            callbacks.onData(data);
        });

        stream.on("end", async () => {
            let exitCode: number | null = null;

            try {
                const inspectData = await exec.inspect();
                exitCode = inspectData.ExitCode;
            } catch (error) {
                // container or exec may already be closed
            }

            await this.killSession(sessionId, exitCode);
            callbacks.onExit(exitCode);
            this.sessions.delete(sessionId);
        });

        const session: TerminalSession = {
            sessionId,
            roomId: payload.roomId,
            workspaceId: payload.workspaceId ?? "",
            container,
            exec,
            stream,
            callback: callbacks,
        };

        this.sessions.set(sessionId, session);

        return session;
    }

    public async writeToSession(sessionId: string, data: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session with ID ${sessionId} not found`);
        }

        session.stream.write(data);
    }

    public async resizeSession(sessionId: string, cols: number, rows: number): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session with ID ${sessionId} not found`);
        }

        await session.exec.resize({ h: rows, w: cols });
    }

    public async killSession(sessionId: string, exitCode: number | null = 0): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session with ID ${sessionId} not found`);
        }

        await session.container.stop();
        await session.container.remove({ force: true}).catch(() => {});
        session.callback.onExit(exitCode);
        this.sessions.delete(sessionId);
    }

    public getSession(sessionId: string): TerminalSession | undefined {
        return this.sessions.get(sessionId);
    }

    public cleanupAllSessions(): void {
        for (const session of this.sessions.values()) {
            session.container.stop().catch(() => {});
            session.container.remove({ force: true }).catch(() => {});
            session.callback.onExit(null);
        }
    }
}
