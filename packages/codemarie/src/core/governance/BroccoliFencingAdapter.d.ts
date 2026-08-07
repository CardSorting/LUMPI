import type { CoordinationAuthorityMode } from "@shared/governance/lockTypes";
export interface BroccoliFenceRecord {
    ownerId: string;
    resourceKey: string;
    fencingToken: string;
    leaseEpoch: string;
    claimedAt: number;
    pid: number;
    workspaceId: string;
    swarmId: string;
    laneId?: string;
    expiresAt: number;
    authorityMode: CoordinationAuthorityMode;
}
export declare function broccoliFencePath(workspace: string, resourceKey: string): string;
export type BroccoliFenceReadResult = {
    status: "present";
    path: string;
    record: BroccoliFenceRecord;
} | {
    status: "missing";
    path: string;
} | {
    status: "corrupt";
    path: string;
    reason: string;
};
export declare function readBroccoliFence(workspace: string, resourceKey: string): Promise<BroccoliFenceReadResult>;
/** Durable fencing-token store — BroccoliDB MutexService semantics without process coupling. */
export declare function acquireBroccoliFence(workspace: string, resourceKey: string, ownerId: string, fencingToken: string | number, leaseEpoch?: string | number, swarmId?: string, laneId?: string, authorityMode?: CoordinationAuthorityMode): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function releaseBroccoliFence(workspace: string, resourceKey: string, ownerId: string, fencingToken: string, leaseEpoch?: string, authorityMode?: CoordinationAuthorityMode): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function recoverStaleBroccoliFences(workspace: string, resourcePrefix?: string): Promise<string[]>;
export declare function verifyBroccoliFence(workspace: string, resourceKey: string, ownerId: string, fencingToken: string, leaseEpoch?: string, authorityMode?: CoordinationAuthorityMode): Promise<{
    valid: boolean;
    reason?: string;
}>;
//# sourceMappingURL=BroccoliFencingAdapter.d.ts.map