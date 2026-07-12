"""导出可复现的数据挖掘课程实验摘要（仅聚合结果）。"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def main() -> int:
    parser = argparse.ArgumentParser(description="导出 InternPilot 数据挖掘实验摘要")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    parser.add_argument("--max-clusters", type=int, default=5)
    parser.add_argument("--output-dir", default="data/processed/mining_experiment")
    args = parser.parse_args()
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path

    from modules import db
    from modules.experiment_report import build_mining_experiment_report, render_markdown

    db.init_db()
    report = build_mining_experiment_report(max(2, args.max_clusters))
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "report.md").write_text(render_markdown(report), encoding="utf-8")
    print(f"已生成 {output_dir / 'report.json'} 和 {output_dir / 'report.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
