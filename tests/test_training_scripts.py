import csv
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

from modules import db


ROOT = Path(__file__).resolve().parents[1]


def _load_download_script():
    spec = importlib.util.spec_from_file_location(
        "download_hf_public_jds", ROOT / "scripts" / "download_hf_public_jds.py"
    )
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


def _load_script(filename: str, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, ROOT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


def test_label_export_and_import_scripts_round_trip(tmp_path, monkeypatch):
    db_path = tmp_path / "labels.db"
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(db_path))
    db.init_db()
    job_id = db.add_job({"title": "数据分析实习生", "jd_text": "熟悉 Python 和 SQL"})
    csv_path = tmp_path / "review.csv"
    environment = {**os.environ, "INTERNPILOT_DB_PATH": str(db_path)}

    exported = subprocess.run(
        [sys.executable, "scripts/manage_job_category_labels.py", "export", "--output", str(csv_path)],
        cwd=ROOT, env=environment, capture_output=True, text=True, check=False,
    )
    assert exported.returncode == 0, exported.stderr
    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert rows[0]["job_id"] == str(job_id)
    rows[0]["category"] = "数据分析/BI"
    rows[0]["reviewer_note"] = "人工确认"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    imported = subprocess.run(
        [sys.executable, "scripts/manage_job_category_labels.py", "import", "--input", str(csv_path)],
        cwd=ROOT, env=environment, capture_output=True, text=True, check=False,
    )
    assert imported.returncode == 0, imported.stderr
    assert db.get_job_category_training_samples(False)[0]["category"] == "数据分析/BI"


def test_public_jd_jsonl_import_script_preserves_source_and_deduplicates(tmp_path, monkeypatch):
    db_path = tmp_path / "public-jds.db"
    jsonl_path = tmp_path / "public-jds.jsonl"
    record = {
        "source_url": "https://example.com/jobs/data-analyst-1",
        "captured_at": "2026-07-11T13:00:00+08:00",
        "query": "数据分析实习生",
        "platform": "示例公开来源",
        "title": "数据分析实习生",
        "company": "示例公司",
        "location": "北京",
        "jd_text": "熟悉 Python、SQL，参与数据看板建设和业务分析。",
    }
    jsonl_path.write_text(json.dumps(record, ensure_ascii=False) + "\n", encoding="utf-8")
    environment = {**os.environ, "INTERNPILOT_DB_PATH": str(db_path)}
    command = [sys.executable, "scripts/import_public_jds.py", "--input", str(jsonl_path)]

    first = subprocess.run(command, cwd=ROOT, env=environment, capture_output=True, text=True, check=False)
    second = subprocess.run(command, cwd=ROOT, env=environment, capture_output=True, text=True, check=False)

    assert first.returncode == 0, first.stderr
    assert "已创建 1 条" in first.stdout
    assert second.returncode == 0, second.stderr
    assert "跳过重复 1 条" in second.stdout
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(db_path))
    job = db.get_all_jobs()[0]
    assert job["source"] == "public_jd_collection"
    assert "查询=数据分析实习生" in job["recommendation_reason"]


def test_hf_public_jd_sampler_writes_auditable_jsonl(tmp_path, monkeypatch):
    module = _load_download_script()
    payload = {
        "rows": [
            {"row": {"job_id": 1, "user": "<岗位名称>数据分析师</岗位名称><岗位描述>使用 Python 和 SQL 完成数据看板、指标体系建设、业务分析和经营策略评估，持续支持跨部门决策。</岗位描述>"}},
            {"row": {"job_id": 2, "user": "<岗位名称>产品经理</岗位名称><岗位描述>负责用户调研、需求分析、原型设计、产品迭代和跨部门项目推进，持续提升用户体验与业务指标。</岗位描述>"}},
        ]
    }

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, *_args):
            return json.dumps(payload, ensure_ascii=False).encode("utf-8")

    monkeypatch.setattr(module.request, "urlopen", lambda *_args, **_kwargs: FakeResponse())
    output = tmp_path / "hf.jsonl"

    assert module.download_public_jds(output, count=2, batch_size=2) == 2
    rows = [json.loads(line) for line in output.read_text(encoding="utf-8").splitlines()]
    assert rows[0]["title"] == "数据分析师"
    assert rows[1]["source_url"].startswith("https://huggingface.co/datasets/")
    assert rows[0]["location"] == "未提供"


def test_review_export_includes_non_truth_category_suggestions(tmp_path, monkeypatch):
    db_path = tmp_path / "suggestions.db"
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(db_path))
    db.init_db()
    db.add_job({
        "title": "数据分析师", "jd_text": "使用 SQL 完成业务数据分析",
        "job_category": "数据分析/BI", "category_confidence": 0.61, "category_source": "model",
    })
    output = tmp_path / "review.csv"
    environment = {**os.environ, "INTERNPILOT_DB_PATH": str(db_path)}
    exported = subprocess.run(
        [sys.executable, "scripts/manage_job_category_labels.py", "export", "--output", str(output)],
        cwd=ROOT, env=environment, capture_output=True, text=True, check=False,
    )
    assert exported.returncode == 0, exported.stderr
    with output.open(encoding="utf-8-sig", newline="") as handle:
        row = next(csv.DictReader(handle))
    assert row["suggested_category"] == "数据分析/BI"
    assert row["suggestion_source"] == "model"


def test_llm_bootstrap_parser_accepts_json_and_code_fence():
    module = _load_script("llm_bootstrap_job_categories.py", "llm_bootstrap_job_categories")
    payload = '[{"job_id": 7, "category": "后端开发", "confidence": 0.82, "reason": "服务端开发职责"}]'

    assert module._parse_json_array(payload)[0]["job_id"] == 7
    assert module._parse_json_array(f"```json\n{payload}\n```")[0]["category"] == "后端开发"
