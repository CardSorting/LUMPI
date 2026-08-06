import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig, { workspaceSourcePaths } from "../../vitest.base.ts";

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			globals: true,
			environment: "node",
			testTimeout: 30000,
			// Tests run offline by default; opt in with allowNetwork() from test/test-network-env.ts.
			env: { PI_OFFLINE: "1" },
			unstubEnvs: true,
			reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions"] : ["dot"],
			silent: "passed-only",
			server: {
				deps: {
					external: [/@silvia-odwyer\/photon-node/],
				},
			},
		},
		resolve: {
			alias: [
				{
					find: /^@earendil-works\/pi-codemarie$/,
					replacement: fileURLToPath(new URL("../codemarie/src/index.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-codemarie\/db$/,
					replacement: fileURLToPath(new URL("../codemarie/src/infrastructure/db/SQLiteMaintenanceEngine.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-codemarie\/disk$/,
					replacement: fileURLToPath(new URL("../codemarie/src/core/storage/disk.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-codemarie\/storage$/,
					replacement: fileURLToPath(new URL("../codemarie/src/services/storage/StorageManager.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-codemarie\/transform$/,
					replacement: fileURLToPath(new URL("../codemarie/src/core/api/transform/token-buffer-engine.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-client$/,
					replacement: fileURLToPath(new URL("../client/src/index.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-protocol$/,
					replacement: fileURLToPath(new URL("../protocol/src/index.ts", import.meta.url)),
				},
				{ find: /^@mariozechner\/pi-ai$/, replacement: workspaceSourcePaths.aiIndex },
				{ find: /^@mariozechner\/pi-ai\/oauth$/, replacement: workspaceSourcePaths.aiOAuth },
				{ find: /^@mariozechner\/pi-agent-core$/, replacement: workspaceSourcePaths.agentIndex },
				{ find: /^@mariozechner\/pi-tui$/, replacement: workspaceSourcePaths.tuiIndex },
				{
					find: /^vscode$/,
					replacement: fileURLToPath(new URL("../codemarie/src/test/vscode-mock.ts", import.meta.url)),
				},
				{
					find: /^@shared\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/shared/$1", import.meta.url)),
				},
				{
					find: /^@core\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/core/$1", import.meta.url)),
				},
				{
					find: /^@utils\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/utils/$1", import.meta.url)),
				},
				{
					find: /^@hosts\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/hosts/$1", import.meta.url)),
				},
				{
					find: /^@api\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/core/api/$1", import.meta.url)),
				},
				{
					find: /^@services\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/services/$1", import.meta.url)),
				},
				{
					find: /^@integrations\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/integrations/$1", import.meta.url)),
				},
				{
					find: /^@generated\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/generated/$1", import.meta.url)),
				},
				{
					find: /^@packages\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/packages/$1", import.meta.url)),
				},
				{
					find: /^@\/(.+)$/,
					replacement: fileURLToPath(new URL("../codemarie/src/$1", import.meta.url)),
				},
			],
		},
	}),
);



