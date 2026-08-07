import type { RemoteConfig } from "@shared/remote-config/schema";
import type { ConfiguredAPIKeys, GlobalStateAndSettings, RemoteConfigFields } from "@shared/storage/state-keys";
import type { McpHub } from "@/services/mcp/McpHub";
/**
 * Transforms RemoteConfig schema to RemoteConfigFields shape
 * @param remoteConfig The remote configuration object
 * @returns Partial<RemoteConfigFields> containing only the fields present in remote config
 */
export declare function transformRemoteConfigToStateShape(remoteConfig: RemoteConfig): Partial<RemoteConfigFields>;
export declare const REMOTE_CONFIG_OTEL_PROVIDER_ID = "OpenTelemetryRemoteConfiguredProvider";
export declare function clearRemoteConfig(): void;
/**
 * Applies remote config to the StateManager's remote config cache
 * @param remoteConfig The remote configuration object to apply
 * @param mcpHub McpHub instance to prevent watcher triggers during sync
 */
export declare function applyRemoteConfig(remoteConfig: RemoteConfig, configuredKeys: ConfiguredAPIKeys, mcpHub: McpHub): Promise<void>;
/**
 * Receives a config and returns the subset of fields that can be overriden in the cache.
 *
 * @deprecated Canonical, pure implementation lives in ./field-filter. This
 * wrapper preserves the legacy StateManager-fallback behaviour for existing
 * callers. Re-exported below for backward compatibility.
 */
declare function filterAllowedRemoteConfigFieldsLegacy(config: Partial<GlobalStateAndSettings>): Partial<GlobalStateAndSettings>;
export { filterAllowedRemoteConfigFieldsLegacy as filterAllowedRemoteConfigFields };
export declare const isRemoteConfigEnabled: (orgId: string) => boolean;
//# sourceMappingURL=utils.d.ts.map