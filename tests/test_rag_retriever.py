from modules import db
from modules.rag_retriever import rebuild_knowledge_index, retrieve_knowledge


def test_rebuild_and_retrieve_local_knowledge(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "rag.db"))
    db.init_db()
    job_id = db.add_job({"title": "数据分析实习生", "skills": "Python,SQL", "jd_text": "使用 Python 和 SQL 制作数据看板"})
    db.add_experience({"title": "指标分析项目", "tools": "Python,SQL", "results": "完成运营数据看板"})

    result = rebuild_knowledge_index()
    chunks = retrieve_knowledge("我有哪些 Python 数据看板经历？", job_id)

    assert result["total"] >= 2
    assert any(chunk["doc_type"] == "experience" for chunk in chunks)
    assert any(chunk["doc_type"] == "job" for chunk in chunks)
