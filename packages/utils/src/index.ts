export { once, untilAborted } from "./abortable.ts";
export * from "./async.ts";
export * from "./binary.ts";
export * from "./color.ts";
export * from "./dirs.ts";
export * from "./env.ts";
export * from "./fetch-retry.ts";
export * from "./file-lock.ts";
export * from "./format.ts";
export * from "./frontmatter.ts";
export * from "./fs-error.ts";
export * from "./glob.ts";
export * from "./json.ts";
export * from "./json-parse.ts";
export * as logger from "./logger.ts";
export * from "./loop-phase.ts";
export * from "./mermaid-ascii.ts";
export * from "./mime.ts";
export * from "./path.ts";
export * from "./path-tree.ts";
export * from "./peek-file.ts";
export * as postmortem from "./postmortem.ts";
export * from "./process-name.ts";
export * as procmgr from "./procmgr.ts";
export * as prompt from "./prompt.ts";
export * as ptree from "./ptree.ts";
export { AbortError, ChildProcess, Exception, NonZeroExitError } from "./ptree.ts";
export * from "./runtime-install.ts";
export * from "./sanitize-text.ts";
export * from "./snowflake.ts";
export * from "./stderr-guard.ts";
export * from "./stream.ts";
export * from "./tab-spacing.ts";
export * from "./temp.ts";
export * from "./tls-fetch.ts";
export * from "./type-guards.ts";
export * from "./version.ts";
export * from "./which.ts";
export * from "./worker-host.ts";

function isPlainObject(val: object): val is Record<string, unknown> {
	return Object.getPrototypeOf(val) === Object.prototype || Array.isArray(val);
}

export function structuredCloneJSON<T>(value: T): T {
	// primitives|null|undefined, copy
	if (!value || typeof value !== "object") {
		return value;
	}

	// deep clone
	if (isPlainObject(value)) {
		try {
			return structuredClone(value);
		} catch {
			// might still fail due to nested structures
		}
	}
	return JSON.parse(JSON.stringify(value)) as T;
}
