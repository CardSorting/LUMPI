import { describe, expect, it } from "vitest";
import {
	createHashlineToolDefinition,
	createMemoryToolDefinition,
	createVFSToolDefinition,
} from "../src/core/tools/index.ts";

function getTextOutput(result: { content: Array<{ type: string; text?: string }> }): string {
	return (
		result.content
			?.filter((c) => c.type === "text" && typeof c.text === "string")
			.map((c) => c.text)
			.join("\n") || ""
	);
}

describe("Fused Native Tools", () => {
	it("executes hashline_edit tool successfully", async () => {
		const tool = createHashlineToolDefinition(process.cwd());
		expect(tool.name).toBe("hashline_edit");

		const result = await (tool.execute as Function)("call_1", {
			path: "/tmp/sample.ts",
			patch: "[/tmp/sample.ts#0000]\nPUT 1.=1:\n+const greeting = 'hello';",
		});

		expect(result.content[0].type).toBe("text");
		expect(getTextOutput(result)).toContain("Applied Hashline patch");
		expect(result.details.appliedOps).toBe(1);
	});

	it("executes vfs tool read and write operations", async () => {
		const tool = createVFSToolDefinition();
		expect(tool.name).toBe("vfs");

		const readRes = await (tool.execute as Function)("call_2", {
			uri: "conflict://1",
			operation: "read",
		});
		expect(getTextOutput(readRes)).toContain("Conflict Marker");

		const writeRes = await (tool.execute as Function)("call_3", {
			uri: "conflict://1",
			operation: "write",
			content: "@ours",
		});
		expect(getTextOutput(writeRes)).toContain("Success");
	});

	it("executes memory tool retain and recall operations", async () => {
		const tool = createMemoryToolDefinition();
		expect(tool.name).toBe("memory");

		const retainRes = await (tool.execute as Function)("call_4", {
			action: "retain",
			text: "The project uses Bun 1.3 for fast runtime execution",
			category: "architecture",
		});
		expect(getTextOutput(retainRes)).toContain("Memory retained");

		const recallRes = await (tool.execute as Function)("call_5", {
			action: "recall",
			text: "Bun",
		});
		expect(getTextOutput(recallRes)).toContain("Bun 1.3");
	});
});
