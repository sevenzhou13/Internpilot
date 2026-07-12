from modules import db
from modules.job_clustering import cluster_jobs


def test_job_clustering_returns_keywords_and_metrics(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "clusters.db"))
    db.init_db()
    for title, text in [
        ("数据分析实习生", "Python SQL 数据看板 商业分析"),
        ("商业分析实习生", "SQL Python 指标分析 数据报告"),
        ("产品经理实习生", "用户调研 需求分析 产品原型"),
        ("AI 产品实习生", "大模型 产品需求 用户场景"),
    ]:
        db.add_job({"title": title, "jd_text": text})

    result = cluster_jobs(2)

    assert result["job_count"] == 4
    assert len(result["clusters"]) == 2
    assert result["metrics"]["evaluated"] is True
    assert result["metrics"]["selected_cluster_count"] == 2
    assert result["metrics"]["candidates"] == [{"cluster_count": 2, "silhouette": result["metrics"]["silhouette"]}]
    assert all(cluster["keywords"] and cluster["jobs"] for cluster in result["clusters"])
