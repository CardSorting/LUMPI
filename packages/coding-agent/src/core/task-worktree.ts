import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface RepoBaseline {
	repoRoot: string;
	headCommit: string;
	stagedDiff: string;
	unstagedDiff: string;
	untrackedFiles: string[];
}

export interface WorktreeConfig {
	repoRoot: string;
	worktreeId: string;
	branchName?: string;
}

export interface WorktreeResult {
	worktreePath: string;
	id: string;
	baseline: RepoBaseline;
	captureDeltaPatch(): Promise<string>;
	cleanup(): Promise<void>;
}

export class TaskWorktreeManager {
	private activeWorktrees: Map<string, string>;

	constructor() {
		this.activeWorktrees = new Map<string, string>();
	}

	public async captureBaseline(repoRoot: string): Promise<RepoBaseline> {
		let headCommit = "";
		let stagedDiff = "";
		let unstagedDiff = "";
		let untrackedFiles: string[] = [];

		try {
			const headRes = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repoRoot });
			headCommit = headRes.stdout.trim();
		} catch {
			headCommit = "";
		}

		try {
			const stagedRes = await execFileAsync("git", ["diff", "--cached"], { cwd: repoRoot });
			stagedDiff = stagedRes.stdout;
		} catch {
			stagedDiff = "";
		}

		try {
			const unstagedRes = await execFileAsync("git", ["diff"], { cwd: repoRoot });
			unstagedDiff = unstagedRes.stdout;
		} catch {
			unstagedDiff = "";
		}

		try {
			const untrackedRes = await execFileAsync("git", ["ls-files", "--others", "--exclude-standard"], {
				cwd: repoRoot,
			});
			untrackedFiles = untrackedRes.stdout.split("\n").filter((f) => f.trim().length > 0);
		} catch {
			untrackedFiles = [];
		}

		return {
			repoRoot,
			headCommit,
			stagedDiff,
			unstagedDiff,
			untrackedFiles,
		};
	}

	public async createWorktree(config: WorktreeConfig): Promise<WorktreeResult> {
		const baseline = await this.captureBaseline(config.repoRoot);
		const targetDir = path.join(os.tmpdir(), `pi-worktree-${config.worktreeId}`);
		await fs.mkdir(targetDir, { recursive: true });

		let usedGitWorktree = false;
		try {
			const branch = config.branchName || `task-${config.worktreeId}`;
			await execFileAsync("git", ["worktree", "add", "-b", branch, targetDir, "HEAD"], {
				cwd: config.repoRoot,
			});
			usedGitWorktree = true;
		} catch {
			// Fallback: direct filesystem clone if git worktree fails
			await fs.cp(config.repoRoot, targetDir, {
				recursive: true,
				filter: (src) => !src.includes(".git") && !src.includes("node_modules"),
			});
		}

		this.activeWorktrees.set(config.worktreeId, targetDir);

		return {
			worktreePath: targetDir,
			id: config.worktreeId,
			baseline,
			captureDeltaPatch: async (): Promise<string> => {
				try {
					const diffRes = await execFileAsync("git", ["diff", baseline.headCommit], { cwd: targetDir });
					return diffRes.stdout;
				} catch {
					return "";
				}
			},
			cleanup: async () => {
				if (usedGitWorktree) {
					try {
						await execFileAsync("git", ["worktree", "remove", "--force", targetDir], {
							cwd: config.repoRoot,
						});
					} catch {
						await fs.rm(targetDir, { recursive: true, force: true });
					}
				} else {
					await fs.rm(targetDir, { recursive: true, force: true });
				}
				this.activeWorktrees.delete(config.worktreeId);
			},
		};
	}
}
