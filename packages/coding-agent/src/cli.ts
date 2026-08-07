#!/usr/bin/env node
/**
 * CLI entry point for the refactored coding agent.
 * Uses main.ts with AgentSession and new mode modules.
 *
 * Test with: npx tsx src/cli-new.ts [args...]
 */
import { declareWorkerHostEntry, isWorkerHostSelector } from "@oh-my-pi/pi-utils/worker-host";
import { APP_NAME } from "./config.ts";
import { configureHttpDispatcher } from "./core/http-dispatcher.ts";
import { main } from "./main.ts";

process.title = APP_NAME;
process.env.PI_CODING_AGENT = "true";
process.env.AI_AGENT = "pi";
process.emitWarning = (() => {}) as typeof process.emitWarning;

const isProcessEntry = import.meta.main || process.env.PI_COMPILED === "true" || process.env.NODE_ENV !== "test";
if (isProcessEntry) {
	declareWorkerHostEntry();
}

const args = process.argv.slice(2);

if (args[0] === "--smoke-test") {
	process.stdout.write("pi native worker smoke test passed\n");
	process.exit(0);
}

if (isWorkerHostSelector(args[0])) {
	process.stdout.write(`Worker selector ${args[0]} handled\n`);
	process.exit(0);
}

// Configure undici's global dispatcher before provider SDKs issue requests.
configureHttpDispatcher();

main(args);
