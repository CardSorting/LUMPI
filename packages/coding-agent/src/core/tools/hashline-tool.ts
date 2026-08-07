import { type Static, Type } from "typebox";
import type { ToolDefinition } from "../extensions/types.ts";
import { HashlinePatcher, type PatchApplyResult } from "./hashline.ts";
import { wrapToolDefinition } from "./tool-definition-wrapper.ts";

const hashlineSchema = Type.Object({
	path: Type.String({ description: "Path to the file to edit using Hashline anchor format" }),
	patch: Type.String({
		description: "Hashline patch text containing [PATH#TAG] header and PUT/CUT/MV/REM operations",
	}),
});

export type HashlineToolInput = Static<typeof hashlineSchema>;

export interface HashlineToolDetails {
	appliedOps: number;
	diverged: boolean;
}

export function createHashlineToolDefinition(cwd: string): ToolDefinition<HashlineToolInput, PatchApplyResult> {
	const patcher = new HashlinePatcher();

	return wrapToolDefinition({
		name: "hashline_edit",
		label: "Hashline Edit",
		description:
			"Apply precision line edits anchored by file content hash tags [PATH#TAG] to eliminate search/replace mismatch loops.",
		parameters: hashlineSchema,
		async execute(_toolCallId, params) {
			const { path: filePath, patch } = params as HashlineToolInput;
			const result = await patcher.applyFilePatch(filePath, patch);
			return {
				content: [{ type: "text", text: `Applied Hashline patch (${result.appliedOps} ops) to ${filePath}` }],
				details: result,
			};
		},
	});
}
