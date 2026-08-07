import type { ThinkingLevel } from "@noorm/lumi-agent-core";
import type { Api, AssistantMessage, Model, Tool } from "@noorm/lumi-ai";
import { completeSimple, validateToolCall } from "@noorm/lumi-ai/compat";
import { prompt } from "@oh-my-pi/pi-utils";
import { Type } from "typebox";
import changelogSystemPrompt from "../../commit/prompts/changelog-system.md" with { type: "text" };
import changelogUserPrompt from "../../commit/prompts/changelog-user.md" with { type: "text" };
import type { ChangelogGenerationResult } from "../../commit/types.ts";
import { toReasoningEffort } from "../../thinking.ts";
import { extractTextContent, extractToolCall, parseJsonPayload } from "../utils.ts";

// Each category maps to an optional array of strings.
const changelogEntriesSchema = Type.Object({
	"Breaking Changes": Type.Optional(Type.Array(Type.String())),
	Added: Type.Optional(Type.Array(Type.String())),
	Changed: Type.Optional(Type.Array(Type.String())),
	Deprecated: Type.Optional(Type.Array(Type.String())),
	Removed: Type.Optional(Type.Array(Type.String())),
	Fixed: Type.Optional(Type.Array(Type.String())),
	Security: Type.Optional(Type.Array(Type.String())),
});

const changelogToolParameters = Type.Object({ entries: changelogEntriesSchema });

export const changelogTool = {
	name: "create_changelog_entries",
	description: "Generate changelog entries grouped by Keep a Changelog categories.",
	parameters: changelogToolParameters,
} satisfies Tool<typeof changelogToolParameters>;

interface ChangelogToolParameters {
	entries: Record<string, string[]>;
}

export interface ChangelogPromptInput {
	model: Model<Api>;
	apiKey: string;
	thinkingLevel?: ThinkingLevel;
	changelogPath: string;
	isPackageChangelog: boolean;
	existingEntries?: string;
	stat: string;
	diff: string;
}

export async function generateChangelogEntries({
	model,
	apiKey,
	thinkingLevel,
	changelogPath,
	isPackageChangelog,
	existingEntries,
	stat,
	diff,
}: ChangelogPromptInput): Promise<ChangelogGenerationResult> {
	const userContent = prompt.render(changelogUserPrompt, {
		changelog_path: changelogPath,
		is_package_changelog: isPackageChangelog,
		existing_entries: existingEntries,
		stat,
		diff,
	});
	const response = await completeSimple(
		model,
		{
			systemPrompt: prompt.render(changelogSystemPrompt),
			messages: [{ role: "user", content: userContent, timestamp: Date.now() }],
			tools: [changelogTool],
		},
		{ apiKey, maxTokens: 1200, reasoning: toReasoningEffort(thinkingLevel) },
	);

	const parsed = parseChangelogResponse(response);
	return { entries: dedupeEntries(parsed.entries) };
}

function parseChangelogResponse(message: AssistantMessage): ChangelogGenerationResult {
	const toolCall = extractToolCall(message, "create_changelog_entries");
	if (toolCall) {
		const parsed = validateToolCall([changelogTool], toolCall) as unknown as ChangelogToolParameters;
		return { entries: parsed.entries ?? {} };
	}

	const text = extractTextContent(message);
	const parsed = parseJsonPayload(text) as ChangelogGenerationResult;
	return { entries: parsed.entries ?? {} };
}

function dedupeEntries(entries: Record<string, string[]>): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const [category, values] of Object.entries(entries)) {
		const seen = new Set<string>();
		const cleaned: string[] = [];
		for (const value of values) {
			const trimmed = value.trim().replace(/\.$/, "");
			const key = trimmed.toLowerCase();
			if (!trimmed || seen.has(key)) continue;
			seen.add(key);
			cleaned.push(trimmed);
		}
		if (cleaned.length > 0) {
			result[category] = cleaned;
		}
	}
	return result;
}
