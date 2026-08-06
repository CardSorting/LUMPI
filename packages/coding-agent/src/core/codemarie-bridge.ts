import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	ApcStableIngestionEngine,
	AUTO_GOVERNANCE,
	BASE_SLASH_COMMANDS,
	BroccoliContextCompactionStore,
	type BroccoliFenceReadResult,
	broccoliFencePath,
	buildGateStateFromInputs,
	buildSteeringContext,
	CerebrasHandler,
	ContextPruner,
	ContextStalenessTracker,
	Controller,
	createLockAuthority,
	defaultApcStableEngine,
	detectWorkspaceArchitectureProfile,
	EnvironmentIntegrity,
	type EnvironmentLease,
	executeJoyZoningBatchRefactor,
	executeJoyZoningRefactor,
	findBootstrapPlaceholders,
	findLastIndex,
	formatBytes,
	formatResponse,
	type GateInputs,
	type GateState,
	generateLayerComment,
	getJoyZoningSection,
	getLayer,
	governanceFieldsFromStatus,
	HEALTH_STATUSES,
	type HostProvider,
	initializeCliHostProvider,
	isLayerTagSupported,
	KnowledgeGraphService,
	type Layer,
	type LockAuthority,
	MAX_CONTENT_SIZE_BYTES,
	PersistentSubscriptionHub,
	PlanModeEnforcer,
	parseLayerTag,
	parsePartialArrayString,
	prepareCerebrasMessages,
	REQUIRED_SECTIONS,
	ROADMAP_DIAGNOSTIC_SLASH_COMMANDS,
	readBroccoliFence,
	runDoctorChecks,
	SpiderEngine,
	StabilityPolicy,
	SwarmMutexService,
	sanitizeCellForLLM,
	sanitizeNotebookForLLM,
	suggestLayerForContent,
	TaskLatencyTracker,
	TemplateEngine,
	triggerJoyZoningAudit,
	truncateContent,
	UniversalGuard,
	VariantBuilder,
	validateImportDepth,
	validateJoyZoning,
	validateLayering,
	validateSmells,
	type WorkspaceArchitectureProfile,
	WorkspaceIntelligenceEngine,
	WriteCoalescer,
} from "@noorm/lumpi-codemarie";
import { type SQLiteMaintenanceEngine, sqliteMaintenanceEngine } from "@noorm/lumpi-codemarie/db";
import {
	atomicWriteFile,
	calculateFileChecksum,
	cleanStaleTempFiles,
	verifyIntegrity,
} from "@noorm/lumpi-codemarie/disk";
import {
	buildJoyRideWorkspaceSnapshot,
	bumpTaskGeneration,
	classifyCommand,
	createJoyRideTaskScope,
	flushTaskGeneration,
	flushWorkspace,
	getJoyRideCache,
	getJoyRideDecisionLog,
	getJoyRideStats,
	isEnvAlteringCommand,
	isJoyRideHitDecision,
	isReadOnlyCacheableCommand,
	type JoyRideCacheDecision,
	type JoyRideCommandClassification,
	type JoyRideTaskScope,
	type JoyRideWorkspaceSnapshot,
	logJoyRideDiagnostics,
	lookupSafeCommandResult,
	registerTaskLifecycle,
	shutdownJoyRideCache,
	storeCommandDiagnostic,
	storeReusableCommandResult,
} from "@noorm/lumpi-codemarie/joyride";
import { StorageManager, type StorageOptimizationResult } from "@noorm/lumpi-codemarie/storage";
import {
	defaultTokenBufferEngine,
	type LifetimeTelemetryStats,
	type TokenIngestionBufferEngine,
} from "@noorm/lumpi-codemarie/transform";
import { URI } from "vscode-uri";

export interface CodemarieBridgeOptions {
	cwd?: string;
	modEnabled?: boolean;
}

