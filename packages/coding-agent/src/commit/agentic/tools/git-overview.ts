import { Type } from "typebox";
import { defineTool, type ToolDefinition } from "../../../core/extensions/types.ts";
import * as git from "../../../utils/git.ts";
import { extractScopeCandidates } from "../../analysis/scope.ts";
import { EXCLUDED_LOCK_FILES } from "../lock-files.ts";
import type { CommitAgentState, GitOverviewSnapshot } from "../state.ts";

function isExcludedFile(path: string): boolean {
	const basename = path.split("/").pop() ?? path;
	return EXCLUDED_LOCK_FILES.has(basename);
}

function filterExcludedFiles(files: string[]): { filtered: string[]; excluded: string[] } {
	const filtered: string[] = [];
	const excluded: string[] = [];
	for (const file of files) {
		if (isExcludedFile(file)) {
			excluded.push(file);
		} else {
			filtered.push(file);
		}
	}
	return { filtered, excluded };
}

const gitOverviewSchema = Type.Object({
	staged: Type.Optional(Type.Boolean({ description: "use staged changes (default true)" })),
	include_untracked: Type.Optional(Type.Boolean({ description: "include untracked when unstaged" })),
});

export function createGitOverviewTool(cwd: string, state: CommitAgentState): ToolDefinition<typeof gitOverviewSchema> {
	return defineTool({
		name: "git_overview",
		label: "Git Overview",
		description: "Return staged files, diff stat summary, and numstat entries.",
		parameters: gitOverviewSchema,
		async execute(_toolCallId, params) {
			const staged = params.staged ?? true;
			const allFiles = await git.diff.changedFiles(cwd, { cached: staged });
			const { filtered: files, excluded } = filterExcludedFiles(allFiles);
			const stat = await git.diff(cwd, { stat: true, cached: staged });
			const allNumstat = await git.diff.numstat(cwd, { cached: staged });
			const numstat = allNumstat.filter((entry) => !isExcludedFile(entry.path));
			const scopeResult = extractScopeCandidates(numstat);
			const untrackedFiles = !staged && params.include_untracked ? await git.ls.untracked(cwd) : undefined;
			const snapshot: GitOverviewSnapshot = {
				files,
				stat,
				numstat,
				scopeCandidates: scopeResult.scopeCandidates,
				isWideScope: scopeResult.isWide,
				untrackedFiles,
				excludedFiles: excluded.length > 0 ? excluded : undefined,
			};
			state.overview = snapshot;
			return {
				content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }],
				details: snapshot,
			};
		},
	});
}
