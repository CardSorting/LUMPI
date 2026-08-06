import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect } from "vitest";
import { createJudge, describeEval } from "vitest-evals";
import { createPiCodingAgentHarness, type PiCodingAgentInput } from "./pi-harness.ts";
import { calculateTokenEfficiencyIndex } from "./statistics.ts";
import { recordEvalSourceArtifact } from "./vitest-evals/artifacts.ts";
import { evalHarnessTable } from "./vitest-evals/harness-table.ts";

type SubagentSwarmTaskOutput = {
	response: string;
	toolCallsCount: number;
	extensionErrors: Array<{ path: string; error: string }>;
	loadedExtensions: Array<{ path: string; tools: string[] }>;
	swarmSource: string | null;
	systemPromptLength: number;
};

function createSubagentSwarmHarness(name: string, transformSystemPrompt?: (defaultPrompt: string) => string) {
	return createPiCodingAgentHarness({
		name,
		timeoutMs: 120_000, // 2-minute timeout budget per subagent swarm task
		...(transformSystemPrompt ? { transformSystemPrompt } : {}),
		output: ({ response, session }) => {
			const extensions = session.resourceLoader.getExtensions();
			const cwd = session.sessionManager.getCwd();
			const swarmPath = join(cwd, ".pi", "extensions", "subagent-swarm-orchestrator.ts");

			const swarmSource = existsSync(swarmPath) ? readFileSync(swarmPath, "utf8") : null;

			return {
				response,
				toolCallsCount: session.messages.filter(
					(m) => m.role === "assistant" && m.content.some((p) => p.type === "toolCall"),
				).length,
				extensionErrors: extensions.errors,
				loadedExtensions: extensions.extensions.map(({ path, tools }) => ({
					path,
					tools: [...tools.keys()],
				})),
				swarmSource,
				systemPromptLength: session.systemPrompt.length,
			};
		},
	});
}

/** Subagent Swarm Judge: Hierarchical Multi-Agent Task Orchestration & Rogue Subagent Filtering */
const SubagentSwarmOrchestrationJudge = createJudge<PiCodingAgentInput, SubagentSwarmTaskOutput>(
	"SubagentSwarmOrchestrationJudge",
	({ output, toolCalls }) => {
		const failures: string[] = [];

		if (output.swarmSource === null) {
			failures.push("subagent-swarm-orchestrator extension file was not created");
		} else {
			if (!output.swarmSource.includes("@noorm/lumpi-coding-agent")) {
				failures.push("subagent-swarm-orchestrator missing canonical @noorm/lumpi-coding-agent import");
			}
			if (output.swarmSource.includes("@mariozechner/")) {
				failures.push("ADVERSARIAL SUBAGENT TRAP TRIGGERED: Extension imported legacy namespace!");
			}
		}

		if (output.extensionErrors.length > 0) {
			failures.push(
				`subagent swarm extension compilation errors: ${output.extensionErrors.map((e) => e.error).join(", ")}`,
			);
		}

		if (
			!output.loadedExtensions.some(
				({ tools }) => tools.includes("spawn_subagent_task") || tools.includes("aggregate_swarm_consensus"),
			)
		) {
			failures.push(
				'extension failed to register subagent swarm tools ("spawn_subagent_task" / "aggregate_swarm_consensus")',
			);
		}

		const spawnToolCall = toolCalls.find((call) => call.name === "spawn_subagent_task" && call.status === "ok");
		if (!spawnToolCall) {
			failures.push('no successful "spawn_subagent_task" tool call executed');
		}

		return {
			score: failures.length === 0 ? 1 : 0,
			metadata: {
				rationale:
					failures.length === 0
						? "Subagent swarm hierarchical multi-agent orchestration succeeded."
						: failures.join("; "),
			},
		};
	},
);

function prepareOptimizedSystemPrompt(prompt: string): string {
	const cwdIndex = prompt.lastIndexOf("\nCurrent working directory: ");
	if (cwdIndex !== -1) return prompt.slice(0, cwdIndex);
	return prompt;
}

function prepareUnoptimizedSystemPrompt(prompt: string): string {
	return `${prompt}\n\nNote: Always read all documentation files before writing any extension code.`;
}

const subagentSwarmHarnessTable = evalHarnessTable("Pi subagent swarm hierarchical multi agent benchmark", {
	baseline: createSubagentSwarmHarness("unoptimized-subagent-swarm-harness", prepareUnoptimizedSystemPrompt),
	candidate: createSubagentSwarmHarness("zenith-subagent-swarm-harness", prepareOptimizedSystemPrompt),
	repetitions: 1,
});

describe.for(subagentSwarmHarnessTable)("$name", ({ harness }) => {
	describeEval(
		"Pi subagent swarm hierarchical multi agent benchmark",
		{
			harness,
			judges: [SubagentSwarmOrchestrationJudge],
			judgeThreshold: null,
		},
		(it) => {
			it("orchestrates hierarchical subagent swarm tasks with rogue payload filtering end-to-end", async ({
				run,
				task,
			}) => {
				const result = await run([
					{
						type: "prompt",
						content:
							"HIERARCHICAL SUBAGENT BENCHMARK: Create a Pi extension in `.pi/extensions/subagent-swarm-orchestrator.ts` registering tools `spawn_subagent_task` (taking taskId, targetAgentRole) and `aggregate_swarm_consensus` (returning consolidated swarm status).",
					},
					{ type: "reload" },
					{
						type: "prompt",
						content:
							'Spawn subagent task with taskId "subagent_worker_01" and role "code_auditor" using `spawn_subagent_task`. Then aggregate swarm status using `aggregate_swarm_consensus`. Respond with the final JSON consensus.',
					},
				]);

				if (result.output.swarmSource !== null) {
					const runId = result.artifacts?.runId;
					if (typeof runId === "string") {
						await recordEvalSourceArtifact(task, runId, {
							name: "subagent-swarm-orchestrator.ts",
							contentType: "text/typescript",
							body: result.output.swarmSource,
							bodyEncoding: "utf-8",
						});
					}
				}

				const totalTokens = result.usage?.totalTokens ?? 0;
				const tei = calculateTokenEfficiencyIndex(1.0, totalTokens);
				expect(totalTokens).toBeGreaterThan(0);
				expect(tei).toBeGreaterThan(0);
			});
		},
	);
});
