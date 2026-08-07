import type { ThinkingLevel } from "@noorm/lumi-agent-core";
import type { Api, Model } from "@noorm/lumi-ai";
import type { ModelRegistry } from "../core/model-registry.ts";
import { findExactModelReferenceMatch, parseModelPattern } from "../core/model-resolver.ts";
import type { Settings } from "../core/settings-manager.ts";

const SMOL_MODEL_PATTERNS = ["claude-3-5-haiku", "gpt-4o-mini", "gemini-1.5-flash"];

export interface ResolvedCommitModel {
	model: Model<Api>;
	/** API key used by the compatibility completion helpers. */
	apiKey: string;
	/** Explicit thinking level from the model selector, if one was supplied. */
	thinkingLevel?: ThinkingLevel;
}

type CommitModelRegistry = Pick<ModelRegistry, "getAvailable" | "getApiKeyForProvider">;

function resolveModelPattern(
	pattern: string,
	available: Model<Api>[],
): { model: Model<Api>; thinkingLevel?: ThinkingLevel } | undefined {
	const exact = findExactModelReferenceMatch(pattern, available);
	if (exact) return { model: exact };
	const parsed = parseModelPattern(pattern, available);
	return parsed.model ? { model: parsed.model, thinkingLevel: parsed.thinkingLevel } : undefined;
}

function resolveDefaultModel(
	settings: Settings,
	available: Model<Api>[],
): { model: Model<Api>; thinkingLevel?: ThinkingLevel } | undefined {
	if (settings.defaultProvider && settings.defaultModel) {
		const exact = findExactModelReferenceMatch(`${settings.defaultProvider}/${settings.defaultModel}`, available);
		if (exact) return { model: exact, thinkingLevel: settings.defaultThinkingLevel };
	}
	if (settings.defaultModel) {
		const parsed = resolveModelPattern(settings.defaultModel, available);
		if (parsed) return { ...parsed, thinkingLevel: settings.defaultThinkingLevel ?? parsed.thinkingLevel };
	}
	const first = available[0];
	return first ? { model: first, thinkingLevel: settings.defaultThinkingLevel } : undefined;
}

export async function resolvePrimaryModel(
	override: string | undefined,
	settings: Settings,
	modelRegistry: CommitModelRegistry,
): Promise<ResolvedCommitModel> {
	const available = modelRegistry.getAvailable();
	const resolved = override ? resolveModelPattern(override, available) : resolveDefaultModel(settings, available);
	if (!resolved) {
		throw new Error("No model available for commit generation");
	}
	const apiKey = await modelRegistry.getApiKeyForProvider(resolved.model.provider);
	if (!apiKey) {
		throw new Error(`No API key available for model ${resolved.model.provider}/${resolved.model.id}`);
	}
	return { model: resolved.model, apiKey, thinkingLevel: resolved.thinkingLevel };
}

export async function resolveSmolModel(
	_settings: Settings,
	modelRegistry: CommitModelRegistry,
	fallbackModel: Model<Api>,
	fallbackApiKey: string,
): Promise<ResolvedCommitModel> {
	const available = modelRegistry.getAvailable();
	for (const pattern of SMOL_MODEL_PATTERNS) {
		const candidate = resolveModelPattern(pattern, available);
		if (!candidate) continue;
		const apiKey = await modelRegistry.getApiKeyForProvider(candidate.model.provider);
		if (apiKey) return { model: candidate.model, apiKey, thinkingLevel: candidate.thinkingLevel };
	}
	return { model: fallbackModel, apiKey: fallbackApiKey };
}
