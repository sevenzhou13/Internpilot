"""将用户确认采用的 LLM 初标建议固化为可追溯的弱监督训练标签。"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def promote_suggestions(source_query: str, reviewer_note: str) -> int:
    from modules import db

    db.init_db()
    updated = 0
    for job in db.get_all_jobs():
        if source_query.lower() not in (job.get("recommendation_reason") or "").lower():
            continue
        if job.get("category_source") != "llm_bootstrap" or not job.get("job_category"):
            continue
        db.save_job_category_label(job["id"], job["job_category"], reviewer_note, "llm_mapped")
        updated += 1
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="将 LLM 岗位类别建议固化为弱监督训练标签")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    parser.add_argument("--source-query", default="wangzihaogithub/job-educational-parser-dataset-08-0-0805")
    parser.add_argument("--note", default="用户确认采用 LLM 岗位类别映射；弱监督标签，非人工复核")
    args = parser.parse_args()
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path
    try:
        print(f"已固化 {promote_suggestions(args.source_query, args.note)} 条 llm_mapped 弱监督标签")
    except (ValueError, OSError) as exc:
        print(f"固化失败：{exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
