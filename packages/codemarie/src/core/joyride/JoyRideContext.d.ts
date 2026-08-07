/**
 * [LAYER: CORE]
 * Workspace and task fingerprint helpers for JoyRide cache invalidation.
 */
export interface JoyRideWorkspaceSnapshot {
    workspaceFingerprint: string;
    gitHead: string;
    dependencyFingerprint: string;
    lockfileFingerprint: string;
    environmentFingerprint: string;
    changedFileGeneration: number;
}
export interface JoyRideTaskScope {
    taskId: string;
    generation: number;
    approvalBoundaryId: string;
    cwd: string;
    terminalMode: string;
}
export declare function createEnvironmentFingerprint(cwd: string, terminalMode: string): string;
export declare function buildJoyRideWorkspaceSnapshot(cwd: string, terminalMode: string, changedFileGeneration?: number): Promise<JoyRideWorkspaceSnapshot>;
export declare function buildApprovalBoundaryId(taskId: string, apiRequestCount: number, suffix?: string): string;
//# sourceMappingURL=JoyRideContext.d.ts.map