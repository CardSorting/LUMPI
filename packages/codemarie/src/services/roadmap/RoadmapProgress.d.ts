export declare function progressJsonlPath(): string;
export declare function progressCurrentPath(): string;
export declare function lastErrorPath(): string;
export declare function emitProgress(phase: string, params: {
    action?: string;
    workspace?: string;
    payload?: Record<string, unknown>;
    success?: boolean;
}): Promise<Record<string, unknown>>;
export declare function readCurrentProgress(): Promise<Record<string, unknown> | null>;
export declare function readProgressTail(limit?: number): Promise<Record<string, unknown>[]>;
export declare function recordLastError(error: Record<string, unknown>): Promise<void>;
export declare function readLastError(): Promise<Record<string, unknown> | null>;
export declare function scanProgressTailForLastError(): Promise<Record<string, unknown> | null>;
export declare function summarizeRecentEvents(events: Record<string, unknown>[], last?: number): Record<string, unknown>[];
export declare function formatProgressReport(params: {
    workspace: string;
    timeline?: boolean;
    tail?: boolean;
    currentSnapshot?: boolean;
    last?: number;
    snapshot?: Record<string, unknown>;
}): Promise<string>;
export declare function buildProgressSnapshot(workspace: string): Promise<Record<string, unknown>>;
export declare function clearLastError(): Promise<void>;
export declare function formatWatchReport(current: Record<string, unknown> | null, lastError: Record<string, unknown> | null, brief?: Record<string, unknown> | null): string;
//# sourceMappingURL=RoadmapProgress.d.ts.map