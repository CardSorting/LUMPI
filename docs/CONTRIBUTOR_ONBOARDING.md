# 15-Minute Engine Contributor Onboarding Guide

Welcome to the **LUMI** contributor team! This guide will get you from zero to submitting your first verified pull request across `@noorm/*` monorepo packages in under 15 minutes.

---

## ⏱️ 15-Minute Onboarding Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
## 15-MINUTE CONTRIBUTOR ONBOARDING STEPS
├─────────────────────────────────────────────────────────────────────────────┤
│  Min 0–3 : Clone & Hydrate Workspace (`npm install --ignore-scripts`)       │
│  Min 3–5 : Run Monorepo Quality Gate (`npm run check`)                      │
│  Min 5–8 : Launch Interactive TUI from Source (`./pi-test.sh`)              │
│  Min 8–12: Make Code Edits & Add Issue Regression Spec                      │
│  Min 12–15: Verify Quality Gate & Submit PR with `pkg:*` Labels              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step 1: Workspace Setup (3 Minutes)

Clone the repository and install dependencies cleanly without executing post-install scripts:

```bash
git clone https://github.com/CardSorting/LUMPI.git
cd LUMPI
npm install --ignore-scripts
```

---

## 🧪 Step 2: Verify Monorepo Quality Gate (2 Minutes)

Before making any changes, verify that your local workspace passes all quality checks:

```bash
# Run mandatory quality gate (Biome linter, pinned deps, imports, shrinkwrap)
npm run check

# Run non-e2e test suite across packages
./test.sh
```

---

## 🖥️ Step 3: Launch Local Interactive TUI (3 Minutes)

Test local changes to the TUI or CLI binary in real time from source:

```bash
# Launch interactive TUI session with environment keys
./pi-test.sh

# Launch keyless evaluation mode
./pi-test.sh --no-env
```

---

## ✍️ Step 4: Make Code Edits & Follow Golden Rules (4 Minutes)

All code contributions must strictly adhere to the following rules:

1. **Erasable TypeScript Syntax**: Conform to Node strip-only mode (no `enum`, `namespace`, parameter properties, or non-standard TS emit features).
2. **Top-Level Imports Only**: Dynamic inline imports (`await import(...)`) are prohibited.
3. **No `any` Types**: Avoid `any` unless strictly necessary for dynamic external interfaces.
4. **Zero-GC Substrate Compliance**: Code paths under `packages/broccolidb` must use pre-allocated slab allocators (`ArenaAllocator`).
5. **Issue Regression Specs**: Add bug fix regression specs under `packages/coding-agent/test/suite/regressions/<issue-number>-<short-slug>.test.ts`.

---

## 🚀 Step 5: Submit PR & Maintainer Triage (3 Minutes)

1. Verify quality gate:
   ```bash
   npm run check
   ```
2. Commit only files you modified:
   ```bash
   git add <path1> <path2>
   git commit -m "feat(coding-agent): add feature description"
   ```
3. Open Pull Request on GitHub with appropriate package labels (`pkg:agent`, `pkg:ai`, `pkg:coding-agent`, `pkg:tui`).
4. Note that new contributor PRs are auto-closed by default for triage; maintainers review daily and reopen with `lgtm` approval.

---

## 📚 Essential Contributor References

- 🛠️ [Engine Field Guide](../DEVELOPMENT.md)
- 📜 [Contribution Charter](../CONTRIBUTING.md)
- 🏷️ [Triage Taxonomy & Labeling](TRIAGE_AND_LABELING.md)
- 🗺️ [Monorepo Diagrams](DIAGRAMS.md)