export class CodemarieBridge {
	private options: CodemarieBridgeOptions;
	private controller: Controller | undefined;
	private hostProvider: HostProvider | undefined;
	private guard: UniversalGuard | undefined;
	private planModeEnforcer: PlanModeEnforcer | undefined;
	private broccoliStore: BroccoliContextCompactionStore | undefined;
	private intelligenceEngine: WorkspaceIntelligenceEngine | undefined;
	private spiderEngine: SpiderEngine | undefined;
	private eventHub: PersistentSubscriptionHub<unknown> | undefined;
	private environmentIntegrity: EnvironmentIntegrity | undefined;
	private contextPruner: ContextPruner | undefined;
	private tokenBufferEngine: TokenIngestionBufferEngine | undefined;
	private apcStableEngine: ApcStableIngestionEngine | undefined;
	private storageManager: StorageManager | undefined;
	private sqliteMaintenanceEngine: SQLiteMaintenanceEngine | undefined;

	private cachedSteeringDirectives = "";

	constructor(options: CodemarieBridgeOptions = {}) {
		this.options = options;
	}

	public async refreshSteering(): Promise<string> {
		this.cachedSteeringDirectives = await this.getSteeringPromptDirectives();
		return this.cachedSteeringDirectives;
	}

	public getSteeringPromptDirectivesSync(): string {
		return this.cachedSteeringDirectives;
	}

	public initialize(): unknown {
		const cwd = this.options.cwd || process.cwd();
		this.hostProvider = initializeCliHostProvider({ cwd });

		const storageDir = path.join(os.homedir(), ".codemarie");
		const context: Record<string, unknown> = {
			subscriptions: [],
			extensionUri: URI.file(cwd),
			extensionPath: cwd,
			environmentVariableCollection: {},
			asAbsolutePath: (rel: string) => path.join(cwd, rel),
			storageUri: URI.file(path.join(storageDir, "workspace")),
			storagePath: path.join(storageDir, "workspace"),
			globalStorageUri: URI.file(storageDir),
			globalStoragePath: storageDir,
			logUri: URI.file(path.join(storageDir, "logs")),
			logPath: path.join(storageDir, "logs"),
			extensionMode: 1,
			extension: {
				id: "pi.codemarie",
				extensionUri: URI.file(cwd),
				extensionPath: cwd,
				isActive: true,
				packageJSON: { name: "pi-codemarie", version: "0.83.0" },
				extensionKind: 1,
				exports: {},
				activate: async () => ({}),
			},
		};

		try {
			this.controller = new Controller(context as never);
			this.planModeEnforcer = new PlanModeEnforcer(cwd);
			this.broccoliStore = new BroccoliContextCompactionStore(cwd);
			this.intelligenceEngine = new WorkspaceIntelligenceEngine(cwd);
			this.spiderEngine = new SpiderEngine(cwd);
			this.eventHub = new PersistentSubscriptionHub<unknown>("pi-agent-events");
			this.environmentIntegrity = new EnvironmentIntegrity(cwd);
			this.contextPruner = new ContextPruner();
			this.tokenBufferEngine = defaultTokenBufferEngine;
			this.storageManager = StorageManager.getInstance();
			this.sqliteMaintenanceEngine = sqliteMaintenanceEngine;
			if (this.controller.stateManager) {
				this.guard = new UniversalGuard(cwd, "task-pi", this.controller.stateManager);
			}
		} catch {
			// Fallback if full extension runtime context requires host mocks
		}

		return context;
	}

	public getBroccoliStore(): BroccoliContextCompactionStore | undefined {
		if (!this.broccoliStore) {
			this.initialize();
		}
		return this.broccoliStore;
	}

	public getBroccoliRecoverySource(scopeId: string): string {
		const store = this.getBroccoliStore();
		if (store) {
			return store.getRecoverySource(scopeId);
		}
		return `broccolidb://context/${encodeURIComponent(scopeId)}`;
	}

	public getWorkspaceIntelligenceEngine(): WorkspaceIntelligenceEngine | undefined {
		if (!this.intelligenceEngine) {
			this.initialize();
		}
		return this.intelligenceEngine;
	}

	public getSpiderEngine(): SpiderEngine | undefined {
		if (!this.spiderEngine) {
			this.initialize();
		}
		return this.spiderEngine;
	}

	public getEventHub(): PersistentSubscriptionHub<unknown> | undefined {
		if (!this.eventHub) {
			this.initialize();
		}
		return this.eventHub;
	}

	public async broadcastEvent(event: unknown): Promise<void> {
		const hub = this.getEventHub();
		if (hub) {
			await hub.broadcast(event);
		}
	}

