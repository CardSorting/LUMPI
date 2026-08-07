import type { AuthStorage } from "../../../core/auth-storage.ts";
import type { ToolDefinition } from "../../../core/extensions/types.ts";
import type { ModelRegistry } from "../../../core/model-registry.ts";
import type { Settings } from "../../../core/settings-manager.ts";
import type { CommitAgentState } from "../state.ts";
import { createAnalyzeFileTool } from "./analyze-file.ts";
import { createGitFileDiffTool } from "./git-file-diff.ts";
import { createGitHunkTool } from "./git-hunk.ts";
import { createGitOverviewTool } from "./git-overview.ts";
import { createProposeChangelogTool } from "./propose-changelog.ts";
import { createProposeCommitTool } from "./propose-commit.ts";
import { createRecentCommitsTool } from "./recent-commits.ts";
import { createSplitCommitTool } from "./split-commit.ts";

export interface CommitToolOptions {
	cwd: string;
	authStorage: AuthStorage;
	modelRegistry: ModelRegistry;
	settings: Settings;
	spawns: string;
	state: CommitAgentState;
	changelogTargets: string[];
	enableAnalyzeFiles?: boolean;
}

export function createCommitTools(options: CommitToolOptions): ToolDefinition[] {
	const tools: ToolDefinition[] = [
		createGitOverviewTool(options.cwd, options.state),
		createGitFileDiffTool(options.cwd, options.state),
		createGitHunkTool(options.cwd),
		createRecentCommitsTool(options.cwd),
	];

	if (options.enableAnalyzeFiles ?? true) {
		tools.push(
			createAnalyzeFileTool({
				cwd: options.cwd,
				authStorage: options.authStorage,
				modelRegistry: options.modelRegistry,
				settings: options.settings,
				spawns: options.spawns,
				state: options.state,
			}),
		);
	}

	tools.push(
		createProposeChangelogTool(options.state, options.changelogTargets),
		createProposeCommitTool(options.cwd, options.state),
		createSplitCommitTool(options.cwd, options.state, options.changelogTargets),
	);

	return tools;
}
