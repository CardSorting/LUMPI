import { describe, expect, it } from "vitest";
import { CodemarieBridge } from "../src/core/codemarie-bridge.ts";

describe("JoyZoning Strategy & Architectural Governance Fusion", () => {
	it("exposes layer detection and tag validation methods on CodemarieBridge", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });

		// Test layer determination
		const domainLayer = bridge.getLayer("src/domain/user.ts");
		expect(domainLayer).toBe("domain");

		const infraLayer = bridge.getLayer("src/infrastructure/db.ts");
		expect(infraLayer).toBe("infrastructure");

		// Test layer comment generation
		const comment = bridge.generateLayerComment("src/domain/user.ts", "domain");
		expect(comment).toContain("[LAYER: DOMAIN]");

		// Test layer tag support check
		const isSupported = bridge.isLayerTagSupported("src/domain/user.ts");
		expect(isSupported).toBe(true);

		const isJsonSupported = bridge.isLayerTagSupported("package.json");
		expect(isJsonSupported).toBe(false);
	});

	it("parses layer tags and suggests appropriate layers for content", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });

		const taggedCode = `/**\n * [LAYER: CORE]\n */\nexport class CoreManager {}`;
		const parsedTag = bridge.parseLayerTag(taggedCode);
		expect(parsedTag).toBe("core");

		const reactCode = `import React from 'react'; export function Component() { return <div />; }`;
		const suggestion = bridge.suggestLayerForContent(reactCode);
		expect(suggestion).not.toBeNull();
		expect(suggestion?.layer).toBe("ui");
	});

	it("detects workspace architecture profiles and stability policies", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });

		const profile = bridge.detectWorkspaceArchitectureProfile(process.cwd());
		expect(profile).toBeDefined();
		expect(profile.mode).toBeDefined();
		expect(profile.joyZoningSteering).toBeDefined();

		const policy = bridge.getStabilityPolicy(process.cwd());
		expect(policy).toBeDefined();
	});

	it("validates JoyZoning rules, smells, layering, and import depth", () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });

		const validDomainCode = `/**\n * [LAYER: DOMAIN]\n */\nexport class UserEntity {\n  constructor(public id: string) {}\n}`;
		const validationResult = bridge.validateJoyZoning("src/domain/user.ts", validDomainCode);
		expect(validationResult).toBeDefined();
		expect(Array.isArray(validationResult.errors)).toBe(true);

		const deepImportCode = `import { foo } from "../../../../../utils/foo.js";`;
		const depthErrors = bridge.validateImportDepth("src/domain/user.ts", deepImportCode);
		expect(depthErrors.length).toBeGreaterThan(0);
		expect(depthErrors[0]).toContain("Excessive relative navigation");
	});

	it("includes JoyZoning posture and full contract in steering prompt directives", async () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const directives = await bridge.getSteeringPromptDirectives();

		expect(directives).toContain("<codemarie_steering>");
		expect(directives).toContain("JoyZoning Posture:");
		expect(directives).toContain("JoyZoning Steering:");
		expect(directives).toContain("[JOY_ZONING_CONTRACT]");
		expect(directives).toContain("OPERATING_MODEL");
		expect(directives).toContain("</codemarie_steering>");
	});

	it("ensures layer headers in files and computes workspace health summaries", async () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });

		// Test header injection
		const rawCode = `export class OrderService {}`;
		const { updated, content } = bridge.ensureLayerHeader("src/core/OrderService.ts", rawCode);
		expect(updated).toBe(true);
		expect(content).toContain("[LAYER: CORE]");

		// Test health summary audit
		const summary = await bridge.getJoyZoningHealthSummary(process.cwd());
		expect(summary).toBeDefined();
		expect(typeof summary.fileCount).toBe("number");
		expect(summary.layerDistribution).toBeDefined();
		expect(typeof summary.tagCoveragePercentage).toBe("number");
		expect(typeof summary.violationsCount).toBe("number");
	});
});
