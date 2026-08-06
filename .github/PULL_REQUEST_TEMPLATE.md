## 📝 Description

Please provide a concise description of the changes introduced by this pull request and the problem they solve.

Fixes # <!-- Issue number, e.g., fixes #123 -->

---

## 🧪 Verification & Testing

Please check all items that apply to this PR:

- [ ] Ran `npm run check` locally and all quality gate checks passed without errors.
- [ ] Ran `./test.sh` locally and all non-e2e unit/integration tests passed cleanly.
- [ ] Added/updated unit tests or issue-specific regression specs (`packages/coding-agent/test/suite/regressions/`).
- [ ] Tested interactive TUI or CLI behavior directly (or via `tmux`).

---

## 🔒 Security & Code Standards Checklist

- [ ] Code strictly follows Node strip-only erasable TypeScript syntax (no `enum`, `namespace`, parameter properties).
- [ ] All imports are top-level imports (no dynamic `await import(...)`).
- [ ] No `any` types introduced unless strictly necessary.
- [ ] Did NOT edit `CHANGELOG.md` directly (changelog entries are managed by maintainers).
- [ ] Did NOT modify `packages/ai/src/models.generated.ts` directly (updated `generate-models.ts` instead if applicable).

---

## 📷 Screenshots / TUI Recordings (if applicable)

*Add screenshots, ASCII diagrams, or terminal recordings if updating UI/TUI components.*
