import * as os from "node:os";
import * as path from "node:path";
import {
	AUTO_GOVERNANCE,
	BASE_SLASH_COMMANDS,
	BroccoliContextCompactionStore,
	type BroccoliFenceReadResult,
	broccoliFencePath,
	buildGateStateFromInputs,
	buildSteeringContext,
	ContextPruner,
	ContextStalenessTracker,
	Controller,
	createLockAuthority,
	EnvironmentIntegrity,
	type EnvironmentLease,
	findBootstrapPlaceholders,
	findLastIndex,
	formatBytes,
	formatResponse,
	type GateInputs,
	type GateState,
	governanceFieldsFromStatus,
	HEALTH_STATUSES,
	type HostProvider,
	initializeCliHostProvider,
	KnowledgeGraphService,
	type LockAuthority,
	MAX_CONTENT_SIZE_BYTES,
	PersistentSubscriptionHub,
	PlanModeEnforcer,
	parsePartialArrayString,
	REQUIRED_SECTIONS,
	ROADMAP_DIAGNOSTIC_SLASH_COMMANDS,
	readBroccoliFence,
	runDoctorChecks,
	SpiderEngine,
	SwarmMutexService,
	sanitizeCellForLLM,
	sanitizeNotebookForLLM,
	TaskLatencyTracker,
	TemplateEngine,
	truncateContent,
	UniversalGuard,
	VariantBuilder,
	WorkspaceIntelligenceEngine,
	WriteCoalescer,
} from "@earendil-works/pi-codemarie";
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

	public async getSteeringPromptDirectives(): Promise<string> {
		const steering = await this.getSteeringContext();
		if (!steering || steering.ok === false) {
			return "";
		}

		const lines: string[] = ["\n<codemarie_steering>"];
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
}
