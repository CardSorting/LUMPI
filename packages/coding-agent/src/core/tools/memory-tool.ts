import { type Static, Type } from "typebox";
import type { ToolDefinition } from "../extensions/types.ts";
import { MnemopiBroccoliStore } from "../memory/mnemopi-broccolidb.ts";
import { wrapToolDefinition } from "./tool-definition-wrapper.ts";

const memorySchema = Type.Object({
	action: Type.Union([Type.Literal("retain"), Type.Literal("recall"), Type.Literal("reflect")], {
		description: "Memory action ('retain', 'recall', or 'reflect')",
	}),
	text: Type.String({ description: "Fact to retain or query term to recall/reflect" }),
	category: Type.Optional(Type.String({ description: "Category tag for memory retention (default: 'general')" })),
});

export type MemoryToolInput = Static<typeof memorySchema>;

export interface MemoryToolResult {
	action: string;
	output: string;
}

export function createMemoryToolDefinition(): ToolDefinition<MemoryToolInput, MemoryToolResult> {
	const store = new MnemopiBroccoliStore();

	return wrapToolDefinition({
		name: "memory",
		label: "BroccoliDB Cognitive Memory",
		description:
			"Persist durable codebase facts (retain), query stored memories (recall), or synthesize graph reflections (reflect) in BroccoliDB.",
		parameters: memorySchema,
		async execute(_toolCallId, params) {
			const { action, text, category } = params as MemoryToolInput;
			if (action === "retain") {
				const mem = await store.retain(text, category || "general");
				const output = `Memory retained [ID: ${mem.id}] under category '${mem.category}'`;
				const res: MemoryToolResult = { action, output };
				return {
					content: [{ type: "text", text: output }],
					details: res,
				};
			}
			if (action === "recall") {
				const memories = await store.recall(text, category);
				const output = JSON.stringify(memories, null, 2);
				const res: MemoryToolResult = { action, output };
				return {
					content: [{ type: "text", text: output }],
					details: res,
				};
			}
			const reflection = await store.reflect(text);
			const res: MemoryToolResult = { action, output: reflection };
			return {
				content: [{ type: "text", text: reflection }],
				details: res,
			};
		},
	});
}
