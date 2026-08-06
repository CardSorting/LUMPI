import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export const workspaceSourcePaths = {
	telemetryIndex: fileURLToPath(new URL("./packages/telemetry/src/index.ts", import.meta.url)),
	aiIndex: fileURLToPath(new URL("./packages/ai/src/index.ts", import.meta.url)),
	aiCompat: fileURLToPath(new URL("./packages/ai/src/compat.ts", import.meta.url)),
	aiOAuth: fileURLToPath(new URL("./packages/ai/src/oauth.ts", import.meta.url)),
	aiProviders: fileURLToPath(new URL("./packages/ai/src/providers", import.meta.url)),
	agentIndex: fileURLToPath(new URL("./packages/agent/src/index.ts", import.meta.url)),
	codingAgentIndex: fileURLToPath(new URL("./packages/coding-agent/src/index.ts", import.meta.url)),
	tuiIndex: fileURLToPath(new URL("./packages/tui/src/index.ts", import.meta.url)),
	codemarieIndex: fileURLToPath(new URL("./packages/codemarie/dist/index.js", import.meta.url)),
	codemarieJoyRide: fileURLToPath(new URL("./packages/codemarie/src/core/joyride/index.ts", import.meta.url)),
} as const;

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^@noorm\/lumpi-telemetry$/, replacement: workspaceSourcePaths.telemetryIndex },
			{ find: /^@noorm\/lumpi-ai$/, replacement: workspaceSourcePaths.aiIndex },
			{ find: /^@noorm\/lumpi-ai\/compat$/, replacement: workspaceSourcePaths.aiCompat },
			{ find: /^@noorm\/lumpi-ai\/oauth$/, replacement: workspaceSourcePaths.aiOAuth },
			{
				find: /^@noorm\/lumpi-ai\/providers\/(.+)$/,
				replacement: `${workspaceSourcePaths.aiProviders}/$1.ts`,
			},
			{ find: /^@noorm\/lumpi-agent-core$/, replacement: workspaceSourcePaths.agentIndex },
			{ find: /^@noorm\/lumpi-agent-core\/node$/, replacement: fileURLToPath(new URL("./packages/agent/src/node.ts", import.meta.url)) },
			{ find: /^@noorm\/lumpi-tui$/, replacement: workspaceSourcePaths.tuiIndex },
			{ find: /^@noorm\/lumpi-codemarie\/joyride$/, replacement: workspaceSourcePaths.codemarieJoyRide },
			{ find: /^@noorm\/lumpi-codemarie$/, replacement: workspaceSourcePaths.codemarieIndex },
			{ find: /^vscode$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/hosts/vscode/stub.ts", import.meta.url)) },
			{ find: /^@\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/$1", import.meta.url)) },
			{ find: /^@shared\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/shared/$1", import.meta.url)) },
			{ find: /^@core\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/core/$1", import.meta.url)) },
			{ find: /^@api\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/core/api/$1", import.meta.url)) },
			{ find: /^@services\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/services/$1", import.meta.url)) },
			{ find: /^@utils\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/utils/$1", import.meta.url)) },
			{ find: /^@hosts\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/hosts/$1", import.meta.url)) },
			{ find: /^@integrations\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/integrations/$1", import.meta.url)) },
			{ find: /^@packages\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/packages/$1", import.meta.url)) },
			{ find: /^@generated\/(.*)$/, replacement: fileURLToPath(new URL("./packages/codemarie/src/generated/$1", import.meta.url)) },
		],
	},
});






