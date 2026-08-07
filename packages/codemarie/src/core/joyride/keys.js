/**
 * [LAYER: CORE]
 * Stable JoyRide cache key and fingerprint helpers.
 */
import { createHash } from "node:crypto";
export function stableStringify(value) {
    const seen = new WeakSet();
    const normalize = (input) => {
        if (input === null) {
            return null;
        }
        if (input === undefined) {
            return "__undefined__";
        }
        if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
            return input;
        }
        if (typeof input === "bigint") {
            return input.toString();
        }
        if (Array.isArray(input)) {
            return input.map((item) => normalize(item));
        }
        if (typeof input === "object") {
            if (seen.has(input)) {
                return "__circular__";
            }
            seen.add(input);
            const out = {};
            for (const key of Object.keys(input).sort()) {
                out[key] = normalize(input[key]);
            }
            return out;
        }
        return String(input);
    };
    return JSON.stringify(normalize(value));
}
export function createJoyRideFingerprint(value) {
    return createHash("sha256").update(stableStringify(value), "utf8").digest("hex");
}
export function createJoyRideKey(namespace, parts) {
    const fingerprint = createJoyRideFingerprint({ namespace, parts });
    return {
        key: `joyride:${namespace}:${fingerprint}`,
        fingerprint,
        namespace,
        parts,
    };
}
export function createCommandResultCacheKey(input) {
    return createJoyRideKey("command-result", input);
}
export function createGrepResultCacheKey(input) {
    return createJoyRideKey("grep-result", input);
}
export function createFileMetadataCacheKey(input) {
    return createJoyRideKey("file-metadata", input);
}
export function createVerificationCacheKey(input) {
    return createJoyRideKey("verification", input);
}
export function createDiffCacheKey(input) {
    return createJoyRideKey("diff", input);
}
export function createScratchArtifactCacheKey(input) {
    return createJoyRideKey("scratch-artifact", input);
}
//# sourceMappingURL=keys.js.map