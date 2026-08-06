import os
import shutil
import sys
from pathlib import Path

# Fallback path resolution for Harbor installed via uv tool
_harbor_lib = Path.home() / ".local/share/uv/tools/harbor/lib"
if _harbor_lib.exists():
    for _p in _harbor_lib.glob("python3.*/site-packages"):
        if _p.exists() and str(_p) not in sys.path:
            sys.path.insert(0, str(_p))

try:
    from harbor.agents.installed.base import BaseInstalledAgent, ExecInput
    from harbor.models.agent.context import AgentContext
except ImportError:
    # Allow static type checkers / linters to resolve or fail gracefully
    from harbor.agents.installed.base import BaseInstalledAgent, ExecInput  # type: ignore[import-not-found]
    from harbor.models.agent.context import AgentContext  # type: ignore[import-not-found]


class PiAgent(BaseInstalledAgent):
    """Harbor Agent Adapter for Pi CLI."""

    SUPPORTS_ATIF: bool = False

    @staticmethod
    def name() -> str:
        return "pi"

    def version(self) -> str | None:
        return "0.83.0"

    @property
    def _install_agent_template_path(self) -> Path:
        return Path(__file__).parent / "install_pi_agent.sh"

    async def setup(self, environment) -> None:
        # Run node environment setup script inside container
        await super().setup(environment)

        # Source dist directory from coding-agent
        repo_root = Path(__file__).parents[2]
        coding_agent_dir = repo_root / "packages/coding-agent"

        # Create temporary staging directory with coding-agent dist and package.json
        staging_dir = self.logs_dir / "pi_staging"
        if staging_dir.exists():
            shutil.rmtree(staging_dir)
        staging_dir.mkdir(parents=True, exist_ok=True)

        shutil.copytree(coding_agent_dir / "dist", staging_dir / "dist", dirs_exist_ok=True)
        shutil.copy2(coding_agent_dir / "package.json", staging_dir / "package.json")

        # Archive and upload staging directory
        tar_archive = self.logs_dir / "pi-dist"
        archive_file = Path(shutil.make_archive(str(tar_archive), "gztar", staging_dir))

        await environment.upload_file(
            source_path=archive_file,
            target_path="/installed-agent/pi-dist.tar.gz",
        )

        # Extract distribution and create /usr/local/bin/pi executable wrapper inside container
        await environment.exec(
            command="mkdir -p /opt/pi && tar -xzf /installed-agent/pi-dist.tar.gz -C /opt/pi"
        )
        await environment.exec(
            command="echo '#!/usr/bin/env bash\nexec node /opt/pi/dist/cli.js \"$@\"' > /usr/local/bin/pi && chmod +x /usr/local/bin/pi"
        )

        # Copy local Pi auth / config directory if present on host
        host_pi_config = Path.home() / ".config/pi"
        if host_pi_config.exists():
            config_archive = Path(shutil.make_archive(str(self.logs_dir / "pi-config"), "gztar", host_pi_config))
            await environment.upload_file(
                source_path=config_archive,
                target_path="/installed-agent/pi-config.tar.gz",
            )
            await environment.exec(
                command="mkdir -p /root/.config/pi && tar -xzf /installed-agent/pi-config.tar.gz -C /root/.config/pi"
            )

    def create_run_agent_commands(self, instruction: str) -> list[ExecInput]:
        escaped_prompt = instruction.replace("'", "'\"'\"'")
        if self.model_name:
            if "/" in self.model_name:
                provider, model = self.model_name.split("/", 1)
                cmd = f"pi --provider {provider} --model {model} -p '{escaped_prompt}'"
            else:
                cmd = f"pi --model {self.model_name} -p '{escaped_prompt}'"
        else:
            cmd = f"pi --provider openai-codex --model gpt-5.6-terra -p '{escaped_prompt}'"
        return [
            ExecInput(
                command=cmd,
                timeout_sec=1800,
            )
        ]

    def populate_context_post_run(self, context: AgentContext) -> None:
        pass
