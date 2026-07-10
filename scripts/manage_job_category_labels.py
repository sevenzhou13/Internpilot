"""导出和导入岗位类别人工复核标签。"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _configure_paths(args: argparse.Namespace) -> None:
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path


def export_labels(args: argparse.Namespace) -> int:
    _configure_paths(args)
    from modules import db

    db.init_db()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    columns = [
        "job_id", "company", "title", "rule_category", "rule_confidence",
        "category", "reviewer_note", "jd_preview",
    ]
    with output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for job in db.get_job_category_review_queue(limit=args.limit):
            writer.writerow({
                "job_id": job["id"],
                "company": job.get("company") or "",
                "title": job.get("title") or "",
                "rule_category": job.get("job_category") or "",
                "rule_confidence": job.get("category_confidence") or "",
                "category": job.get("reviewed_category") or "",
                "reviewer_note": job.get("reviewer_note") or "",
                "jd_preview": (job.get("jd_text") or "").replace("\n", " ")[:500],
            })
    print(f"已导出 {output}")
    return 0


def import_labels(args: argparse.Namespace) -> int:
    _configure_paths(args)
    from modules import db
    from modules.job_classifier import get_category_names

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"找不到标签文件：{input_path}")
    db.init_db()
    allowed = set(get_category_names())
    updated = 0
    errors: list[str] = []
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        for line_number, row in enumerate(csv.DictReader(handle), start=2):
            category = (row.get("category") or "").strip()
            if not category:
                continue
            if category not in allowed:
                errors.append(f"第 {line_number} 行：未知类别“{category}”")
                continue
            try:
                job_id = int(row.get("job_id") or "")
                db.save_job_category_label(job_id, category, (row.get("reviewer_note") or "").strip())
                updated += 1
            except (TypeError, ValueError) as exc:
                errors.append(f"第 {line_number} 行：{exc}")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"已导入 {updated} 条人工复核标签")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="导出或导入 InternPilot 岗位类别人工标签")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    subparsers = parser.add_subparsers(dest="command", required=True)
    export_parser = subparsers.add_parser("export", help="导出待复核岗位 CSV")
    export_parser.add_argument("--output", required=True, help="输出 CSV 路径")
    export_parser.add_argument("--limit", type=int, default=500, help="最多导出岗位数，默认 500")
    export_parser.set_defaults(handler=export_labels)
    import_parser = subparsers.add_parser("import", help="导入人工复核 CSV")
    import_parser.add_argument("--input", required=True, help="输入 CSV 路径")
    import_parser.set_defaults(handler=import_labels)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        return args.handler(args)
    except (FileNotFoundError, OSError, ValueError) as exc:
        print(f"操作失败：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
