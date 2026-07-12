"""用规则弱标签训练临时分类器，为公开候选 JD 补全待复核建议。"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def bootstrap_suggestions(source_query: str) -> dict:
    from modules import db
    from modules.job_classifier import predict_job_category, train_job_category_model

    db.init_db()
    weak_samples = db.get_job_category_training_samples(include_weak_labels=True)
    weak_only = [sample for sample in weak_samples if sample["label_source"] == "rule_weak"]
    result = train_job_category_model(weak_only)
    targets = [
        job for job in db.get_all_jobs()
        if source_query.lower() in (job.get("recommendation_reason") or "").lower()
        and not job.get("category_source")
    ]
    distribution: Counter[str] = Counter()
    low_confidence = 0
    for job in targets:
        prediction = predict_job_category(job)
        db.apply_model_job_category(job["id"], prediction["category"], prediction["confidence"])
        db.add_model_prediction({
            "job_id": job["id"],
            "model_name": "bootstrap-rule-weak-suggester",
            "model_version": result["model_version"],
            "prediction_type": "job_category_suggestion",
            "prediction_value": prediction["category"],
            "confidence": prediction["confidence"],
            "explanation_json": json.dumps({
                "label_mode": "rule_weak_bootstrap",
                "warning": "建议类别，不是人工或外部真值标签",
                "top_predictions": prediction["top_predictions"],
            }, ensure_ascii=False),
        })
        distribution[prediction["category"]] += 1
        if prediction["confidence"] < 0.5:
            low_confidence += 1
    return {
        "seed_sample_count": len(weak_only),
        "suggested_count": len(targets),
        "low_confidence_count": low_confidence,
        "suggested_distribution": dict(sorted(distribution.items())),
        "warning": "全部建议均由规则弱标签引导，必须在 CSV 中复核后才可作为训练真值。",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="为公开 JD 生成基于规则弱标签的类别建议")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    parser.add_argument("--model-dir", help="可选：指定模型产物目录")
    parser.add_argument(
        "--source-query",
        default="wangzihaogithub/job-educational-parser-dataset-08-0-0805",
        help="仅为来源审计说明中包含此文本且尚未分类的岗位生成建议",
    )
    args = parser.parse_args()
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path
    if args.model_dir:
        os.environ["INTERNPILOT_MODEL_DIR"] = args.model_dir
    try:
        print(json.dumps(bootstrap_suggestions(args.source_query), ensure_ascii=False, indent=2))
    except (ValueError, RuntimeError, FileNotFoundError) as exc:
        print(f"生成建议失败：{exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
