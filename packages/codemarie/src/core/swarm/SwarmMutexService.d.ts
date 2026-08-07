import type { CoordinationAuthorityMode } from "@shared/governance/lockTypes";
export declare const SWARM_LOCK_PROTOCOL_VERSION = 2;
export interface DurableSwarmLease {
    resource: string;
    ownerId: string;
    expiresAt: number;
    createdAt: number;
    leaseEpoch: string;
    fencingToken: string;
    protocolVersion: number;
    authorityMode: CoordinationAuthorityMode;
    pid: number;
}
/** SQLite-backed lease authority. All generation allocation and lease changes are CAS transactions. */
export declare class SwarmMutexService {
    static acquireLease(key: string, ownerId: string, timeoutMs?: number): Promise<DurableSwarmLease>;
    /** Compatibility helper. New code should retain the returned identity from acquireLease. */
    static claim(key: string, ownerId: string, timeoutMs?: number): Promise<void>;
    static getLease(key: string): Promise<DurableSwarmLease | undefined>;
    static release(key: string, ownerId: string, leaseEpoch: string | bigint, fencingToken: string | bigint): Promise<{
        status: "released" | "not_owner" | "already_gone";
        released: boolean;
    }>;
    static pruneStaleLocks(): Promise<void>;
    static runExclusive<T>(key: string, ownerId: string, fn: () => Promise<T>, timeoutMs?: number): Promise<T>;
}
//# sourceMappingURL=SwarmMutexService.d.ts.map