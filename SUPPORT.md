# LUMI Support & Community Gateway

Welcome to the **LUMI** support gateway! Whether you are an individual developer, an open-source contributor, an engineering lead, or an enterprise security team, this document directs you to the appropriate support channels.

---

## 🧭 Support Matrix & Channels

| Need / Query Type | Primary Channel | Response Target |
| :--- | :--- | :--- |
| **General Developer Q&A** | [Discord Server](https://discord.com/invite/nKXTsAcmbT) | Community & Maintainers |
| **Bug Reports & Issues** | [GitHub Issues](https://github.com/CardSorting/LUMPI/issues) | Triaged Daily |
| **Architectural Proposals & RFCs** | [rfc.earendil.com](https://rfc.earendil.com/keyword/pi/) | Reviewed Weekly |
| **Private Security Advisories** | Email `security@earendil.com` | Priority Review (<24h) |
| **Code of Conduct Reports** | Email `conduct@earendil.com` | Private Review |

---

## 💬 Community Discord

Join our active developer community on [Discord](https://discord.com/invite/nKXTsAcmbT):
- `#general`: General discussion and developer feedback.
- `#extensions`: Authoring custom tools, subagents, and extensions.
- `#announcements`: Release announcements and feature highlights.
- `#help`: Troubleshooting installation or setup issues.

---

## 🐛 Submitting Actionable Bug Reports

Before submitting a bug report on GitHub:
1. Search existing closed issues to check if a fix or workaround already exists in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
2. Run verification suite (`npm run check`, `cargo check --manifest-path crates/pi-natives/Cargo.toml`, `bun packages/coding-agent/src/cli.ts --smoke-test`, and `./test.sh`) to ensure your environment is healthy.
3. Include minimal reproduction steps, terminal output logs, node version, operating system, and affected package name.

---

## 🔒 Enterprise & Security Support

For enterprise teams deploying LUMI across internal development teams:
- **Zero-Data Leakage**: Verify local model deployments using Ollama or private proxies.
- **Sandboxing**: Refer to [SECURITY.md](SECURITY.md) for Gondolin Micro-VM, Docker, and OpenShell policy configuration.
- **Private Vulnerability Disclosure**: Email `security@earendil.com` or create a private GitHub Security Advisory. Do not post security concerns publicly.
