import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const rootDir = process.cwd();
const dirsToScan = [
	join(rootDir, "packages/codemarie/dist"),
	join(rootDir, "packages/codemarie/src"),
];

function walk(dir, fileList = []) {
	if (!existsSync(dir)) return fileList;
	const files = readdirSync(dir);
	for (const file of files) {
		const filePath = join(dir, file);
		if (statSync(filePath).isDirectory()) {
			walk(filePath, fileList);
		} else if (filePath.endsWith(".js") || filePath.endsWith(".ts") || filePath.endsWith(".d.ts")) {
			fileList.push(filePath);
		}
	}
	return fileList;
}

function resolveInRoot(pkgRootDir, targetPath) {
	const cleanTarget = targetPath.replace(/^(?:\.\/|\.\.\/|@\/)+/, "");
	for (const sub of ["dist", "src"]) {
		const candidateBase = join(pkgRootDir, sub, cleanTarget);
		for (const ext of ["", ".js", ".ts", ".d.ts", "/index.js", "/index.ts"]) {
			const full = candidateBase + ext;
			if (existsSync(full) && !statSync(full).isDirectory()) {
				return full;
			}
		}
	}
	return null;
}

let totalFixed = 0;

for (const scanDir of dirsToScan) {
	const pkgRootDir = dirname(scanDir);
	const files = walk(scanDir);

	for (const filePath of files) {
		let content = readFileSync(filePath, "utf8");
		const fileDir = dirname(filePath);

		const replaced = content.replace(/(from\s+["']|import\s*\(["'])(?:\.\/|\.\.\/|@\/)([^"']+)(["'])/g, (match, p1, targetPath, p3) => {
			const rawRel = match.match(/["'](.*?)["']/)[1];
			// Check if rawRel resolves directly
			let directTarget = join(fileDir, rawRel);
			let directExists = false;
			for (const ext of ["", ".js", ".ts", ".d.ts", "/index.js", "/index.ts"]) {
				if (existsSync(directTarget + ext) && !statSync(directTarget + ext).isDirectory()) {
					directExists = true;
					break;
				}
			}

			if (directExists) return match;

			// Try resolving root-relative
			const resolvedTarget = resolveInRoot(pkgRootDir, targetPath);
			if (resolvedTarget) {
				let correctRel = relative(fileDir, resolvedTarget);
				if (!correctRel.startsWith(".")) {
					correctRel = `./${correctRel}`;
				}
				// Match extension of rawRel if present, or maintain target
				totalFixed++;
				return `${p1}${correctRel}${p3}`;
			}

			return match;
		});

		if (replaced !== content) {
			writeFileSync(filePath, replaced, "utf8");
		}
	}
}

console.log(`Successfully fixed ${totalFixed} invalid relative import paths in codemarie.`);
