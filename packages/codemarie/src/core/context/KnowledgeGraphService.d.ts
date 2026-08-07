import { type Schema } from "../../infrastructure/db/Config";
export interface EmbeddingHandler {
    embedText(text: string): Promise<number[] | null>;
}
export interface KnowledgeNode {
    id: string;
    streamId: string;
    type: string;
    content: string;
    tags: string[];
    embedding: number[] | null;
    confidence: number;
    hubScore: number;
    metadata?: any;
    createdAt: number;
}
export interface KnowledgeEdge {
    sourceId: string;
    targetId: string;
    type: string;
    weight: number;
    createdAt: number;
}
export interface GraphTraversalFilter {
    edgeTypes?: string[];
    minWeight?: number;
    direction?: "outbound" | "inbound" | "both";
}
export declare class KnowledgeGraphService {
    private static instance;
    private embeddingHandler;
    private cleanupInterval;
    private isEmbeddingDisabled;
    private unregisterDbListener;
    private constructor();
    static getInstance(embeddingHandler: EmbeddingHandler): Promise<KnowledgeGraphService>;
    static resetInstance(): void;
    private _push;
    calculateHash(content: string): string;
    private startCleanupLoop;
    cleanupGhostTasks(): Promise<void>;
    /**
     * Append a global rule or guideline to the swarm-wide shared memory layer.
     */
    appendSharedMemory(streamId: string, memory: string): Promise<void>;
    /**
     * Get the shared memory layer for a stream (including inherited from parents).
     */
    getSharedMemory(streamId: string): Promise<string[]>;
    addKnowledge(streamId: string, type: string, content: string, options?: {
        tags?: string[];
        embedding?: number[];
        confidence?: number;
        expiresAt?: number;
        metadata?: any;
    }): Promise<string>;
    /**
     * Creates a cognitive snapshot, potentially landmarking history if it's too deep.
     */
    cognitiveSnapshot(streamId: string, content: string, count: number): Promise<string>;
    /**
     * Append a long-term directive or context string to the agent's persistent Memory Layer.
     */
    appendMemoryLayer(streamId: string, key: string, memory: string): Promise<void>;
    /**
     * Partially update a knowledge graph node.
     */
    updateKnowledge(id: string, patch: Partial<KnowledgeNode>): Promise<void>;
    /**
     * Fetch a holistic intelligence bundle containing an agent profile, its active tasks, and recent unexpired graph nodes.
     */
    getAgentBundle(streamId: string): Promise<{
        stream: Schema["agent_streams"] | null;
        tasks: Schema["agent_tasks"][];
        memories: Schema["agent_memory"][];
        recentKnowledge: KnowledgeNode[];
    }>;
    /**
     * Creates a landmark node (summary of past context) using AI compaction.
     */
    createLandmark(streamId: string, content: string, originalCount: number): Promise<string>;
    addEdge(sourceId: string, targetId: string, type: string, weight?: number): Promise<void>;
    traverseGraph(startId: string, maxDepth?: number, filter?: GraphTraversalFilter): Promise<KnowledgeNode[]>;
    /**
     * Search knowledge graph nodes.
     */
    searchKnowledge(streamId: string, query: string, options?: {
        tags?: string[];
        limit?: number;
        augmentWithGraph?: boolean;
        maxDepth?: number;
    }): Promise<(KnowledgeNode & {
        similarity: number;
    })[]>;
    /**
     * Deletes a knowledge node and its edges.
     */
    deleteKnowledge(id: string): Promise<void>;
    /**
     * Merges two knowledge nodes, folding source into target.
     */
    mergeKnowledge(sourceId: string, targetId: string): Promise<void>;
    /**
     * Extract a self-contained serializable subgraph from a root node.
     */
    extractSubgraph(rootId: string, maxDepth?: number, filter?: GraphTraversalFilter): Promise<{
        nodes: KnowledgeNode[];
        edges: KnowledgeEdge[];
    }>;
    /**
     * Refreshes confidence and usage markers of a node.
     */
    refreshKnowledge(id: string): Promise<void>;
    /**
     * Get degree centrality metrics for a node.
     */
    getNodeCentrality(id: string): Promise<{
        kbId: string;
        inbound: number;
        outbound: number;
        totalDegree: number;
    }>;
    /**
     * Decay confidence of nodes older than a certain date.
     */
    decayConfidence(factor: number, olderThanMs: number): Promise<{
        decayedCount: number;
        prunedDeadNodes: number;
    }>;
    /**
     * Gets the history of snapshots for a stream.
     */
    getHistory(streamId: string, limit?: number): Promise<KnowledgeNode[]>;
    /**
     * Semantic Context Routing: Analyzes history to find files frequently co-modified with the target file.
     */
    getContextGraph(streamId: string, filePath: string, limit?: number): Promise<{
        path: string;
        weight: number;
    }[]>;
    /**
     * Recursive Semantic Impact Analysis: Walks history to find dependencies.
     */
    calculateBlastRadius(streamId: string, filePath: string, maxDepth?: number): Promise<{
        path: string;
        depth: number;
    }[]>;
    /**
     * Detects architectural chokepoints based on churn and contention.
     */
    detectChokepoints(streamId: string, limit?: number): Promise<{
        path: string;
        score: number;
        churn: number;
    }[]>;
    /**
     * Self-Healing: Recovers the last known state of a file.
     */
    recoverFile(streamId: string, filePath: string): Promise<{
        content: string;
        sourceId: string;
    } | null>;
    /**
     * Identify the last agent and commit that modified a specific file.
     */
    blame(streamId: string, filePath: string): Promise<{
        lastAuthor: string;
        lastNodeId: string;
        lastMessage: string;
        lastTimestamp: number;
    } | null>;
    /**
     * Generates a high-level, structural changelog between two references (snapshots).
     */
    generateChangelog(streamId: string, baseId: string, headId: string): Promise<string>;
    /**
     * Speculative Merge Forecasting: Predicts conflicts using graph diffing.
     */
    simulateMerge(sourceStreamId: string, targetStreamId: string): Promise<{
        hasConflicts: boolean;
        affectedPaths: string[];
    }>;
    /**
     * V9: Speculative Merge Forecasting.
     * Predicts semantic conflicts by intersecting blast radii of changes.
     */
    simulateMergeForecast(sourceStreamId: string, targetStreamId: string): Promise<{
        isHighRisk: boolean;
        conflicts: string[];
        semanticOverlaps: {
            path: string;
            reason: string;
        }[];
    }>;
    /**
     * Spawns a new sub-task and links it to specific high-value knowledge nodes.
     */
    spawnTask(streamId: string, description: string, complexity?: number, linkedKnowledgeIds?: string[]): Promise<string>;
    private cosineSimilarity;
    /**
     * Returns top N hubs by centrality score.
     */
    getGlobalCentrality(limit?: number): Promise<any[]>;
    /**
     * Resolves the context for a task, including multi-hop graph neighborhood.
     */
    getTaskContext(taskId: string): Promise<any>;
}
//# sourceMappingURL=KnowledgeGraphService.d.ts.map