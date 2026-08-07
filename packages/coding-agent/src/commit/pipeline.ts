import * as path from "node:path";
import type { ThinkingLevel } from "@noorm/lumi-agent-core";
import type { Api, Model } from "@noorm/lumi-ai";
import { getProjectDir, logger, prompt } from "@oh-my-pi/pi-utils";
import { getAgentDir } from "../config.ts";
import { AuthStorage } from "../core/auth-storage.ts";
import { ModelRegistry } from "../core/model-registry.ts";
import { ModelRuntime } from "../core/model-runtime.ts";
import { loadProjectContextFiles } from "../core/resource-loader.ts";
import { SettingsManager } from "../core/settings-manager.ts";
import * as git from "../utils/git.ts";
import { runAgenticCommit } from "./agentic/index.ts";
import {
	extractScopeCandidates,
	generateConventionalAnalysis,
	generateSummary,
	validateAnalysis,
	validateSummary,
} from "./analysis/index.ts";
import { runChangelogFlow } from "./changelog/index.ts";
import { abortOnGitFailure, pushOrAbort } from "./execute.ts";
import { runMapReduceAnalysis, shouldUseMapReduce } from "./map-reduce/index.ts";
import { formatCommitMessage } from "./message.ts";
import { resolvePrimaryModel, resolveSmolModel } from "./model-selection.ts";
import summaryRetryPrompt from "./prompts/summary-retry.md" with { type: "text" };
import typesDescriptionPrompt from "./prompts/types-description.md" with { type: "text" };
import type { CommitCommandArgs, ConventionalAnalysis } from "./types.ts";

const SUMMARY_MAX_CHARS = 72;
const RECENT_COMMITS_COUNT = 8;
let typesDescription: string | undefined;
const TYPES_DESCRIPTION = (): string => (typesDescription ??= prompt.render(typesDescriptionPrompt));

interface CommitSettings {
	mapReduceEnabled: boolean;
	mapReduceMinFiles: number;
	mapReduceMaxFileTokens: number;
	mapReduceTimeoutMs: number;
	mapReduceMaxConcurrency: number;
	changelogMaxDiffChars: number;
}

const DEFAULT_COMMIT_SETTINGS: CommitSettings = {
	mapReduceEnabled: true,
	mapReduceMinFiles: 4,
	mapReduceMaxFileTokens: 50_000,
	mapReduceTimeoutMs: 120_000,
	mapReduceMaxConcurrency: 5,
	changelogMaxDiffChars: 120_000,
};

function getCommitSettings(settings: ReturnType<SettingsManager["getSettings"]>): CommitSettings {
	const rawCommit = (settings as unknown as Record<string, unknown>).commit;
	if (typeof rawCommit !== "object" || rawCommit === null || Array.isArray(rawCommit)) {
		return { ...DEFAULT_COMMIT_SETTINGS };
	}
	const values = rawCommit as Record<string, unknown>;
	const numberSetting = (key: keyof CommitSettings): number => {
		const value = values[key];
		return typeof value === "number" && Number.isFinite(value) ? value : (DEFAULT_COMMIT_SETTINGS[key] as number);
	};
	return {
		mapReduceEnabled:
			typeof values.mapReduceEnabled === "boolean"
				? values.mapReduceEnabled
				: DEFAULT_COMMIT_SETTINGS.mapReduceEnabled,
		mapReduceMinFiles: numberSetting("mapReduceMinFiles"),
		mapReduceMaxFileTokens: numberSetting("mapReduceMaxFileTokens"),
		mapReduceTimeoutMs: numberSetting("mapReduceTimeoutMs"),
		mapReduceMaxConcurrency: numberSetting("mapReduceMaxConcurrency"),
		changelogMaxDiffChars: numberSetting("changelogMaxDiffChars"),
	};
}

export async function runCommitPipeline(args: CommitCommandArgs): Promise<void> {
	if (args.legacy) {
		await runLegacyCommitCommand(args);
	} else {
		await runAgenticCommit(args);
	}
}

