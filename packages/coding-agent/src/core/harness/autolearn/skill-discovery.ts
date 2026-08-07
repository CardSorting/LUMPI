import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Skill } from "../../skills.ts";
import { createSyntheticSourceInfo } from "../../source-info.ts";
import type { DiscoveredSkill, SkillValidationResult } from "./types.ts";

export class SkillDiscovery {
	async discoverWorkspaceSkills(workspaceRoot: string): Promise<DiscoveredSkill[]> {
		const skillDirs = [
			{ path: path.join(workspaceRoot, ".pi", "skills"), scope: "project" as const },
			{ path: path.join(workspaceRoot, ".agents", "skills"), scope: "project" as const },
			{ path: path.join(workspaceRoot, "skills"), scope: "user" as const },
		];

		const rawDiscovered: DiscoveredSkill[] = [];

		for (const { path: dir, scope } of skillDirs) {
			try {
				const entries = await fs.readdir(dir, { withFileTypes: true });
				for (const entry of entries) {
					if (!entry.isDirectory()) continue;
					const skillFile = path.join(dir, entry.name, "SKILL.md");
					try {
						const content = await fs.readFile(skillFile, "utf-8");
						const nameMatch = /^name:\s*(.+)$/m.exec(content);
						const descMatch = /^description:\s*(.+)$/m.exec(content);
						rawDiscovered.push({
							name: nameMatch ? nameMatch[1].trim() : entry.name,
							description: descMatch ? descMatch[1].trim() : "",
							path: skillFile,
							content,
							scope,
						});
					} catch {
						// SKILL.md missing or unreadable
					}
				}
			} catch {
				// directory does not exist
			}
		}

		return this.resolveSkillCollisions(rawDiscovered);
	}

	resolveSkillCollisions(skills: DiscoveredSkill[]): DiscoveredSkill[] {
		const map = new Map<string, DiscoveredSkill>();

		for (const skill of skills) {
			const key = skill.name.toLowerCase();
			const existing = map.get(key);

			if (!existing) {
				map.set(key, skill);
			} else if (skill.scope === "project" && existing.scope !== "project") {
				map.set(key, skill);
			}
		}

		return Array.from(map.values());
	}

	matchSkillsForPrompt(prompt: string, skills: DiscoveredSkill[]): DiscoveredSkill[] {
		const lowerPrompt = prompt.toLowerCase();
		return skills.filter((skill) => {
			if (skill.name && lowerPrompt.includes(skill.name.toLowerCase())) return true;
			if (skill.description && lowerPrompt.includes(skill.description.toLowerCase())) return true;
			return false;
		});
	}

	buildSkillsPromptSection(matchedSkills: DiscoveredSkill[]): string {
		if (matchedSkills.length === 0) return "";
		const blocks = matchedSkills.map((s) => `### Skill: ${s.name}\n${s.content}`);
		return [`[DISCOVERED WORKSPACE SKILLS]`, ...blocks].join("\n\n");
	}

	validateSkillStructure(skillName: string, description: string): SkillValidationResult {
		const errors: string[] = [];
		if (!skillName || skillName.length > 64) {
			errors.push("Skill name must be between 1 and 64 characters.");
		}
		if (!/^[a-z0-9-]+$/.test(skillName)) {
			errors.push("Skill name must contain only lowercase alphanumeric characters and hyphens.");
		}
		if (!description || description.length > 1024) {
			errors.push("Skill description must be between 1 and 1024 characters.");
		}
		return {
			valid: errors.length === 0,
			errors,
		};
	}

	async resolveSkillReferencePaths(skillFilePath: string): Promise<string[]> {
		const baseDir = path.dirname(skillFilePath);
		const refDirs = ["scripts", "examples", "resources", "references"];
		const foundPaths: string[] = [];

		for (const sub of refDirs) {
			const target = path.join(baseDir, sub);
			try {
				const entries = await fs.readdir(target);
				for (const e of entries) {
					foundPaths.push(path.join(target, e));
				}
			} catch {
				// sub-directory omitted
			}
		}
		return foundPaths;
	}

	exportSkillSchema(skill: DiscoveredSkill): Record<string, unknown> {
		return {
			name: skill.name,
			description: skill.description,
			path: skill.path,
			scope: skill.scope || "project",
			contentLength: skill.content.length,
		};
	}

	toSkill(discovered: DiscoveredSkill): Skill {
		return {
			name: discovered.name,
			description: discovered.description,
			filePath: discovered.path,
			baseDir: path.dirname(discovered.path),
			sourceInfo: createSyntheticSourceInfo(discovered.path, {
				source: "autolearn",
				scope: discovered.scope === "user" ? "user" : "project",
				origin: "top-level",
				baseDir: path.dirname(discovered.path),
			}),
			disableModelInvocation: false,
		};
	}

	convertToSkills(discoveredList: DiscoveredSkill[]): Skill[] {
		return discoveredList.map((d) => this.toSkill(d));
	}

	mergeWithLoadedSkills(loadedSkills: Skill[], discoveredList: DiscoveredSkill[]): Skill[] {
		const autoSkills = this.convertToSkills(discoveredList);
		const existingNames = new Set(loadedSkills.map((s) => s.name.toLowerCase()));
		const newSkills = autoSkills.filter((s) => !existingNames.has(s.name.toLowerCase()));
		return [...loadedSkills, ...newSkills];
	}
}
