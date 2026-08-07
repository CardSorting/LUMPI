import { parseYamlFrontmatter } from "@core/context/instructions/user-instructions/frontmatter";
import { BUNDLED_SKILL_URI_PREFIX } from "@shared/skills";
import * as fs from "fs/promises";
import * as path from "path";
import { getRoadmapConfig } from "./RoadmapConfig";
export const BUNDLED_SKILL_NAME = "auto-rolling-roadmap";
export const BUNDLED_SKILL_DESCRIPTION = "Maintain ROADMAP.md as the project's living product, architecture, and long-horizon development checkpoint. Use when steering project direction, updating roadmap checkpoints, or resolving code soup drift.";
/** Relative path shown in operator payloads (bundled with the extension, not copied per workspace). */
export const BUNDLED_SKILL_REL = "SKILL.md";
/** @deprecated Bundled skill is no longer copied into workspaces. Use BUNDLED_SKILL_REL. */
export const WORKSPACE_SKILL_REL = BUNDLED_SKILL_REL;
let extensionRoot = null;
/** Called once from extension activate — stable bundled skill resolution in production. */
export function setRoadmapExtensionRoot(root) {
    extensionRoot = path.resolve(root);
}
function bundledSkillCandidates(skillName = BUNDLED_SKILL_NAME) {
    const candidates = [];
    if (extensionRoot) {
        candidates.push(path.join(extensionRoot, "optional-skills", "dietcode", skillName, "SKILL.md"));
        candidates.push(path.join(extensionRoot, "optional-skills", skillName, "SKILL.md"));
        if (skillName === BUNDLED_SKILL_NAME)
            candidates.push(path.join(extensionRoot, "SKILL.md"));
    }
    const roots = [
        process.cwd(),
        path.resolve(process.cwd(), ".."),
        path.resolve(__dirname, "."),
        path.resolve(__dirname, ".."),
        path.resolve(__dirname, "..", ".."),
        path.resolve(__dirname, "..", "..", ".."),
        path.resolve(__dirname, "..", "..", "..", ".."),
    ];
    for (const root of roots) {
        candidates.push(path.join(root, "optional-skills", "dietcode", skillName, "SKILL.md"));
        candidates.push(path.join(root, "optional-skills", skillName, "SKILL.md"));
        if (skillName === BUNDLED_SKILL_NAME)
            candidates.push(path.join(root, "SKILL.md"));
    }
    return [...new Set(candidates)];
}
export async function bundledSkillPath(skillName = BUNDLED_SKILL_NAME) {
    for (const candidate of bundledSkillCandidates(skillName)) {
        try {
            await fs.access(candidate);
            return candidate;
        }
        catch { }
    }
    return bundledSkillCandidates(skillName)[0];
}
export async function isBundledSkillAvailable() {
    if (!getRoadmapConfig().auto_install_skills) {
        return false;
    }
    try {
        await fs.access(await bundledSkillPath());
        return true;
    }
    catch {
        return false;
    }
}
/** @deprecated Use isBundledSkillAvailable — skill is bundled, not workspace-installed. */
export async function isWorkspaceSkillInstalled(_workspace) {
    return isBundledSkillAvailable();
}
export async function getBundledSkillMetadata(skillName = BUNDLED_SKILL_NAME, defaultDescription = BUNDLED_SKILL_DESCRIPTION, defaultEnabled) {
    if (!getRoadmapConfig().auto_install_skills) {
        return null;
    }
    let skillPath;
    try {
        skillPath = await bundledSkillPath(skillName);
        await fs.access(skillPath);
    }
    catch {
        return null;
    }
    let description = defaultDescription;
    try {
        const fileContent = await fs.readFile(skillPath, "utf-8");
        const { data: frontmatter } = parseYamlFrontmatter(fileContent.slice(0, 4096));
        if (typeof frontmatter.description === "string" && frontmatter.description.trim()) {
            description = frontmatter.description.trim();
        }
    }
    catch { }
    return {
        name: skillName,
        description,
        path: `${BUNDLED_SKILL_URI_PREFIX}${skillName}`,
        source: "bundled",
        ...(defaultEnabled !== undefined ? { defaultEnabled } : {}),
    };
}
export async function getBundledRoadmapSkillMetadata() {
    return getBundledSkillMetadata(BUNDLED_SKILL_NAME, BUNDLED_SKILL_DESCRIPTION);
}
export async function ensurePrimarySkill(_workspace) {
    return { available: await isBundledSkillAvailable() };
}
//# sourceMappingURL=RoadmapSkillInstall.js.map