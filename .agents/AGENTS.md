# Workspace Agent Rules

## Architectural & Code Standards

- **Erasable TypeScript Syntax Only**: Code must conform to Node strip-only mode (no `enum`, `namespace`, parameter properties, `import =`, `export =`).
- **Top-Level Imports Only**: Never use dynamic inline imports (`await import()`, `import("pkg").Type`).
- **No `any`**: Avoid `any` unless strictly required for external API boundaries.
- **Zero-GC Substrate Compliance**: All code paths in `packages/broccolidb` and memory allocators must use pre-allocated slab arenas (`ArenaAllocator`).
- **Line Delta Verification**: Use `@oh-my-pi/hashline` xxHash line-anchored deltas for precise file modifications.

## Verification & Quality Gates

- After any non-documentation code edits, run `npm run check`.
- Verify native Rust crate compilation via `cargo check --manifest-path crates/pi-natives/Cargo.toml`.
- Run non-e2e test suites via `./test.sh`.

## Agentic Workflows

- Before starting complex tasks, inspect available workspace skills in `.agents/skills/*/SKILL.md`.
- Use `npx tsx packages/coding-agent/src/commit/cli.ts --agentic` for conventional commit generation.
- Record new troubleshooting patterns or findings in `.agents/skills/agent-playbook-method/SKILL.md`.
