import type { SkillMetadata } from "@shared/skills";
export declare const BUNDLED_SKILL_NAME = "auto-rolling-roadmap";
export declare const BUNDLED_SKILL_DESCRIPTION = "Maintain ROADMAP.md as the project's living product, architecture, and long-horizon development checkpoint. Use when steering project direction, updating roadmap checkpoints, or resolving code soup drift.";
/** Relative path shown in operator payloads (bundled with the extension, not copied per workspace). */
export declare const BUNDLED_SKILL_REL = "SKILL.md";
/** @deprecated Bundled skill is no longer copied into workspaces. Use BUNDLED_SKILL_REL. */
export declare const WORKSPACE_SKILL_REL = "SKILL.md";
/** Called once from extension activate — stable bundled skill resolution in production. */
export declare function setRoadmapExtensionRoot(root: string): void;
export declare function bundledSkillPath(skillName?: string): Promise<string>;
export declare function isBundledSkillAvailable(): Promise<boolean>;
/** @deprecated Use isBundledSkillAvailable — skill is bundled, not workspace-installed. */
export declare function isWorkspaceSkillInstalled(_workspace?: string): Promise<boolean>;
export declare function getBundledSkillMetadata(skillName?: string, defaultDescription?: string, defaultEnabled?: boolean): Promise<SkillMetadata | null>;
export declare function getBundledRoadmapSkillMetadata(): Promise<SkillMetadata | null>;
export declare function ensurePrimarySkill(_workspace: string): Promise<{
    available: boolean;
}>;
//# sourceMappingURL=RoadmapSkillInstall.d.ts.map