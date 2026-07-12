"""部署前安全检查：只检查被 Git 跟踪的路径和本地忽略规则。"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_IGNORES = (".env", "data/internpilot.db", "data/raw/", "artifacts/models/")
FORBIDDEN_TRACKED = (".env", "data/", "artifacts/models/", "data/backups/")


def run_check(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    gitignore = (root / ".gitignore").read_text(encoding="utf-8") if (root / ".gitignore").exists() else ""
    for entry in REQUIRED_IGNORES:
        if entry not in gitignore:
            errors.append(f".gitignore 缺少 {entry}")

    tracked = subprocess.run(
        ["git", "-C", str(root), "ls-files"], capture_output=True, text=True, check=False
    ).stdout.splitlines()
    for path in tracked:
        normalized = path.replace("\\", "/")
        if normalized == ".env" or any(normalized.startswith(prefix) for prefix in FORBIDDEN_TRACKED[1:]):
            errors.append(f"不应跟踪敏感本地文件：{normalized}")
    return errors


def main() -> int:
    errors = run_check()
    if errors:
        print("安全检查失败：", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("安全检查通过：未发现被跟踪的 .env、真实数据库、原始数据或模型产物。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
