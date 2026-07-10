import csv
import os
import subprocess
import sys
from pathlib import Path

from modules import db


ROOT = Path(__file__).resolve().parents[1]


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
