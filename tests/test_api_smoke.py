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
