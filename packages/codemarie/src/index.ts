export { HostProvider } from "./hosts/host-provider.js";
export {
	initializeCliHostProvider,
	CliWorkspaceClient,
	CliEnvClient,
	CliWindowClient,
	CliDiffClient,
} from "./hosts/cli/cli-host-provider.js";

// Core Controller & Task Engine
export { Controller } from "./core/controller/index.js";

// MoD Prompt Steering & Registry
export {
	getSystemPrompt,
	PromptRegistry,
	PromptBuilder,
	VariantBuilder,
	DietCodeToolSet,
	TemplateEngine,
} from "./core/prompts/system-prompt/index.js";

// Policy & Governance Guardrails
export { UniversalGuard } from "./core/policy/UniversalGuard.js";
export { PlanModeEnforcer } from "./core/policy/PlanModeEnforcer.js";
export { FluidPolicyEngine } from "./core/policy/FluidPolicyEngine.js";

// Roadmap Steering & Context
export { OPERATOR_PLAYBOOK, recommendNextAction, determinePhase } from "./services/roadmap/RoadmapOperator.js";
export { invalidateSessionBriefCache } from "./services/roadmap/RoadmapSession.js";
export { buildSteeringContext, enrichPayloadWithSteering } from "./services/roadmap/RoadmapSteeringContext.js";

// BroccoliDB Context Compaction & State Persistence
export { BroccoliContextCompactionStore } from "./core/context/context-management/BroccoliContextCompactionStore.js";
export { AgentContext, Connection, Workspace, OrchestrationRuntime } from "@noorm/broccolidb";

// Workspace Intelligence (Strategy 1)
export { WorkspaceIntelligenceEngine } from "./core/workspace-intelligence/WorkspaceIntelligenceEngine.js";

// Spider Engine & Forensic Audit (Strategy 2)
export { SpiderEngine } from "./core/policy/spider/SpiderEngine.js";

// Persistent Event Stream Hub (Strategy 4)
export {
	PersistentSubscriptionHub,
	disposeAllPersistentSubscriptionHubs,
} from "./core/controller/persistent-subscription-hub.js";

// Context Knowledge & Pruning Engine
export { KnowledgeGraphService } from "./core/context/KnowledgeGraphService.js";
export { ContextPruner } from "./core/context/ContextPruner.js";

// Environmental Integrity & Governance Locks
export { EnvironmentIntegrity, type EnvironmentLease } from "./core/integrity/EnvironmentIntegrity.js";
export { createLockAuthority, type LockAuthority } from "./core/governance/LockAuthority.js";

// Roadmap Diagnostics
export { runDoctorChecks } from "./services/roadmap/RoadmapDoctor.js";

// Infrastructure Storage & Maintenance Engines
export { WriteCoalescer } from "./core/storage/WriteCoalescer.js";
export { TaskLatencyTracker, type TaskLatencySnapshot } from "./core/task/latency/TaskLatencyTracker.js";

// Context Staleness & Swarm Mutex
export { ContextStalenessTracker } from "./core/context/ContextStalenessTracker.js";
export { SwarmMutexService, type DurableSwarmLease } from "./core/swarm/SwarmMutexService.js";

// Roadmap Gate Catalog & Response Formatter
export {
	buildGateStateFromInputs,
	collectGateInputs,
	evaluateGateChecks,
	type GateInputs,
	type GateState,
	type GateClosedEntry,
} from "./services/roadmap/RoadmapGateCatalog.js";
export { formatResponse } from "./core/prompts/responses.js";

// Slash Commands
export { BASE_SLASH_COMMANDS } from "./shared/slashCommands.js";

// Notebook Utilities
export { sanitizeNotebookForLLM, sanitizeCellForLLM } from "./integrations/misc/notebook-utils.js";

// Content Limits
export { MAX_CONTENT_SIZE_BYTES, formatBytes, truncateContent } from "./shared/content-limits.js";

// Partial Array Stream Utilities
export { parsePartialArrayString, findLastIndex, findLast } from "./shared/array.js";

