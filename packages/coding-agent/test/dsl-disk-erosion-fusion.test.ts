import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { CodemarieBridge } from "../src/core/codemarie-bridge.ts";

describe("Custom DSL Strategy & Preventative Disk Erosion Fusion", () => {
	it("exposes DSL compression and token buffer methods on CodemarieBridge", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const tokenEngine = bridge.getTokenBufferEngine();
		expect(tokenEngine).toBeDefined();

		// Test 10-stage DSL text compression
		const sampleRaw = `
\x1b[31m[HEADER]\x1b[0m
====================
Visual Context Anchor: test
Historical Tool Output Truncated for Token Efficiency
Execution Status: Success
--- a/src/index.ts
+++ b/src/index.ts
@@ -10,5 +20,5 @@
  at Module._compile (node:internal/modules/cjs/loader:1159:14)
  at Module._compile (node:internal/modules/cjs/loader:1159:14)
  at Module._compile (node:internal/modules/cjs/loader:1159:14)
`;
		const compressed = bridge.compressDslText(sampleRaw);
		expect(compressed).not.toContain("\x1b[31m");
		expect(compressed).toContain("[====]");
		expect(compressed).toContain("VisAnchor");
		expect(compressed).toContain("HistOutputTruncated");
		expect(compressed).toContain("ExecStatus:OK");
		expect(compressed).toContain("[@diff src/index.ts L10-20]");
		expect(compressed).toContain("collapsed");
	});

	it("sanitizes assistant reasoning tags and normalizes system prompts", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const rawReasoning = "<think>internal thoughts here</think>Final Output";
		const sanitized = bridge.sanitizeAssistantContent(rawReasoning);
		expect(sanitized).toBe("Final Output");

		const rawSystem = "  System Prompt\r\nLine 2\r\n  ";
		const normalized = bridge.normalizeSystemPrompt(rawSystem);
		expect(normalized).toBe("System Prompt\nLine 2");
	});

	it("exposes preventative disk erosion methods on CodemarieBridge", async () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const storageManager = bridge.getStorageManager();
		expect(storageManager).toBeDefined();

		const sqliteEngine = bridge.getSQLiteMaintenanceEngine();
		expect(sqliteEngine).toBeDefined();

		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-disk-erosion-test-"));
		try {
			// Write atomic file
			const targetFile = path.join(tempDir, "data.json");
			await bridge.atomicWriteFile(targetFile, JSON.stringify({ ok: true }), true);
			const exists = await fs.stat(targetFile).catch(() => null);
			expect(exists).not.toBeNull();

			// Calculate checksum
			const checksum = await bridge.calculateFileChecksum(targetFile);
			expect(typeof checksum).toBe("string");
			expect(checksum.length).toBe(64);

			// Create a stale temp file and sweep it
			const staleTmp = path.join(tempDir, "old-write.123.tmp");
			await fs.writeFile(staleTmp, "stale content");
			// Force mtime into the past
			const oldTime = new Date(Date.now() - 30 * 60 * 1000);
			await fs.utimes(staleTmp, oldTime, oldTime);

			const freedBytes = await bridge.cleanStaleTempFiles(tempDir, 5 * 60 * 1000);
			expect(freedBytes).toBeGreaterThan(0);
			const tmpExists = await fs.stat(staleTmp).catch(() => null);
			expect(tmpExists).toBeNull();
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});
});
