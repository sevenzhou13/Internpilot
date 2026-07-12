from modules import db
from modules.analytics import get_analytics_overview


def test_analytics_returns_skill_gaps_and_funnel(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "analytics.db"))
    db.init_db()
    db.add_experience({"title": "分析项目", "tools": "Python", "keywords": "Python"})
    db.add_job({"title": "数据分析", "skills": "Python,SQL", "status": "已投递", "job_category": "数据分析/BI"})

    overview = get_analytics_overview()

    assert overview["total_jobs"] == 1
    assert overview["funnel"] == [{"name": "已投递", "count": 1}]
    assert overview["skill_gaps"] == [{"name": "SQL", "count": 1}]
