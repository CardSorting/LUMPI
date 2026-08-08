import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const distDir = join(process.cwd(), "packages/codemarie/dist");

const aliasMap = [
	{ prefix: "@api/", target: "core/api" },
	{ prefix: "@core/", target: "core" },
	{ prefix: "@generated/", target: "generated" },
	{ prefix: "@hosts/", target: "hosts" },
	{ prefix: "@integrations/", target: "integrations" },
	{ prefix: "@packages/", target: "packages" },
	{ prefix: "@services/", target: "services" },
	{ prefix: "@shared/", target: "shared" },
	{ prefix: "@utils/", target: "utils" },
	{ prefix: "@/", target: "" },
];

function walk(dir, fileList = []) {
	if (!existsSync(dir)) return fileList;
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

function resolveJsPath(absPath, originalSpecifier = "") {
	if (absPath.endsWith(".js") || absPath.endsWith(".json") || absPath.endsWith(".wasm") || absPath.endsWith(".mjs")) {
		return absPath;
	}
	if (originalSpecifier.endsWith("/") || (existsSync(absPath) && statSync(absPath).isDirectory())) {
		if (existsSync(join(absPath, "index.js"))) {
			return join(absPath, "index.js");
		}
	}
	if (existsSync(`${absPath}.js`)) {
		return `${absPath}.js`;
	}
	if (existsSync(absPath) && statSync(absPath).isDirectory() && existsSync(join(absPath, "index.js"))) {
		return join(absPath, "index.js");
	}
	return `${absPath}.js`;
}

const files = walk(distDir);
let totalReplaced = 0;

for (const filePath of files) {
	let content = readFileSync(filePath, "utf8");
	const fileDir = dirname(filePath);

	// Fix corrupted imports from previous regex run
	content = content.replace(/import\s*\{([\s\S]*?)\}\s*=\s*__pkg_json__;?/g, 'const { $1 } = __pkg_json__;');

	// Match: from "...", import("..."), import "..."
	content = content.replace(/(from\s+["']|import\s*\(\s*["']|import\s+["'])([^"'\r\n]+)(["'])/g, (match, p1, specifier, p3) => {
		if (specifier.includes("${") || specifier.includes("`")) {
			return match;
		}

		if (specifier === "vscode") {
			const absTarget = join(distDir, "vscode-shim.js");
			let relPath = relative(fileDir, absTarget);
			if (!relPath.startsWith(".")) {
				relPath = `./${relPath}`;
			}
			totalReplaced++;
			return `${p1}${relPath}${p3}`;
		}

		let absTarget = null;

		for (const { prefix, target } of aliasMap) {
			if (specifier.startsWith(prefix)) {
				const rest = specifier.slice(prefix.length);
				absTarget = join(distDir, target, rest);
				break;
			}
		}

		if (!absTarget && (specifier.startsWith("./") || specifier.startsWith("../") || specifier === "." || specifier === "..")) {
			absTarget = join(fileDir, specifier);
		}

		if (absTarget) {
			const resolvedAbs = resolveJsPath(absTarget, specifier);
			let relPath = relative(fileDir, resolvedAbs);
			if (!relPath.startsWith(".")) {
				relPath = `./${relPath}`;
			}
			totalReplaced++;
			return `${p1}${relPath}${p3}`;
		}

		// Handle external node_modules subpath imports missing .js (e.g. pdf-parse/lib/pdf-parse)
		if (specifier.includes("/") && !specifier.startsWith(".") && !specifier.startsWith("@/")) {
			const nmPath = join(process.cwd(), "node_modules", specifier);
			if (existsSync(`${nmPath}.js`)) {
				totalReplaced++;
				return `${p1}${specifier}.js${p3}`;
			}
		}

		return match;
	});

	// Ensure JSON imports have 'with { type: "json" }' attribute for Node ESM
	content = content.replace(/(import\s+[\s\S]*?from\s+["'][^"']+\.json["'])(?!\s*with\s*\{\s*type:\s*["']json["']\s*\})/g, '$1 with { type: "json" }');

	// Fix JSON imports: Node ESM JSON imports only export default, not named exports or namespace exports
	content = content.replace(/import\s*\*\s*as\s+([A-Za-z0-9_$]+)\s+from\s+(["'][^"']+\.json["']\s*with\s*\{\s*type:\s*["']json["']\s*\});?/g, 'import $1 from $2;');
	content = content.replace(/import\s*\{([^}\r\n]+)\}\s*from\s+(["'][^"']+\.json["']\s*with\s*\{\s*type:\s*["']json["']\s*\});?/g, (m, imports, fromSpec) => {
		const cleanImports = imports.trim().replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)/g, "$1: $2");
		return `import __pkg_json__ from ${fromSpec};\nconst { ${cleanImports} } = __pkg_json__;`;
	});

	writeFileSync(filePath, content, "utf8");
}

console.log(`Successfully normalized ${totalReplaced} import specifiers in codemarie/dist for Node ESM compliance.`);