// Roadmap Schema Helpers
export { findBootstrapPlaceholders, REQUIRED_SECTIONS, HEALTH_STATUSES } from "./services/roadmap/RoadmapSchema.js";

// Broccoli Fencing & Auto Governance Policy
export {
	readBroccoliFence,
	broccoliFencePath,
	type BroccoliFenceRecord,
	type BroccoliFenceReadResult,
} from "./core/governance/BroccoliFencingAdapter.js";
export {
	AUTO_GOVERNANCE,
	ROADMAP_DIAGNOSTIC_SLASH_COMMANDS,
	governanceFieldsFromStatus,
} from "./services/roadmap/RoadmapAutoGovernance.js";

// JoyRide Execution Caching & Diagnostic Engine
export {
	getJoyRideCache,
	shutdownJoyRideCache,
	canCommandSkipExecution,
	classifyCommand,
	isCommandCacheEligible,
	isEnvAlteringCommand,
	isReadOnlyCacheableCommand,
	isVerificationCommand,
	explainJoyRideConfig,
	getJoyRideConfig,
	getJoyRideDegradedReason,
	isCommandReuseEnabled,
	isDiagnosticsOnly,
	isJoyRideDegraded,
	isJoyRideDisabled,
	isScratchCacheEnabled,
	isSearchCacheEnabled,
	isVerificationCacheEnabled,
	loadJoyRideConfigFromEnv,
	resetJoyRideConfig,
	setJoyRideConfig,
	buildJoyRideWorkspaceSnapshot,
	clearJoyRideDecisionLog,
	explainJoyRideDecision,
	getJoyRideDecisionLog,
	getLastJoyRideDecision,
	isJoyRideHitDecision,
	buildJoyRideDiagnosticReport,
	createJoyRideBugReportSnapshot,
	dumpJoyRideDiagnostics,
	formatJoyRideDiagnosticReport,
	getJoyRideStats,
	logJoyRideDiagnostics,
	summarizeJoyRideHealth,
	createJoyRideTaskScope,
	lookupSafeCommandResult,
	lookupSearchResult,
	lookupVerificationProof,
	storeCommandDiagnostic,
	storeFailedVerificationDiagnostic,
	storeReusableCommandResult,
	storeSearchResult,
	storeVerificationProof,
	bumpTaskGeneration,
	flushTaskGeneration,
	flushWorkspace,
	registerTaskLifecycle,
	shutdownJoyRide,
	withTaskCacheScope,
	JOYRIDE_REASON,
	createScratchArtifactEntry,
	disposeScratchArtifact,
	flushScratchForTask,
	rejectUnsafeArtifact,
	storeScratchArtifactWithCleanup,
	buildVerificationFingerprint,
	explainVerificationMiss,
	lookupVerificationProofWithExplain,
	validateVerificationProof,
	getJoyRideCacheHitAuditCount,
	getJoyRideCacheHitAuditTrail,
} from "./core/joyride/index.js";
export type {
	JoyRideCacheHitAudit,
	JoyRideCommandClassification,
	JoyRideCommandTier,
	JoyRideOperationalConfig,
	JoyRideOperationalMode,
	JoyRideCacheDecision,
	JoyRideCommandLookupDecision,
	JoyRideDecisionContext,
	JoyRideDecisionType,
	JoyRideDegradedDecision,
	JoyRideDiagnosticOnlyDecision,
	JoyRideDisabledDecision,
	JoyRideFallbackBehavior,
	JoyRideHitDecision,
	JoyRideMissDecision,
	JoyRideRejectedDecision,
	JoyRideSearchLookupDecision,
	JoyRideStaleDecision,
	JoyRideDiagnosticReport,
	JoyRideCommandCacheEntry,
	JoyRideGrepCacheEntry,
	JoyRideSearchLookupOptions,
	JoyRideReasonCode,
	ScratchArtifactEntry,
	ScratchArtifactSpec,
	VerificationProofInput,
	JoyRideTaskScope,
	JoyRideWorkspaceSnapshot,
} from "./core/joyride/index.js";
















