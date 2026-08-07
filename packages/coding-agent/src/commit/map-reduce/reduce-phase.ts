import type { ThinkingLevel } from "@noorm/lumi-agent-core";
import type { Api, Model } from "@noorm/lumi-ai";
import { completeSimple } from "@noorm/lumi-ai/compat";
import { prompt } from "@oh-my-pi/pi-utils";
import reduceSystemPrompt from "../../commit/prompts/reduce-system.md" with { type: "text" };
import reduceUserPrompt from "../../commit/prompts/reduce-user.md" with { type: "text" };
import type { ConventionalAnalysis, FileObservation } from "../../commit/types.ts";
import { toReasoningEffort } from "../../thinking.ts";
import { createConventionalAnalysisTool, parseConventionalAnalysisResponse } from "../shared-llm.ts";

const ReduceTool = createConventionalAnalysisTool("Synthesize file observations into a conventional commit analysis.");

export interface ReducePhaseInput {
	model: Model<Api>;
	apiKey: string;
	thinkingLevel?: ThinkingLevel;
	observations: FileObservation[];
	stat: string;
	scopeCandidates: string;
	typesDescription?: string;
}

export async function runReducePhase({
	model,
	apiKey,
	thinkingLevel,
	observations,
	stat,
	scopeCandidates,
	typesDescription,
}: ReducePhaseInput): Promise<ConventionalAnalysis> {
	const userContent = prompt.render(reduceUserPrompt, {
		types_description: typesDescription,
		observations: observations.flatMap((obs) => obs.observations.map((line) => `- ${obs.file}: ${line}`)).join("\n"),
		stat,
		scope_candidates: scopeCandidates,
	});
	const response = await completeSimple(
		model,
		{
			systemPrompt: prompt.render(reduceSystemPrompt),
			messages: [{ role: "user", content: userContent, timestamp: Date.now() }],
			tools: [ReduceTool],
		},
		{ apiKey, maxTokens: 2400, reasoning: toReasoningEffort(thinkingLevel) },
	);

	return parseConventionalAnalysisResponse(response, ReduceTool);
}
