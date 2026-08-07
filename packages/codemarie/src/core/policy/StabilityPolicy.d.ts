export interface LayerConfig {
    optimalLogicDensity: number;
    maxIOEntropy: number;
    maxComplexity: number;
}
export interface StabilityConfig {
    layers: Record<string, LayerConfig>;
    global: {
        maxPathDepth: number;
        enforceKebabCase: boolean;
        activityThreshold: number;
        integrityAlertThreshold: number;
        supportedLayerTags?: string[];
        excludePaths?: string[];
        auditAggressiveness?: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
        architectureMode?: "auto" | "joy-zoning" | "workspace-native";
        joyZoningSteering?: {
            maxFunctionLines?: number;
            minBoundaryLines?: number;
            minBoundaryDecisions?: number;
            maxClassMethods?: number;
        };
    };
}
/**
 * StabilityPolicy: The architectural constitution.
 * Loads and provides structural thresholds from stability.config.json.
 */
export declare class StabilityPolicy {
    private static instance;
    private config;
    private constructor();
    static getInstance(cwd: string): StabilityPolicy;
    getLayerConfig(layer: string): LayerConfig;
    getGlobalConfig(): {
        maxPathDepth: number;
        enforceKebabCase: boolean;
        activityThreshold: number;
        integrityAlertThreshold: number;
        supportedLayerTags?: string[] | undefined;
        excludePaths?: string[] | undefined;
        auditAggressiveness?: "AGGRESSIVE" | "BALANCED" | "CONSERVATIVE" | undefined;
        architectureMode?: "auto" | "joy-zoning" | "workspace-native" | undefined;
        joyZoningSteering?: {
            maxFunctionLines?: number | undefined;
            minBoundaryLines?: number | undefined;
            minBoundaryDecisions?: number | undefined;
            maxClassMethods?: number | undefined;
        } | undefined;
    };
    private getDefaults;
}
//# sourceMappingURL=StabilityPolicy.d.ts.map