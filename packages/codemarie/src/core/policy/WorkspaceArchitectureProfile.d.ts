export type WorkspaceArchitectureMode = "greenfield" | "joy-zoning" | "workspace-native";
export type WorkspaceArchitecturePreference = "auto" | "joy-zoning" | "workspace-native";
export interface JoyZoningSteeringThresholds {
    maxFunctionLines: number;
    minBoundaryLines: number;
    minBoundaryDecisions: number;
    maxClassMethods: number;
}
export interface WorkspaceArchitectureProfile {
    mode: WorkspaceArchitectureMode;
    enforceCanonicalLayers: boolean;
    joyZoningSteering: "canonical" | "blended";
    steeringThresholds: JoyZoningSteeringThresholds;
    reason: string;
}
export declare const DEFAULT_JOY_ZONING_STEERING_THRESHOLDS: JoyZoningSteeringThresholds;
/**
 * Selects the architectural posture for a workspace.
 *
 * Existing projects are workspace-native unless they explicitly opt into
 * JoyZoning structural enforcement. Empty workspaces retain the canonical
 * greenfield posture. A legacy stability.config.json remains an opt-in so
 * existing JoyZoning projects keep their current behavior.
 */
export declare function detectWorkspaceArchitectureProfile(cwd?: string): WorkspaceArchitectureProfile;
//# sourceMappingURL=WorkspaceArchitectureProfile.d.ts.map