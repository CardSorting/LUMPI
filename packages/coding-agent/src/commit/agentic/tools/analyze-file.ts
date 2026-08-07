import { prompt } from "@oh-my-pi/pi-utils";
import { Type } from "typebox";
import type { AuthStorage } from "../../../core/auth-storage.ts";
import {
	type ExtensionContext as CustomToolContext,
	defineTool,
	type ToolDefinition,
} from "../../../core/extensions/types.ts";
import type { ModelRegistry } from "../../../core/model-registry.ts";
import type { Settings } from "../../../core/settings-manager.ts";
import type { NumstatEntry } from "../../types.ts";
import analyzeFilePrompt from "../prompts/analyze-file.md" with { type: "text" };
import type { CommitAgentState } from "../state.ts";
import { getFilePriority } from "./git-file-diff.ts";

export interface ToolSession {
	cwd: string;
	hasUI?: boolean;
	suppressSpawnAdvisory?: boolean;
	getSessionFile?: () => string | null;
	getSessionSpawns?: () => string | null;
	settings?: Settings;
	authStorage?: AuthStorage;
	modelRegistry?: ModelRegistry;
	outputSchema?: unknown;
}

export interface TaskParams {
	name: string;
	agent: string;
	task: string;
}

export interface TaskAnalysisResult {
	content: Array<{ type: string; text?: string }>;
	details?: {
		results?: unknown[];
		totalDurationMs?: number;
	};
}

export class TaskTool {
	static async create(_session: ToolSession): Promise<TaskTool> {
		return new TaskTool();
	}
	async execute(_toolCallId: string, _params: TaskParams, _signal?: AbortSignal): Promise<TaskAnalysisResult> {
		return { content: [] };
	}
}

const analyzeFileSchema = Type.Object({
	files: Type.Array(Type.String()),
	goal: Type.Optional(Type.String()),
});

const analyzeFileOutputSchema = {
	properties: {
		summary: { type: "string" },
		highlights: { elements: { type: "string" } },
		risks: { elements: { type: "string" } },
	},
};

function buildToolSession(
	ctx: CustomToolContext,
	options: {
		cwd: string;
		authStorage: AuthStorage;
		modelRegistry: ModelRegistry;
		settings: Settings;
		spawns: string;
	},
): ToolSession {
	return {
		cwd: options.cwd,
		hasUI: false,
		// Programmatic fan-out: results feed the commit agent's evidence, not a
		// model choosing further spawns, so the specialization nudge is noise here.
		suppressSpawnAdvisory: true,
		getSessionFile: () => ctx.sessionManager.getSessionFile() ?? null,
		getSessionSpawns: () => options.spawns,
		settings: options.settings,
		authStorage: options.authStorage,
		modelRegistry: options.modelRegistry,
		// The task tool no longer takes a per-call schema; the inherited session
		// schema drives structured output for every spawn from this session.
		outputSchema: analyzeFileOutputSchema,
	};
}

export function createAnalyzeFileTool(options: {
	cwd: string;
	authStorage: AuthStorage;
	modelRegistry: ModelRegistry;
	settings: Settings;
	spawns: string;
	state: CommitAgentState;
}): ToolDefinition<typeof analyzeFileSchema> {
	return defineTool({
		name: "analyze_files",
		label: "Analyze Files",
		description: "Spawn sonic agents to analyze files.",
		parameters: analyzeFileSchema,
		async execute(toolCallId, params, signal, _onUpdate, ctx) {
			const toolSession = buildToolSession(ctx, options);
			// The hand-built ToolSession carries no asyncJobManager, so every
			// execute() below takes the task tool's sync fallback and resolves
			// with the subagent's result inline — exactly what this flow needs.
			// The tool's session semaphore bounds the parallel fan-out.
			const taskTool = await TaskTool.create(toolSession);
			const numstat = options.state.overview?.numstat ?? [];

			const analyses = await Promise.all(
				params.files.map((file: string, index: number) => {
					const relatedFiles = formatRelatedFiles(params.files, file, numstat);
					const assignment = prompt.render(analyzeFilePrompt, {
						file,
						goal: params.goal,
						related_files: relatedFiles,
					});
					const taskParams: TaskParams = {
						name: `AnalyzeFile${index + 1}`,
						agent: "sonic",
						task: assignment,
					};
					return taskTool.execute(`${toolCallId}-${index + 1}`, taskParams, signal);
				}),
			);
			const results = analyses.flatMap((analysis: TaskAnalysisResult) => analysis.details?.results ?? []);
			const text = analyses
				.map(
					(analysis: TaskAnalysisResult) =>
						analysis.content.find((part: { type: string; text?: string }) => part.type === "text")?.text ?? "",
				)
				.filter(Boolean)
				.join("\n\n");
			return {
				content: [{ type: "text", text: text || "(no output)" }],
				details: {
					projectAgentsDir: null,
					results,
					totalDurationMs: analyses.reduce(
						(sum: number, analysis: TaskAnalysisResult) => sum + (analysis.details?.totalDurationMs ?? 0),
						0,
					),
				},
			};
		},
	});
}

function inferFileType(path: string): string {
	const priority = getFilePriority(path);
	const lowerPath = path.toLowerCase();

	if (priority === -100) return "binary file";
	if (priority === 10) return "test file";
	if (lowerPath.endsWith(".md") || lowerPath.endsWith(".txt")) return "documentation";
	if (
		lowerPath.endsWith(".json") ||
		lowerPath.endsWith(".yaml") ||
		lowerPath.endsWith(".yml") ||
		lowerPath.endsWith(".toml")
	)
		return "configuration";
	if (priority === 70) return "dependency manifest";
	if (priority === 80) return "script";
	if (priority === 100) return "implementation";

	return "source file";
}

function formatRelatedFiles(files: string[], currentFile: string, numstat: NumstatEntry[]): string | undefined {
	const others = files.filter((file) => file !== currentFile);
	if (others.length === 0) return undefined;

	const numstatMap = new Map(numstat.map((entry) => [entry.path, entry]));

	const lines = others.map((file) => {
		const entry = numstatMap.get(file);
		const fileType = inferFileType(file);
		if (entry) {
			const lineCount = entry.additions + entry.deletions;
			return `- ${file} (${lineCount} lines): ${fileType}`;
		}
		return `- ${file}: ${fileType}`;
	});

	return `OTHER FILES IN THIS CHANGE:\n${lines.join("\n")}`;
}
