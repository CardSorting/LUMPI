import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface HashlineSection {
	file: string;
	tag: string;
	ops: HashlineOp[];
}

export type HashlineOpKind = "put" | "cut" | "mv" | "rem" | "insert_before" | "insert_after";

export interface HashlineOp {
	kind: HashlineOpKind;
	startLine?: number;
	endLine?: number;
	lines?: string[];
	target?: string;
}

export interface PatchApplyResult {
	file: string;
	appliedOps: number;
	diverged: boolean;
	content: string;
}

export class HashlineSnapshotStore {
	private snapshots: Map<string, string>;

	constructor() {
		this.snapshots = new Map<string, string>();
	}

	public computeTag(content: string): string {
		const normalized = content.replace(/\r\n/g, "\n");
		let hash = 5381;
		for (let i = 0; i < normalized.length; i++) {
			hash = (hash * 33) ^ normalized.charCodeAt(i);
			hash |= 0;
		}
		const positive = (hash >>> 0).toString(16).padStart(8, "0");
		return positive.slice(0, 4).toLowerCase();
	}

	public record(filePath: string, content: string): string {
		const tag = this.computeTag(content);
		this.snapshots.set(`${filePath}#${tag}`, content);
		return tag;
	}

	public getSnapshot(filePath: string, tag: string): string | undefined {
		return this.snapshots.get(`${filePath}#${tag}`);
	}
}

export class HashlinePatcher {
	private snapshotStore: HashlineSnapshotStore;

	constructor(snapshotStore?: HashlineSnapshotStore) {
		this.snapshotStore = snapshotStore || new HashlineSnapshotStore();
	}

	public getStore(): HashlineSnapshotStore {
		return this.snapshotStore;
	}

	public parsePatch(patchText: string): HashlineSection[] {
		const sections: HashlineSection[] = [];
		const rawLines = patchText.split(/\r?\n/);
		let currentSection: HashlineSection | null = null;
		let currentOp: HashlineOp | null = null;

		for (const line of rawLines) {
			const headerMatch = /^\[([^#]+)#([0-9a-fA-F]{4})\]$/.exec(line.trim());
			if (headerMatch) {
				if (currentSection) {
					if (currentOp) currentSection.ops.push(currentOp);
					sections.push(currentSection);
				}
				currentSection = {
					file: headerMatch[1],
					tag: headerMatch[2].toLowerCase(),
					ops: [],
				};
				currentOp = null;
				continue;
			}

			if (!currentSection) continue;

			const putRangeMatch = /^PUT\s+(\d+)\.=(\d+):$/.exec(line.trim());
			if (putRangeMatch) {
				if (currentOp) currentSection.ops.push(currentOp);
				currentOp = {
					kind: "put",
					startLine: parseInt(putRangeMatch[1], 10),
					endLine: parseInt(putRangeMatch[2], 10),
					lines: [],
				};
				continue;
			}

			const insertBeforeMatch = /^PUT\s+<(\d+):$/.exec(line.trim());
			if (insertBeforeMatch) {
				if (currentOp) currentSection.ops.push(currentOp);
				currentOp = {
					kind: "insert_before",
					startLine: parseInt(insertBeforeMatch[1], 10),
					lines: [],
				};
				continue;
			}

			const insertAfterMatch = /^PUT\s+>(\d+):$/.exec(line.trim());
			if (insertAfterMatch) {
				if (currentOp) currentSection.ops.push(currentOp);
				currentOp = {
					kind: "insert_after",
					startLine: parseInt(insertAfterMatch[1], 10),
					lines: [],
				};
				continue;
			}

			const cutMatch = /^CUT\s+(\d+)\.=(\d+)$/.exec(line.trim());
			if (cutMatch) {
				if (currentOp) currentSection.ops.push(currentOp);
				currentSection.ops.push({
					kind: "cut",
					startLine: parseInt(cutMatch[1], 10),
					endLine: parseInt(cutMatch[2], 10),
				});
				currentOp = null;
				continue;
			}

			const mvMatch = /^MV\s+(.+)$/.exec(line.trim());
			if (mvMatch) {
				if (currentOp) currentSection.ops.push(currentOp);
				currentSection.ops.push({
					kind: "mv",
					target: mvMatch[1].trim(),
				});
				currentOp = null;
				continue;
			}

			if (line.trim() === "REM") {
				if (currentOp) currentSection.ops.push(currentOp);
				currentSection.ops.push({ kind: "rem" });
				currentOp = null;
				continue;
			}

			if (line.startsWith("+") && currentOp && currentOp.lines) {
				currentOp.lines.push(line.slice(1));
			}
		}

		if (currentSection) {
			if (currentOp) currentSection.ops.push(currentOp);
			sections.push(currentSection);
		}

		return sections;
	}

	public applySection(section: HashlineSection, currentContent: string): PatchApplyResult {
		const hasCrLf = currentContent.includes("\r\n");
		const normalizedContent = currentContent.replace(/\r\n/g, "\n");
		const currentLines = normalizedContent.split("\n");
		const currentTag = this.snapshotStore.computeTag(normalizedContent);
		const diverged = currentTag !== section.tag;

		let targetLines = [...currentLines];
		const snapshotContent = this.snapshotStore.getSnapshot(section.file, section.tag);

		if (diverged && snapshotContent) {
			targetLines = snapshotContent.replace(/\r\n/g, "\n").split("\n");
		}

		for (const op of section.ops) {
			if (op.kind === "put" && op.startLine !== undefined && op.endLine !== undefined && op.lines) {
				const startIdx = Math.max(0, op.startLine - 1);
				const deleteCount = Math.max(0, op.endLine - op.startLine + 1);
				targetLines.splice(startIdx, deleteCount, ...op.lines);
			} else if (op.kind === "insert_before" && op.startLine !== undefined && op.lines) {
				const startIdx = Math.max(0, op.startLine - 1);
				targetLines.splice(startIdx, 0, ...op.lines);
			} else if (op.kind === "insert_after" && op.startLine !== undefined && op.lines) {
				const startIdx = Math.min(targetLines.length, op.startLine);
				targetLines.splice(startIdx, 0, ...op.lines);
			} else if (op.kind === "cut" && op.startLine !== undefined && op.endLine !== undefined) {
				const startIdx = Math.max(0, op.startLine - 1);
				const deleteCount = Math.max(0, op.endLine - op.startLine + 1);
				targetLines.splice(startIdx, deleteCount);
			} else if (op.kind === "rem") {
				targetLines = [];
			}
		}

		let resultText = targetLines.join("\n");
		if (hasCrLf) {
			resultText = resultText.replace(/\n/g, "\r\n");
		}

		return {
			file: section.file,
			appliedOps: section.ops.length,
			diverged,
			content: resultText,
		};
	}

	public async applyFilePatch(filePath: string, patchText: string): Promise<PatchApplyResult> {
		let currentContent = "";
		try {
			currentContent = await fs.readFile(filePath, "utf-8");
		} catch {
			currentContent = "";
		}

		const sections = this.parsePatch(patchText);
		const targetSection = sections.find(
			(s) => s.file === filePath || path.basename(s.file) === path.basename(filePath),
		);

		if (!targetSection) {
			throw new Error(`Patch section for file '${filePath}' not found.`);
		}

		const result = this.applySection(targetSection, currentContent);
		const parentDir = path.dirname(filePath);
		await fs.mkdir(parentDir, { recursive: true });
		await fs.writeFile(filePath, result.content, "utf-8");

		this.snapshotStore.record(filePath, result.content);
		return result;
	}
}
