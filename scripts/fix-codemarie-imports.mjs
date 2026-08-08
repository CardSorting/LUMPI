import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const distDir = join(process.cwd(), "packages/codemarie/dist");

function walk(dir, fileList = []) {
	const files = readdirSync(dir);
	for (const file of files) {
		const filePath = join(dir, file);
		if (statSync(filePath).isDirectory()) {
			walk(filePath, fileList);
		} else if (filePath.endsWith(".js") || filePath.endsWith(".d.ts")) {
			fileList.push(filePath);
		}
	}
	return fileList;
}

function resolveExtension(absPath) {
	if (absPath.endsWith(".js") || absPath.endsWith(".json") || absPath.endsWith(".wasm") || absPath.endsWith(".mjs")) {
		return absPath;
	}
	if (existsSync(`${absPath}.js`)) {
		return `${absPath}.js`;
	}
	if (existsSync(absPath) && statSync(absPath).isDirectory() && existsSync(join(absPath, "index.js"))) {
		return join(absPath, "index.js");
	}
	if (existsSync(`${absPath}.d.ts`)) {
		return `${absPath}.js`;
	}
	return `${absPath}.js`;
}

const files = walk(distDir);
let totalReplaced = 0;

for (const filePath of files) {
	let content = readFileSync(filePath, "utf8");
	const fileDir = dirname(filePath);

	// Match imports/exports with relative paths or @/ paths
	const replaced = content.replace(/(from\s+["']|import\s*\(["'])(?:\.\/|\.\.\/|@\/)?([^"']+)(["'])/g, (match, p1, targetPath, p3) => {
		let isAlias = match.includes("@/");
		let isRelative = match.includes("./") || match.includes("../");

		if (!isAlias && !isRelative) return match;

		let absTarget = isAlias ? join(distDir, targetPath) : join(fileDir, targetPath);
		let resolvedAbs = resolveExtension(absTarget);

		let relPath = relative(fileDir, resolvedAbs);
		if (!relPath.startsWith(".")) {
			relPath = `./${relPath}`;
		}

		totalReplaced++;
		return `${p1}${relPath}${p3}`;
	});

	if (replaced !== content) {
		writeFileSync(filePath, replaced, "utf8");
	}
}

console.log(`Successfully normalized ${totalReplaced} import paths in codemarie/dist.`);
