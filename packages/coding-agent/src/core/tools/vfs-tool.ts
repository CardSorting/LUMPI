import { type Static, Type } from "typebox";
import type { ToolDefinition } from "../extensions/types.ts";
import { VFSRouter } from "../vfs-router.ts";
import { wrapToolDefinition } from "./tool-definition-wrapper.ts";

const vfsSchema = Type.Object({
	uri: Type.String({
		description: "Virtual URI scheme path (e.g. pr://1428, conflict://1, agent://worker/findings, xd://devices)",
	}),
	operation: Type.Union([Type.Literal("read"), Type.Literal("write")], {
		description: "VFS operation mode ('read' or 'write')",
	}),
	content: Type.Optional(Type.String({ description: "Content to write when operation is 'write'" })),
});

export type VFSToolInput = Static<typeof vfsSchema>;

export interface VFSToolResult {
	uri: string;
	success: boolean;
	content?: string;
}

export function createVFSToolDefinition(): ToolDefinition<VFSToolInput, VFSToolResult> {
	const router = new VFSRouter();

	return wrapToolDefinition({
		name: "vfs",
		label: "VFS Protocol Engine",
		description:
			"Access and manipulate virtual protocol resources (PRs, issues, merge conflicts, subagent state trees, and virtual devices).",
		parameters: vfsSchema,
		async execute(_toolCallId, params) {
			const { uri, operation, content } = params as VFSToolInput;
			if (operation === "read") {
				const readContent = await router.read(uri);
				const res: VFSToolResult = { uri, success: true, content: readContent };
				return {
					content: [{ type: "text", text: readContent }],
					details: res,
				};
			}
			const written = await router.write(uri, content || "");
			const res: VFSToolResult = { uri, success: written };
			return {
				content: [{ type: "text", text: `VFS Write to ${uri}: ${written ? "Success" : "Failed"}` }],
				details: res,
			};
		},
	});
}
