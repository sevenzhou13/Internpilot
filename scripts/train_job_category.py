"""以固定配置训练岗位类别基线模型，并输出可记录的实验元数据。"""

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
    parser = argparse.ArgumentParser(description="训练 InternPilot 岗位类别分类模型")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    parser.add_argument("--model-dir", help="可选：指定模型产物目录")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--manual-only", action="store_true", help="仅使用人工复核标签（默认）")
    mode.add_argument("--include-weak-labels", action="store_true", help="混入规则弱标签，仅用于探索")
    args = parser.parse_args()
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path
    if args.model_dir:
        os.environ["INTERNPILOT_MODEL_DIR"] = args.model_dir

    from modules import db
    from modules.job_classifier import ClassifierDataError, train_job_category_model

    db.init_db()
    include_weak_labels = bool(args.include_weak_labels)
    samples = db.get_job_category_training_samples(include_weak_labels)
    try:
        result = train_job_category_model(samples)
    except (ClassifierDataError, RuntimeError) as exc:
        print(f"训练未完成：{exc}", file=sys.stderr)
        return 1
    result["label_mode"] = "manual_plus_rule_weak" if include_weak_labels else "manual_only"
    result["manual_sample_count"] = sum(item["label_source"] == "manual" for item in samples)
    result["weak_sample_count"] = sum(item["label_source"] == "rule_weak" for item in samples)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
