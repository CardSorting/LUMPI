import type { StateManager } from "../storage/StateManager";
export interface EnvironmentLease {
    fingerprint: string;
    timestamp: number;
    success: boolean;
    error?: string;
    details?: {
        nodeVersion?: string;
        npmVersion?: string;
        canWrite?: boolean;
        nodePath?: string;
        shell?: string;
        diskSpaceGB?: string;
        hasNodeModules?: boolean;
        memoryFreeGB?: string;
        detectedProjectTypes?: string[];
        toolchain?: Record<string, {
            version?: string;
            path?: string;
            status: "found" | "missing" | "broken";
        }>;
        manifests?: string[];
        hostname?: string;
        shadowingAlerts?: string[];
    };
}
/**
 * EnvironmentIntegrity: A deterministic gatekeeper for the agent's environment.
 * Implements "Environmental Leases" (L0-L2 tiered validation) with support for
 * multi-language discovery, binary integrity, and machine-anchored fingerprints.
 */
export declare class EnvironmentIntegrity {
    private readonly cwd;
    private readonly stateManager?;
    private lease;
    private probePromise;
    private readonly LEASE_DURATION;
    private static readonly PROJECT_MARKERS;
    constructor(cwd: string, stateManager?: StateManager);
    getFingerprint(): string;
    private getL0Lease;
    isLeaseValid(lease: EnvironmentLease | null): boolean;
    revokeLease(): void;
    validateEnvironment(): Promise<EnvironmentLease>;
    private static readonly VERSION_MANIFESTS;
    private static readonly MGMT_TOOLS;
    private performFullProbe;
}
//# sourceMappingURL=EnvironmentIntegrity.d.ts.map