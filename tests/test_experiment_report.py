from modules import db
from modules.experiment_report import build_mining_experiment_report, render_markdown


def test_experiment_report_contains_aggregates_and_reproducible_clustering(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "experiment.db"))
    monkeypatch.setenv("APP_MODE", "test")
    db.init_db()
    db.add_experience({"title": "分析项目", "tools": "Python,SQL", "keywords": "Python,SQL"})
    for title, text in [
        ("数据分析实习生", "Python SQL 数据看板 商业分析"),
        ("商业分析实习生", "SQL Python 指标分析 数据报告"),
        ("产品经理实习生", "用户调研 需求分析 产品原型"),
        ("AI 产品实习生", "大模型 产品需求 用户场景"),
    ]:
        db.add_job({"title": title, "jd_text": text, "skills": "Python,SQL"})

    report = build_mining_experiment_report(max_clusters=3)

    assert report["method"]["random_state"] == 42
    assert report["data_quality"]["job_count"] == 4
    assert report["clustering"]["metrics"]["selected_cluster_count"] in {2, 3}
    assert "数据挖掘实验摘要" in render_markdown(report)
