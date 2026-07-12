"""批量调用已配置 LLM，为公开 JD 生成可审计的类别初标。"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

CATEGORIES = {
    "算法/机器学习", "数据分析/BI", "用户研究", "产品/AI产品",
    "后端开发", "前端/客户端", "市场/运营", "销售/咨询/项目管理",
}
PROMPT_FILE = "job_category_batch_label_prompt.txt"


def _parse_json_array(text: str) -> list[dict[str, Any]]:
    value = (text or "").strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?\s*|\s*```$", "", value, flags=re.I | re.S).strip()
    payload = json.loads(value)
    if isinstance(payload, dict):
        payload = payload.get("results", [])
    if not isinstance(payload, list):
        raise ValueError("模型未返回 JSON 数组")
    return [item for item in payload if isinstance(item, dict)]


def _build_prompt(template: str, jobs: list[dict[str, Any]]) -> str:
    rows = [
        {
            "job_id": job["id"],
            "title": job.get("title") or "",
            "jd_text": (job.get("jd_text") or "")[:1800],
        }
        for job in jobs
    ]
    return template.replace("{jobs_json}", json.dumps(rows, ensure_ascii=False))


def label_public_jobs(source_query: str, batch_size: int = 10, limit: int = 300) -> dict:
    from modules import db
    from modules.llm_client import call_llm, get_llm_config, is_llm_configured, load_prompt

    if not is_llm_configured():
        raise RuntimeError("未配置 LLM，无法执行批量初标")
    if batch_size < 1 or batch_size > 20:
        raise ValueError("batch-size 必须在 1 到 20 之间")
    db.init_db()
    template = load_prompt(PROMPT_FILE)
    if not template:
        raise FileNotFoundError(f"找不到提示词 {PROMPT_FILE}")
    prompt_version = hashlib.sha256(template.encode("utf-8")).hexdigest()[:12]
    targets = [
        job for job in db.get_all_jobs()
        if source_query.lower() in (job.get("recommendation_reason") or "").lower()
        and (job.get("jd_text") or "").strip()
        and (job.get("category_source") or "") not in {"manual", "external_dataset", "llm_bootstrap"}
    ][:limit]
    failures: list[dict[str, str]] = []
    distribution: Counter[str] = Counter()
    completed = 0
    config = get_llm_config()
    for index in range(0, len(targets), batch_size):
        batch = targets[index:index + batch_size]
        response = call_llm(_build_prompt(template, batch), temperature=0.0)
        if response.startswith("⚠️"):
            failures.extend({"job_id": str(job["id"]), "error": response} for job in batch)
            continue
        try:
            predictions = _parse_json_array(response)
        except (json.JSONDecodeError, ValueError) as exc:
            failures.extend({"job_id": str(job["id"]), "error": f"响应解析失败：{exc}"} for job in batch)
            continue
        mapped = {str(item.get("job_id")): item for item in predictions}
        for job in batch:
            item = mapped.get(str(job["id"]))
            category = str((item or {}).get("category") or "").strip()
            try:
                confidence = float((item or {}).get("confidence"))
            except (TypeError, ValueError):
                confidence = -1.0
            if category not in CATEGORIES or not 0.0 <= confidence <= 1.0:
                failures.append({"job_id": str(job["id"]), "error": "类别或置信度不符合约定"})
                continue
            reason = str(item.get("reason") or "")[:120]
            db.apply_model_job_category(job["id"], category, confidence, "llm_bootstrap")
            db.add_model_prediction({
                "job_id": job["id"],
                "model_name": "llm-job-category-bootstrap",
                "model_version": f"{config['model']}:{prompt_version}",
                "prediction_type": "job_category_suggestion",
                "prediction_value": category,
                "confidence": confidence,
                "explanation_json": json.dumps({
                    "label_mode": "llm_bootstrap",
                    "prompt_file": PROMPT_FILE,
                    "prompt_version": prompt_version,
                    "reason": reason,
                    "warning": "LLM 初标建议，不是人工或外部数据集真值标签",
                }, ensure_ascii=False),
            })
            distribution[category] += 1
            completed += 1
    return {
        "target_count": len(targets),
        "completed_count": completed,
        "failed_count": len(failures),
        "distribution": dict(sorted(distribution.items())),
        "failures": failures,
        "model": config["model"],
        "prompt_file": PROMPT_FILE,
        "prompt_version": prompt_version,
        "warning": "所有类别均为 LLM 初标建议，未写入人工/外部真值标签。",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="使用已配置 LLM 批量初标公开 JD 类别")
    parser.add_argument("--db-path", help="可选：指定 SQLite 数据库路径")
    parser.add_argument("--source-query", default="wangzihaogithub/job-educational-parser-dataset-08-0-0805")
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--limit", type=int, default=300)
    parser.add_argument("--report", default="data/processed/llm_category_bootstrap_report.json")
    args = parser.parse_args()
    if args.db_path:
        os.environ["INTERNPILOT_DB_PATH"] = args.db_path
    try:
        result = label_public_jobs(args.source_query, args.batch_size, args.limit)
    except (RuntimeError, ValueError, FileNotFoundError) as exc:
        print(f"初标失败：{exc}", file=sys.stderr)
        return 1
    report = Path(args.report)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if key != "failures"}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
