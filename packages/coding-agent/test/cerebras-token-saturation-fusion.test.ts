import { describe, expect, it } from "vitest";
import { CodemarieBridge } from "../src/core/codemarie-bridge.ts";

describe("Cerebras Optimization & Token Saturation Flow Fusion", () => {
	it("exposes ApcStableEngine and prepareCerebrasMessages on CodemarieBridge", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const apcEngine = bridge.getApcStableEngine();
		expect(apcEngine).toBeDefined();

		const normSystem = apcEngine.normalizeSystemPrompt("  System Prompt\r\nLine 2  ");
		expect(normSystem).toBe("System Prompt\nLine 2");

		const cleanText = apcEngine.cleanText("\x1b[32mOK\x1b[0m\r\n/Users/test/file.ts");
		expect(cleanText).not.toContain("\x1b[32m");
		expect(cleanText).toContain("OK");

		const messages = bridge.prepareCerebrasMessages([
			{
				role: "assistant",
				content: "<think>deep reasoning</think>Here is the response.",
			},
		] as never);

		expect(messages).toHaveLength(1);
		expect(messages[0].content).toBe("Here is the response.");
	});

	it("instantiates CerebrasHandler via CodemarieBridge", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const handler = bridge.createCerebrasHandler({ cerebrasApiKey: "csk-test-key" });
		expect(handler).toBeDefined();

		const model = handler.getModel();
		expect(model.id).toBeDefined();
		expect(model.info).toBeDefined();
	});

	it("executes the full Cerebras token saturation flow", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const systemPrompt = "System Prompt\r\nMode: ACT";
		const rawMessages = [
			{
				role: "user",
				content: [
					{ type: "text", text: "Turn 1 request" },
					{ type: "image", data: "base64data", mimeType: "image/png" },
				],
			},
			{
				role: "assistant",
				content: "<think>thinking process</think>Turn 1 response with details",
			},
			{
				role: "user",
				content: "Turn 2 request with more code context",
			},
		];

		const result = bridge.processCerebrasTokenSaturationFlow(systemPrompt, rawMessages, {
			maxAllowedTokens: 50_000,
			activeVisionWindow: 1,
		});

		expect(result.normalizedSystemPrompt).toBe("System Prompt\nMode: ACT");
		expect(result.apcStableMessages.length).toBeGreaterThan(0);
		expect(result.estimatedTokenCount).toBeGreaterThan(0);

		const telemetry = bridge.getCerebrasCacheTelemetryReport();
		expect(telemetry.totalRequests).toBeDefined();
		expect(telemetry.averageCacheHitRatio).toBeDefined();
	});
});
