"""将经过授权采集的公开 JD JSONL 导入 InternPilot 本地数据库。"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


REQUIRED_FIELDS = (
    "source_url",
    "captured_at",
    "query",
    "platform",
    "title",
    "company",
    "location",
    "jd_text",
)


def _read_records(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"第 {line_number} 行不是有效 JSON：{exc.msg}") from exc
            missing = [field for field in REQUIRED_FIELDS if not str(record.get(field) or "").strip()]
            if missing:
                raise ValueError(f"第 {line_number} 行缺少字段：{', '.join(missing)}")
            records.append(record)
    if not records:
        raise ValueError("输入文件没有可导入的记录")
    return records


def _to_job(record: dict[str, Any]) -> dict[str, Any]:
    source_url = str(record["source_url"]).strip()
    hostname = urlparse(source_url).hostname or ""
    query = str(record["query"]).strip()
    captured_at = str(record["captured_at"]).strip()
    platform = str(record["platform"]).strip()
    audit_note = f"公开采集：平台={platform}；查询={query}；采集时间={captured_at}"
    return {
        "title": str(record["title"]).strip(),
        "company": str(record["company"]).strip(),
        "location": str(record["location"]).strip(),
        "jd_text": str(record["jd_text"]).strip(),
        "raw_clip_text": str(record["jd_text"]).strip(),
        "apply_url": source_url,
        "source": "public_jd_collection",
        "source_domain": hostname,
        "source_platform": platform,
        "recommendation_reason": audit_note,
        "status": "未查看",
    }


def import_records(path: Path, allow_duplicates: bool = False) -> dict[str, int]:
    from modules import db
    from modules.job_structurer import structure_job

    db.init_db()
    result = {"created": 0, "duplicates": 0}
    for record in _read_records(path):
        job = structure_job(_to_job(record))
        if db.find_job_by_duplicate_hash(job["duplicate_hash"]) and not allow_duplicates:
            result["duplicates"] += 1
            continue
        skill_rows = job.pop("skill_rows", [])
        job_id = db.add_job(job)
        db.replace_job_skills(job_id, skill_rows)
        result["created"] += 1
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="导入用户授权采集的公开 JD JSONL")
    parser.add_argument("--input", required=True, help="符合公开 JD 采集规范的 JSONL 文件")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    parser.add_argument("--allow-duplicates", action="store_true", help="允许写入重复岗位")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path
    try:
        result = import_records(Path(args.input), args.allow_duplicates)
    except (OSError, ValueError) as exc:
        print(f"导入失败：{exc}", file=sys.stderr)
        return 1
    print(f"已创建 {result['created']} 条，跳过重复 {result['duplicates']} 条")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
