import importlib
import sys

from fastapi.testclient import TestClient


def _load_app(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "api.db"))
    monkeypatch.setenv("APP_MODE", "test")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    sys.modules.pop("server", None)
    import modules.db as db_module

    importlib.reload(db_module)
    server = importlib.import_module("server")
    return server.app


def test_health_and_basic_crud_without_llm(tmp_path, monkeypatch):
    client = TestClient(_load_app(tmp_path, monkeypatch))

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok", "mode": "test"}

    profile = client.post(
        "/api/profile",
        json={"target_roles": "数据分析", "target_locations": "上海"},
    )
    assert profile.status_code == 200

    job = client.post(
        "/api/jobs",
        json={"title": "数据分析实习生", "company": "示例公司", "jd_text": "熟悉 SQL"},
    )
    assert job.status_code == 200
    assert client.get("/api/jobs").json()[0]["title"] == "数据分析实习生"
    assert client.get("/api/llm/status").json() == {"configured": False}


def test_text_preview_commit_duplicate_and_analysis(tmp_path, monkeypatch):
    client = TestClient(_load_app(tmp_path, monkeypatch))
    text = "数据分析实习生\n上海，要求本科及以上，熟悉 Python、SQL，150-200元/天。"

    preview = client.post("/api/jobs/import/text/preview", json={"text": text})
    assert preview.status_code == 200
    job = preview.json()["jobs"][0]
    assert job["job_category"] == "数据分析/BI"
    assert job["duplicate_of"] is None

    committed = client.post("/api/jobs/import/commit", json={"jobs": [job]})
    assert committed.status_code == 200
    job_id = committed.json()["created"][0]["id"]

    duplicate = client.post("/api/jobs/import/commit", json={"jobs": [job]})
    assert duplicate.json()["created"] == []
    assert duplicate.json()["duplicates"][0]["existing_id"] == job_id

    analysis = client.get(f"/api/jobs/{job_id}/analysis").json()
    assert analysis["job"]["job_category"] == "数据分析/BI"
    assert {item["skill_name"] for item in analysis["skills"]} >= {"Python", "SQL"}
    assert analysis["application_events"][0]["to_status"] == "未查看"

    update = client.patch(
        f"/api/jobs/{job_id}",
        json={"title": "高级数据分析实习生", "company": "示例公司", "jd_text": text},
    )
    assert update.status_code == 200
    updated = client.get(f"/api/jobs/{job_id}/analysis").json()["job"]
    assert updated["job_category"] == "数据分析/BI"
    assert updated["education_required"] == "本科及以上"


def test_txt_file_preview(tmp_path, monkeypatch):
    client = TestClient(_load_app(tmp_path, monkeypatch))
    content = "产品经理实习生\n负责需求分析和用户调研，本科及以上。".encode("utf-8")
    response = client.post(
        "/api/jobs/import/file/preview",
        files={"file": ("job.txt", content, "text/plain")},
    )
    assert response.status_code == 200
    assert response.json()["jobs"][0]["job_category"] == "产品/AI产品"