async function runLegacyCommitCommand(args: CommitCommandArgs): Promise<void> {
	const cwd = getProjectDir();
	const settingsManager = SettingsManager.create(cwd);
	const settings = settingsManager.getSettings();
	const commitSettings = getCommitSettings(settings);
	const authStorage = AuthStorage.create();
	const modelRuntime = await ModelRuntime.create({ credentials: authStorage });
	const modelRegistry = new ModelRegistry(modelRuntime);
	await modelRegistry.refresh();

	const {
		model: primaryModel,
		apiKey: primaryApiKey,
		thinkingLevel: primaryThinkingLevel,
	} = await resolvePrimaryModel(args.model, settings, modelRegistry);
	const {
		model: smolModel,
		apiKey: smolApiKey,
		thinkingLevel: smolThinkingLevel,
	} = await resolveSmolModel(settings, modelRegistry, primaryModel, primaryApiKey);

	let stagedFiles = await git.diff.changedFiles(cwd, { cached: true });
	if (stagedFiles.length === 0) {
		process.stdout.write("No staged changes detected, staging all changes...\n");
		await git.stage.files(cwd);
		stagedFiles = await git.diff.changedFiles(cwd, { cached: true });
	}
	if (stagedFiles.length === 0) {
		if (args.push) {
			process.stdout.write("No changes to commit; pushing existing commits...\n");
			await pushOrAbort(cwd);
			return;
		}
		process.stderr.write("No changes to commit.\n");
		return;
	}

	if (!args.noChangelog) {
		await runChangelogFlow({
			cwd,
			model: primaryModel,
			apiKey: primaryApiKey,
			thinkingLevel: primaryThinkingLevel,
			stagedFiles,
			dryRun: args.dryRun,
			maxDiffChars:
				typeof commitSettings.changelogMaxDiffChars === "number" ? commitSettings.changelogMaxDiffChars : undefined,
		});
	}

	const diff = await git.diff(cwd, { cached: true });
	const stat = await git.diff(cwd, { stat: true, cached: true });
	const numstat = await git.diff.numstat(cwd, { cached: true });
	const scopeCandidates = extractScopeCandidates(numstat).scopeCandidates;
	const recentCommits = await git.log.subjects(cwd, RECENT_COMMITS_COUNT);
	const contextFiles = loadProjectContextFiles({ cwd, agentDir: getAgentDir() });
	const formattedContextFiles = contextFiles.map((file: { path: string; content: string }) => ({
		path: path.relative(cwd, file.path),
		content: file.content,
	}));

	const analysis = await generateAnalysis({
		diff,
		stat,
		scopeCandidates,
		recentCommits,
		contextFiles: formattedContextFiles,
		userContext: args.context,
		primaryModel,
		primaryApiKey,
		primaryThinkingLevel,
		smolModel,
		smolApiKey,
		smolThinkingLevel,
		commitSettings,
	});

	const analysisValidation = validateAnalysis(analysis);
	if (!analysisValidation.valid) {
		logger.warn("commit analysis validation failed", { errors: analysisValidation.errors });
	}

	const summary = await generateSummaryWithRetry({
		analysis,
		stat,
		model: primaryModel,
		apiKey: primaryApiKey,
		thinkingLevel: primaryThinkingLevel,
		userContext: args.context,
	});

	const commitMessage = formatCommitMessage(analysis, summary.summary);

	if (args.dryRun) {
		process.stdout.write("\nGenerated commit message:\n");
		process.stdout.write(`${commitMessage}\n`);
		return;
	}

	try {
		await git.commit(cwd, commitMessage);
	} catch (error) {
		if (error instanceof git.GitCommandError) abortOnGitFailure("Commit failed", error);
		throw error;
	}
	process.stdout.write("Commit created.\n");
	if (args.push) await pushOrAbort(cwd);
}

async function generateAnalysis(input: {
	diff: string;
	stat: string;
	scopeCandidates: string;
	recentCommits: string[];
	contextFiles: Array<{ path: string; content: string }>;
	userContext?: string;
	primaryModel: Model<Api>;
	primaryApiKey: string;
	primaryThinkingLevel?: ThinkingLevel;
	smolModel: Model<Api>;
	smolApiKey: string;
	smolThinkingLevel?: ThinkingLevel;
	commitSettings: CommitSettings;
}): Promise<ConventionalAnalysis> {
	if (
		shouldUseMapReduce(input.diff, {
			enabled: input.commitSettings.mapReduceEnabled,
			minFiles: input.commitSettings.mapReduceMinFiles,
			maxFileTokens: input.commitSettings.mapReduceMaxFileTokens,
		})
	) {
		process.stdout.write("Large diff detected, using map-reduce analysis...\n");
		return runMapReduceAnalysis({
			model: input.primaryModel,
			apiKey: input.primaryApiKey,
			thinkingLevel: input.primaryThinkingLevel,
			smolModel: input.smolModel,
			smolApiKey: input.smolApiKey,
			smolThinkingLevel: input.smolThinkingLevel,
			diff: input.diff,
			stat: input.stat,
			scopeCandidates: input.scopeCandidates,
			typesDescription: TYPES_DESCRIPTION(),
			settings: {
				enabled: input.commitSettings.mapReduceEnabled,
				minFiles: input.commitSettings.mapReduceMinFiles,
				maxFileTokens: input.commitSettings.mapReduceMaxFileTokens,
				maxConcurrency: input.commitSettings.mapReduceMaxConcurrency,
				timeoutMs: input.commitSettings.mapReduceTimeoutMs,
			},
		});
	}

	return generateConventionalAnalysis({
		model: input.primaryModel,
		apiKey: input.primaryApiKey,
		thinkingLevel: input.primaryThinkingLevel,
		contextFiles: input.contextFiles,
		userContext: input.userContext,
		typesDescription: TYPES_DESCRIPTION(),
		recentCommits: input.recentCommits,
		scopeCandidates: input.scopeCandidates,
		stat: input.stat,
		diff: input.diff,
	});
}

async function generateSummaryWithRetry(input: {
	analysis: ConventionalAnalysis;
	stat: string;
	model: Model<Api>;
	apiKey: string;
	thinkingLevel?: ThinkingLevel;
	userContext?: string;
}): Promise<{ summary: string }> {
	let context = input.userContext;
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const result = await generateSummary({
			model: input.model,
			apiKey: input.apiKey,
			thinkingLevel: input.thinkingLevel,
			commitType: input.analysis.type,
			scope: input.analysis.scope,
			details: input.analysis.details.map((detail) => detail.text),
			stat: input.stat,
			maxChars: SUMMARY_MAX_CHARS,
			userContext: context,
		});
		const validation = validateSummary(result.summary, SUMMARY_MAX_CHARS);
		if (validation.valid) {
			return result;
		}
		if (attempt === 2) {
			return result;
		}
		context = buildRetryContext(input.userContext, validation.errors);
	}
	throw new Error("Summary generation failed");
}

function buildRetryContext(base: string | undefined, errors: string[]): string {
	return prompt.render(summaryRetryPrompt, {
		base_context: base,
		errors: errors.join("; "),
	});
}