	public async getKnowledgeGraphService(handler?: {
		embedText: (text: string) => Promise<number[] | null>;
	}): Promise<KnowledgeGraphService> {
		return await KnowledgeGraphService.getInstance(handler ?? { embedText: async () => null });
	}

	public getContextPruner(): ContextPruner {
		if (!this.contextPruner) {
			this.contextPruner = new ContextPruner();
		}
		return this.contextPruner;
	}

	public getEnvironmentIntegrity(): EnvironmentIntegrity {
		if (!this.environmentIntegrity) {
			const cwd = this.options.cwd || process.cwd();
			this.environmentIntegrity = new EnvironmentIntegrity(cwd);
		}
		return this.environmentIntegrity;
	}

	public async refreshEnvironmentLease(): Promise<EnvironmentLease> {
		return await this.getEnvironmentIntegrity().validateEnvironment();
	}

	public getLockAuthority(): LockAuthority {
		return createLockAuthority();
	}

	public getVariantBuilder(): VariantBuilder {
		return new VariantBuilder();
	}

	public async runRoadmapDoctor(workspace?: string): Promise<Record<string, unknown>> {
		const targetWorkspace = workspace || this.options.cwd || process.cwd();
		return await runDoctorChecks({} as never, targetWorkspace);
	}

	public getWriteCoalescer(): typeof WriteCoalescer {
		return WriteCoalescer;
	}

	public getLatencyTracker(): TaskLatencyTracker {
		return new TaskLatencyTracker();
	}

	public getContextStalenessTracker(cwd?: string): ContextStalenessTracker {
		return new ContextStalenessTracker(cwd || this.options.cwd || process.cwd());
	}

	public getSwarmMutexService(): typeof SwarmMutexService {
		return SwarmMutexService;
	}

	public async evaluateRoadmapGateState(inputs: GateInputs): Promise<GateState> {
		return await buildGateStateFromInputs(inputs);
	}

	public getResponseFormatter(): typeof formatResponse {
		return formatResponse;
	}

	public getBaseSlashCommands(): typeof BASE_SLASH_COMMANDS {
		return BASE_SLASH_COMMANDS;
	}

	public getTemplateEngine(): typeof TemplateEngine {
		return TemplateEngine;
	}

	public sanitizeNotebookForLLM(jsonString: string, stripAllOutputs = false): string {
		return sanitizeNotebookForLLM(jsonString, stripAllOutputs);
	}

	public sanitizeCellForLLM(cell: Record<string, unknown>): string {
		return sanitizeCellForLLM(cell);
	}

	public getMaxContentSizeBytes(): number {
		return MAX_CONTENT_SIZE_BYTES;
	}

	public formatBytes(bytes: number): string {
		return formatBytes(bytes);
	}

	public truncateContent(content: string, maxSize = MAX_CONTENT_SIZE_BYTES): string {
		return truncateContent(content, maxSize);
	}

	public parsePartialArrayString(arrayString: string): string[] {
		return parsePartialArrayString(arrayString);
	}

