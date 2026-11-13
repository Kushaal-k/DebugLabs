import type { Socket, Namespace } from "socket.io";
import type {
    TerminalClientToServerEvents,
    TerminalServerToClientEvents,
    TerminalCreatePayload,
    TerminalDataPayload,
    TerminalResizePayload,
    TerminalKillPayload,
} from "@debugLabs/shared"
import { TerminalRunner } from "./terminalRunner.js";

export type TerminalSocket = Socket<TerminalClientToServerEvents, TerminalServerToClientEvents>;
export type TerminalNamespace = Namespace<TerminalClientToServerEvents, TerminalServerToClientEvents>;

export class TerminalGateway {
    private readonly runner: TerminalRunner;
    private readonly socketSessions = new Map<string, Set<string>>();

    constructor(runner?: TerminalRunner) {
        this.runner = runner ?? new TerminalRunner();
    }

    public attach(namespace: TerminalNamespace): void {
        namespace.on("connection", (socket: TerminalSocket) => {
            console.log(`[TerminalGateway] Client connected: ${socket.id}`);

            socket.on("terminal:create", async (payload: TerminalCreatePayload) => {
                try {
                    const session = await this.runner.createSession(payload, {
                        onData: (data: string) => {
                            socket.emit("terminal:output", { sessionId: session.sessionId, data });
                        },
                        onExit: (exitCode: number | null) => {
                            socket.emit("terminal:exit", { sessionId: session.sessionId, exitCode });
                        },
                    });

                    if (!this.socketSessions.has(socket.id)) {
                        this.socketSessions.set(socket.id, new Set());
                    }
                    this.socketSessions.get(socket.id)?.add(session.sessionId);

                    socket.emit("terminal:created", { sessionId: session.sessionId });
                } catch (error) {
                    console.error(`[TerminalGateway] Error creating terminal session:`, error);
                    socket.emit("terminal:error", { error: "Failed to create terminal session" });
                }
            });

            socket.on("terminal:data", async (payload: TerminalDataPayload) => {
                try {
                    await this.runner.writeToSession(payload.sessionId, payload.data);
                } catch (error) {
                    console.error(`[TerminalGateway] Error writing to terminal session ${payload.sessionId}:`, error);
                    socket.emit("terminal:error", { sessionId: payload.sessionId, error: "Failed to write to terminal session" });
                }
            });

            socket.on("terminal:resize", async (payload: TerminalResizePayload) => {
                try {
                    await this.runner.resizeSession(payload.sessionId, payload.cols, payload.rows);
                } catch (error) {
                    console.error(`[TerminalGateway] Error resizing terminal session ${payload.sessionId}:`, error);
                    socket.emit("terminal:error", { sessionId: payload.sessionId, error: "Failed to resize terminal session" });
                }
            });

            socket.on("terminal:kill", async (payload: TerminalKillPayload) => {
                try {
                    await this.runner.killSession(payload.sessionId);
                } catch (error) {
                    console.error(`[TerminalGateway] Error killing terminal session ${payload.sessionId}:`, error);
                    socket.emit("terminal:error", { sessionId: payload.sessionId, error: "Failed to kill terminal session" });
                }
            });

            socket.on("disconnect", () => {
                console.log(`[TerminalGateway] Client disconnected: ${socket.id}`);
                const sessions = this.socketSessions.get(socket.id);
                if (sessions) {
                    for (const sessionId of sessions) {
                        this.runner.killSession(sessionId).catch((error) => {
                            console.error(`[TerminalGateway] Error killing terminal session ${sessionId} on disconnect:`, error);
                        });
                    }
                    this.socketSessions.delete(socket.id);
                }
            });
        });
    }
}