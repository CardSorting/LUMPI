import { CoordinationErrorCode } from "@shared/governance/CoordinationErrors";
import type { CoordinationAuthorityMode, LockClaim } from "@shared/governance/lockTypes";
export type { CoordinationAuthorityMode, LockBackends, LockClaim } from "@shared/governance/lockTypes";
export type LockFailureReason = "collision" | "split_brain" | "stale_owner" | "duplicate_claim" | "owner_mismatch" | "fencing_mismatch" | "missing_fencing_token" | "durable_backend_unavailable" | "ambiguous_roadmap_admission" | "authority_mode_mismatch" | "coordination_state_corrupt" | "not_held";
export type LockAcquireResult = {
    ok: true;
    claim: LockClaim;
} | {
    ok: false;
    reason: LockFailureReason;
    error: string;
    code?: CoordinationErrorCode;
    retryClass?: "retry" | "reconcile_then_retry" | "abort_owner" | "fail_closed";
};
export type LockReleaseResult = {
    ok: true;
} | {
    ok: false;
    reason: LockFailureReason;
    error: string;
};
export interface StaleRecoveryReport {
    recovered: string[];
    errors: string[];
}
export interface SwarmLeaseIdentity {
    workspaceId: string;
    swarmId: string;
    laneId?: string;
    ownerId: string;
    leaseEpoch: string;
    fencingToken: string;
}
export type ReconciliationStatus = "retain" | "repair_projection" | "reclaim" | "already_released" | "fail_closed" | "expired_owner_reclaimed" | "ownership_conflict" | "active_owner_retained";
export interface ReconciliationRepair {
    backend: "memory" | "database" | "filesystem" | "broccoli";
    action: "write" | "delete";
}
export interface LeaseReconciliationResult {
    resourceKey: string;
    status: ReconciliationStatus;
    previousOwner?: SwarmLeaseIdentity;
    currentOwner?: SwarmLeaseIdentity;
    reason: string;
}
export interface LeaseObservation {
    ownerId: string;
    leaseEpoch: string;
    fencingToken: string;
    expiresAt: number;
    pid?: number;
    authorityMode: CoordinationAuthorityMode;
}
export interface ReconciliationSnapshot {
    memory?: LeaseObservation;
    database?: LeaseObservation;
    filesystem?: LeaseObservation;
    broccoli?: LeaseObservation;
    observedAt: number;
    dbAvailable: boolean;
    corruptions?: string[];
}
export interface ReconciliationDecision {
    status: ReconciliationStatus;
    authoritativeLease?: LeaseObservation;
    repairs: ReconciliationRepair[];
    reason: string;
}
export interface LockAuthority {
    readonly authorityMode: CoordinationAuthorityMode;
    acquire(resourceKey: string, ownerId: string, options?: {
        workspace?: string;
        roadmapLeaseTaskId?: string;
        timeoutMs?: number;
        roadmapEnabled?: boolean;
        crossProcess?: boolean;
        requireDurability?: boolean;
    }): Promise<LockAcquireResult>;
    release(claim: LockClaim, workspace?: string): Promise<LockReleaseResult>;
    verify(claim: LockClaim, workspace?: string): Promise<{
        valid: boolean;
        reason?: LockFailureReason;
    }>;
    recoverStale(workspace: string, resourcePrefix?: string): Promise<StaleRecoveryReport>;
    reconcileSwarmLease(workspace: string, swarmId: string, laneCount: number, requestorOwnerId: string, expectedLeaseEpoch?: string, fencingToken?: string): Promise<LeaseReconciliationResult[]>;
    assertCurrentFencingToken(resourceKey: string, suppliedToken: string, workspace?: string): Promise<void>;
}
/** Immutable process-start authority selection. It is never recomputed after module initialization. */
export declare const COORDINATION_AUTHORITY_MODE: CoordinationAuthorityMode;
export declare function configuredCoordinationAuthorityMode(): CoordinationAuthorityMode;
/** @deprecated Prefer the immutable authorityMode property on a LockAuthority instance. */
export declare function isLocalOnlyMode(): boolean;
export declare function isPidAlive(pid: number): boolean;
export declare function mapLockFailureReasonToCode(reason: string): CoordinationErrorCode;
export declare function decideReconciliation(snapshot: ReconciliationSnapshot, _requestorOwnerId: string, now: number): ReconciliationDecision;
/** Unified production authority. SQLite is authoritative; memory and files are projections only. */
export declare class UnifiedLockAuthority implements LockAuthority {
    readonly authorityMode: CoordinationAuthorityMode;
    static readonly inProcessClaims: Map<string, LeaseObservation>;
    constructor(authorityMode?: CoordinationAuthorityMode);
    acquire(resourceKey: string, ownerId: string, options?: {
        workspace?: string;
        roadmapLeaseTaskId?: string;
        timeoutMs?: number;
        roadmapEnabled?: boolean;
        crossProcess?: boolean;
        requireDurability?: boolean;
    }): Promise<LockAcquireResult>;
    release(claim: LockClaim, workspace?: string): Promise<LockReleaseResult>;
    verify(claim: LockClaim, workspace?: string): Promise<{
        valid: boolean;
        reason?: LockFailureReason;
    }>;
    recoverStale(_workspace: string, _resourcePrefix?: string): Promise<StaleRecoveryReport>;
    reconcileSwarmLease(workspace: string, swarmId: string, laneCount: number, requestorOwnerId: string, _expectedLeaseEpoch?: string, _fencingToken?: string): Promise<LeaseReconciliationResult[]>;
    assertCurrentFencingToken(resourceKey: string, suppliedToken: string, workspace?: string): Promise<void>;
    private acquireLocal;
    private releaseLocal;
    private abandonLeaseAfterProjectionFailure;
    private cleanObservedProjections;
    private repairProjections;
}
/** Test-only authority without SQLite or filesystem projections. */
export declare class InMemoryLockAuthority implements LockAuthority {
    readonly authorityMode: "local_test";
    private readonly delegate;
    private static counter;
    static nextToken(): string;
    acquire(...args: Parameters<LockAuthority["acquire"]>): ReturnType<LockAuthority["acquire"]>;
    release(...args: Parameters<LockAuthority["release"]>): ReturnType<LockAuthority["release"]>;
    verify(...args: Parameters<LockAuthority["verify"]>): ReturnType<LockAuthority["verify"]>;
    recoverStale(...args: Parameters<LockAuthority["recoverStale"]>): ReturnType<LockAuthority["recoverStale"]>;
    reconcileSwarmLease(...args: Parameters<LockAuthority["reconcileSwarmLease"]>): ReturnType<LockAuthority["reconcileSwarmLease"]>;
    assertCurrentFencingToken(...args: Parameters<LockAuthority["assertCurrentFencingToken"]>): ReturnType<LockAuthority["assertCurrentFencingToken"]>;
    static reset(): void;
}
export declare function createLockAuthority(options?: {
    inMemory?: boolean;
    mode?: CoordinationAuthorityMode;
}): LockAuthority;
export declare function releaseGovernedLock(authority: LockAuthority, claim: LockClaim, workspace: string): Promise<LockReleaseResult>;
//# sourceMappingURL=LockAuthority.d.ts.map