	public findLastIndex<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean): number {
		return findLastIndex(array, predicate);
	}

	public findBootstrapPlaceholders(content: string): unknown[] {
		return findBootstrapPlaceholders(content);
	}

	public getRequiredRoadmapSections(): typeof REQUIRED_SECTIONS {
		return REQUIRED_SECTIONS;
	}

	public getRoadmapHealthStatuses(): typeof HEALTH_STATUSES {
		return HEALTH_STATUSES;
	}

	public async readBroccoliFence(workspace: string, resourceKey: string): Promise<BroccoliFenceReadResult> {
		return await readBroccoliFence(workspace, resourceKey);
	}

	public broccoliFencePath(workspace: string, resourceKey: string): string {
		return broccoliFencePath(workspace, resourceKey);
	}

	public getAutoGovernancePolicy(): typeof AUTO_GOVERNANCE {
		return AUTO_GOVERNANCE;
	}

	public getRoadmapDiagnosticSlashCommands(): typeof ROADMAP_DIAGNOSTIC_SLASH_COMMANDS {
		return ROADMAP_DIAGNOSTIC_SLASH_COMMANDS;
	}

	public governanceFieldsFromStatus(status: {
		open_gates?: string[];
		closed_gate_count?: number;
		blocking_gate_count?: number;
		blocking_gates?: unknown[];
		checkpoint_allowed?: boolean;
		preferred_command?: string;
	}): Record<string, unknown> {
		return governanceFieldsFromStatus(status as never);
	}

	public getController(): Controller | undefined {
		if (!this.controller) {
			this.initialize();
		}
		return this.controller;
	}

	public getGuard(): UniversalGuard | undefined {
		if (!this.guard) {
			this.initialize();
		}
		return this.guard;
	}

	public getPlanModeEnforcer(): PlanModeEnforcer | undefined {
		if (!this.planModeEnforcer) {
			this.initialize();
		}
		return this.planModeEnforcer;
	}

	public async getSteeringContext(): Promise<Record<string, unknown>> {
		const cwd = this.options.cwd || process.cwd();
		try {
			return await buildSteeringContext(cwd);
		} catch {
			return { ok: false };
		}
	}

	public async getSteeringPromptDirectives(mode: "plan" | "act" = "act"): Promise<string> {
		const steering = await this.getSteeringContext();
		const cwd = this.options.cwd || process.cwd();
		const profile = detectWorkspaceArchitectureProfile(cwd);
		const joyZoningSection = await getJoyZoningSection(undefined, { mode, cwd });

		const lines: string[] = ["\n<codemarie_steering>"];
		if (steering && steering.ok !== false) {
			if (steering.project_identity_line) {
				lines.push(`Identity: ${steering.project_identity_line}`);
			}
			if (steering.phase) {
				lines.push(`Phase: ${steering.phase}`);
			}
			if (steering.health_status) {
				lines.push(`Health Status: ${steering.health_status}`);
			}
			if (steering.agent_next_call) {
				lines.push(`Recommended Steering Call: ${steering.agent_next_call}`);
			}
			const digest = steering.project_steering_digest as Record<string, unknown> | undefined;
			if (digest?.strategic_narrative) {
				lines.push(`Strategic Narrative: ${digest.strategic_narrative}`);
			}
			if (digest?.center_of_gravity_excerpt) {
				lines.push(`Center of Gravity: ${digest.center_of_gravity_excerpt}`);
			}
		}

		lines.push(`JoyZoning Posture: ${profile.mode.toUpperCase()} (${profile.reason})`);
		lines.push(`JoyZoning Steering: ${profile.joyZoningSteering}`);
		lines.push("\n--- PRIMARY ARCHITECTURAL STEERING DIRECTIVE ---");
		lines.push(joyZoningSection);
		lines.push("</codemarie_steering>\n");

		return lines.join("\n");
	}

	public async createTask(prompt: string, images?: string[], files?: string[]): Promise<string> {
		const controller = this.getController();
		if (controller && typeof controller.initTask === "function") {
			await controller.initTask(prompt, images, files);
			return "task-codemarie";
		}
		return "task-cli";
	}

	// ============================================================================
	// JoyRide Execution Caching & Diagnostics API
	// ============================================================================

	public getJoyRideCache() {
		return getJoyRideCache();
	}

	public createJoyRideTaskScope(
		taskId: string,
		cwd: string,
		terminalMode = false,
		apiRequestCount = 0,
	): JoyRideTaskScope {
		return createJoyRideTaskScope(taskId, cwd, terminalMode ? "true" : "false", apiRequestCount);
	}

	public async lookupSafeCommandResult(command: string, scope: JoyRideTaskScope): Promise<JoyRideCacheDecision> {
		return await lookupSafeCommandResult(this.getJoyRideCache(), command, scope);
	}

	public async storeReusableCommandResult(
		command: string,
		result: [boolean, unknown] | { output: string; exitCode?: number },
		scope: JoyRideTaskScope,
	): Promise<unknown> {
		const payload: [boolean, string] = Array.isArray(result)
			? [result[0], String(result[1] ?? "")]
			: [false, result.output];
		return await storeReusableCommandResult(this.getJoyRideCache(), command, payload as never, scope);
	}

	public async storeCommandDiagnostic(
		command: string,
		result: [boolean, unknown] | { output: string; exitCode?: number },
		scope: JoyRideTaskScope,
	): Promise<unknown> {
		const payload: [boolean, string] = Array.isArray(result)
			? [result[0], String(result[1] ?? "")]
			: [false, result.output];
		return await storeCommandDiagnostic(this.getJoyRideCache(), command, payload as never, scope);
	}

	public classifyCommand(command: string): JoyRideCommandClassification {
		return classifyCommand(command);
	}

	public isEnvAlteringCommand(command: string): boolean {
		return isEnvAlteringCommand(command);
	}

	public isReadOnlyCacheableCommand(command: string): boolean {
		return isReadOnlyCacheableCommand(command);
	}

	public isJoyRideHitDecision(decision: JoyRideCacheDecision): boolean {
		return isJoyRideHitDecision(decision);
	}

	public registerTaskLifecycle(taskId: string, generation = 0): void {
		registerTaskLifecycle(this.getJoyRideCache(), taskId, generation);
	}

	public bumpTaskGeneration(taskId: string): void {
		bumpTaskGeneration(this.getJoyRideCache(), taskId);
	}

	public flushTaskGeneration(taskId: string, reason = "task_completed"): void {
		flushTaskGeneration(this.getJoyRideCache(), taskId, reason as never);
	}

	public flushWorkspace(workspaceFingerprint: string, reason = "command_environment_changed"): void {
		flushWorkspace(this.getJoyRideCache(), workspaceFingerprint, reason as never);
	}

	public async buildJoyRideWorkspaceSnapshot(cwd: string, terminalMode = false): Promise<JoyRideWorkspaceSnapshot> {
		return await buildJoyRideWorkspaceSnapshot(cwd, terminalMode ? "true" : "false");
	}

	public logJoyRideDiagnostics(): void {
		logJoyRideDiagnostics(this.getJoyRideCache());
	}

	public getJoyRideDecisionLog(limit = 32): readonly JoyRideCacheDecision[] {
		return getJoyRideDecisionLog(limit);
	}

	public getJoyRideStats() {
		return getJoyRideStats(this.getJoyRideCache());
	}

	public shutdownJoyRideCache(reason = "workspace_closed"): number {
		return shutdownJoyRideCache();
	}

	// ============================================================================
	// Custom 10-Stage DSL Compression & Token Ingestion Buffer API
	// ============================================================================

	public getTokenBufferEngine(): TokenIngestionBufferEngine {
		if (!this.tokenBufferEngine) {
			this.tokenBufferEngine = defaultTokenBufferEngine;
		}
		return this.tokenBufferEngine;
	}

	public compressDslText(text: string): string {
		return this.getTokenBufferEngine().compressDslText(text);
	}

	public pruneHistoricalVisionPayloads<T extends { role?: string; content?: unknown }>(messages: T[]): T[] {
		return this.getTokenBufferEngine().pruneHistoricalVisionPayloads(messages as never) as T[];
	}

	public compactHistoricalToolOutputs<T extends { role?: string; content?: unknown }>(messages: T[]): T[] {
		return this.getTokenBufferEngine().compactHistoricalToolOutputs(messages);
	}

	public sanitizeAssistantContent(content: string): string {
		return this.getTokenBufferEngine().sanitizeAssistantContent(content);
	}

	public normalizeSystemPrompt(prompt: string): string {
		return this.getTokenBufferEngine().normalizeSystemPrompt(prompt);
	}

	// ============================================================================
	// Preventative Disk Erosion & Storage Maintenance API
	// ============================================================================

	public getStorageManager(): StorageManager {
		if (!this.storageManager) {
			this.storageManager = StorageManager.getInstance();
		}
		return this.storageManager;
	}

	public getSQLiteMaintenanceEngine(): SQLiteMaintenanceEngine {
		if (!this.sqliteMaintenanceEngine) {
			this.sqliteMaintenanceEngine = sqliteMaintenanceEngine;
		}
		return this.sqliteMaintenanceEngine;
	}

	public async cleanStaleTempFiles(dirPath: string, maxAgeMs = 10 * 60 * 1000): Promise<number> {
		return await cleanStaleTempFiles(dirPath, maxAgeMs);
	}

	public async atomicWriteFile(
		filePath: string,
		data: string,
		updateChecksum = false,
		createBackup = false,
	): Promise<void> {
		await atomicWriteFile(filePath, data, updateChecksum, createBackup);
	}

	public async calculateFileChecksum(filePath: string): Promise<string> {
		return await calculateFileChecksum(filePath);
	}

	public async verifyDiskIntegrity(dirPath: string): Promise<{ ok: boolean; mismatched: string[] }> {
		return await verifyIntegrity(dirPath);
	}

	public async optimizeStorage(validTaskIds?: string[]): Promise<StorageOptimizationResult> {
		return await this.getStorageManager().optimizeStorage(validTaskIds);
	}

	public startBackgroundStorageMaintenance(validTaskIds?: string[]): void {
		this.getStorageManager().startBackgroundMaintenance(validTaskIds);
	}

	public stopBackgroundStorageMaintenance(): void {
		this.getStorageManager().stopBackgroundMaintenance();
	}

	// ============================================================================
	// JoyZoning Strategy & Architectural Governance API
	// ============================================================================

	public detectWorkspaceArchitectureProfile(cwd?: string): WorkspaceArchitectureProfile {
		return detectWorkspaceArchitectureProfile(cwd || this.options.cwd || process.cwd());
	}

	public getStabilityPolicy(cwd?: string): StabilityPolicy {
		return StabilityPolicy.getInstance(cwd || this.options.cwd || process.cwd());
	}

	public validateJoyZoning(filePath: string, content: string): { success: boolean; errors: string[] } {
		return validateJoyZoning(filePath, content);
	}

	public getLayer(filePath: string, content?: string): Layer {
		return getLayer(filePath, content);
	}

	public suggestLayerForContent(content: string): { layer: Layer; reason: string } | null {
		return suggestLayerForContent(content);
	}

	public generateLayerComment(filePath: string, layer: string, content?: string): string | null {
		return generateLayerComment(filePath, layer, content);
	}

	public isLayerTagSupported(filePath: string, content?: string): boolean {
		return isLayerTagSupported(filePath, content);
	}

	public parseLayerTag(content: string): Layer | null {
		return parseLayerTag(content);
	}

	public validateSmells(filePath: string, content: string): string[] {
		return validateSmells(filePath, content);
	}

	public validateLayering(filePath: string, content: string): string[] {
		return validateLayering(filePath, content);
	}

	public validateImportDepth(filePath: string, content: string): string[] {
		return validateImportDepth(filePath, content);
	}

	public async runJoyZoningAudit(
		request: Parameters<typeof triggerJoyZoningAudit>[1],
		responseStream: Parameters<typeof triggerJoyZoningAudit>[2],
		requestId?: string,
	): Promise<void> {
		const controller = this.getController();
		if (!controller) throw new Error("Controller is not initialized.");
		await triggerJoyZoningAudit(controller, request, responseStream, requestId);
	}

	public async executeJoyZoningRefactor(
		request: Parameters<typeof executeJoyZoningRefactor>[1],
	): ReturnType<typeof executeJoyZoningRefactor> {
		const controller = this.getController();
		if (!controller) throw new Error("Controller is not initialized.");
		return await executeJoyZoningRefactor(controller, request);
	}

	public async executeJoyZoningBatchRefactor(
		request: Parameters<typeof executeJoyZoningBatchRefactor>[1],
	): ReturnType<typeof executeJoyZoningBatchRefactor> {
		const controller = this.getController();
		if (!controller) throw new Error("Controller is not initialized.");
		return await executeJoyZoningBatchRefactor(controller, request);
	}

	public ensureLayerHeader(filePath: string, content: string): { updated: boolean; content: string } {
		if (!this.isLayerTagSupported(filePath, content)) {
			return { updated: false, content };
		}
		const layer = this.getLayer(filePath, content);
		const newContent = this.generateLayerComment(filePath, layer, content);
		if (newContent && newContent !== content) {
			return { updated: true, content: newContent };
		}
		return { updated: false, content };
	}

	public async getJoyZoningHealthSummary(cwd?: string): Promise<{
		profile: WorkspaceArchitectureProfile;
		fileCount: number;
		layerDistribution: Record<Layer, number>;
		tagCoveragePercentage: number;
		violationsCount: number;
	}> {
		const targetCwd = cwd || this.options.cwd || process.cwd();
		const profile = this.detectWorkspaceArchitectureProfile(targetCwd);
		const distribution: Record<Layer, number> = {
			domain: 0,
			core: 0,
			infrastructure: 0,
			plumbing: 0,
			ui: 0,
		};

		let fileCount = 0;
		let taggedCount = 0;
		let violationsCount = 0;

		const walkDir = (dir: string) => {
			let entries: fs.Dirent[] = [];
			try {
				entries = fs.readdirSync(dir, { withFileTypes: true });
			} catch {
				return;
			}

			for (const entry of entries) {
				if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") continue;
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					walkDir(fullPath);
				} else if (entry.isFile()) {
					const ext = path.extname(entry.name).toLowerCase();
					if ([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"].includes(ext)) {
						fileCount++;
						try {
							const content = fs.readFileSync(fullPath, "utf-8");
							const layer = this.getLayer(fullPath, content);
							distribution[layer] = (distribution[layer] || 0) + 1;
							const tag = this.parseLayerTag(content);
							if (tag) taggedCount++;
							const res = this.validateJoyZoning(fullPath, content);
							violationsCount += res.errors.length;
						} catch {
							// skip unreadable file
						}
					}
				}
			}
		};

		walkDir(targetCwd);

		const tagCoveragePercentage = fileCount > 0 ? Math.round((taggedCount / fileCount) * 100) : 100;
		return {
			profile,
			fileCount,
			layerDistribution: distribution,
			tagCoveragePercentage,
			violationsCount,
		};
	}

	// ============================================================================
	// Specialized Cerebras Optimization & Token Saturation Flow API
	// ============================================================================

	public getApcStableEngine(options?: {
		maxToolOutputLength?: number;
		activeVisionWindow?: number;
	}): ApcStableIngestionEngine {
		if (!this.apcStableEngine) {
			this.apcStableEngine = options ? new ApcStableIngestionEngine(options) : defaultApcStableEngine;
		}
		return this.apcStableEngine;
	}

	public prepareCerebrasMessages(
		messages: Parameters<typeof prepareCerebrasMessages>[0],
	): ReturnType<typeof prepareCerebrasMessages> {
		return prepareCerebrasMessages(messages);
	}

	public createCerebrasHandler(options: { cerebrasApiKey?: string; apiModelId?: string }): CerebrasHandler {
		return new CerebrasHandler(options);
	}

	public processCerebrasTokenSaturationFlow<T extends { role?: string; content?: unknown }>(
		systemPrompt: string,
		messages: T[],
		options: {
			maxAllowedTokens?: number;
			activeVisionWindow?: number;
			keepFullToolTurns?: number;
		} = {},
	): {
		normalizedSystemPrompt: string;
		apcStableMessages: T[];
		estimatedTokenCount: number;
	} {
		const apcEngine = this.getApcStableEngine({
			activeVisionWindow: options.activeVisionWindow ?? 1,
		});
		const normalizedSystemPrompt = apcEngine.normalizeSystemPrompt(systemPrompt);
		const sanitizedMessages = messages.map((msg) => {
			if (msg.role === "assistant" && typeof msg.content === "string") {
				return { ...msg, content: apcEngine.sanitizeAssistantContent(msg.content) };
			}
			return msg;
		});

		const processed = this.getTokenBufferEngine().optimizeMessagesPipeline({
			systemPrompt: normalizedSystemPrompt,
			messages: sanitizedMessages as never,
			maxAllowedTokens: options.maxAllowedTokens ?? 100_000,
		});

		const estTokens = apcEngine.estimateTokenCount(
			normalizedSystemPrompt + JSON.stringify(processed.optimizedMessages),
		);

		return {
			normalizedSystemPrompt,
			apcStableMessages: processed.optimizedMessages as unknown as T[],
			estimatedTokenCount: estTokens,
		};
	}

	public getCerebrasCacheTelemetryReport(): LifetimeTelemetryStats {
		return this.getTokenBufferEngine().getLifetimeTelemetryReport();
	}
}
