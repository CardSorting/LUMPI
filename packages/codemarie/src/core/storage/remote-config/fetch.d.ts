import type { IController as Controller } from "@core/controller/types";
/**
 * Main entry point for fetching remote configuration.
 * Scans all user organizations, switches to the one with remote config if found,
 * and applies the configuration.
 *
 * It catches any exceptions, logs them and does not propagate them to the caller.
 *
 * This function is called periodically to ensure users stay in
 * organizations with remote configuration enabled.
 *
 * @param controller The controller instance
 */
export declare function fetchRemoteConfig(controller: Controller): Promise<void>;
//# sourceMappingURL=fetch.d.ts.map