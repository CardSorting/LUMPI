import type { ContextCompactionCommitInput, ContextCompactionCommitResult, ContextCompactionHydrateInput, ContextCompactionHydrateResult, ContextCompactionLoadInput, ContextCompactionLoadResult } from "@noorm/broccolidb";
import type { ContextCompactionStore } from "./ContextCompactionStore";
/**
 * Lazy BroccoliDB adapter. The native database module and AgentContext
 * lifecycle are initialized only when central recovery or compaction is first
 * requested. One lifecycle-owned context is shared by every task in a workspace.
 */
export declare class BroccoliContextCompactionStore implements ContextCompactionStore {
    readonly workspaceId: string;
    private readonly workspacePath;
    private readonly databasePath;
    constructor(workspacePath: string);
    getRecoverySource(scopeId: string): string;
    commit(input: ContextCompactionCommitInput): Promise<ContextCompactionCommitResult>;
    load(input: ContextCompactionLoadInput): Promise<ContextCompactionLoadResult>;
    hydrate(input: ContextCompactionHydrateInput): Promise<ContextCompactionHydrateResult>;
    private getContext;
}
export declare function shutdownBroccoliContextCompactionStores(): Promise<void>;
//# sourceMappingURL=BroccoliContextCompactionStore.d.ts.map