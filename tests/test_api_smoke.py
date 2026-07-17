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
    experience = client.post(
        "/api/experiences",
        json={"title": "数据分析项目", "keywords": "SQL", "tools": "Python"},
    )
    assert experience.status_code == 200
    explanation = client.get(f"/api/jobs/{job.json()['id']}/match-explanation")
    assert explanation.status_code == 200
    assert {"skills", "experience", "requirements", "location"} == set(explanation.json()["scores"])
    rematched = client.post(f"/api/jobs/{job.json()['id']}/match")
    assert rematched.status_code == 200
    assert rematched.json()["score"] >= 0
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


def test_browser_url_preview_task_api(tmp_path, monkeypatch):
    client = TestClient(_load_app(tmp_path, monkeypatch))
    server = sys.modules["server"]
    url = "https://www.zhipin.com/job_detail/example.html?securityId=test"
    job = {
        "title": "数据分析实习生",
        "company": "示例公司",
        "jd_text": "职位描述：熟悉 Python 和 SQL",
        "duplicate_hash": "browser-preview-test",
    }

    monkeypatch.setattr(server, "start_browser_preview_task", lambda value: "task-1")
    monkeypatch.setattr(
        server,
        "get_browser_preview_task",
        lambda task_id: {"status": "done", "message": "完成", "job": job},
    )

    started = client.post("/api/jobs/import/browser/start", json={"url": url})
    assert started.status_code == 202
    assert started.json()["task_id"] == "task-1"

    completed = client.get("/api/jobs/import/browser/task-1")
    assert completed.status_code == 200
    assert completed.json()["status"] == "done"
    assert completed.json()["jobs"][0]["title"] == "数据分析实习生"


def test_category_review_train_and_predict_api(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_MODEL_DIR", str(tmp_path / "models"))
    client = TestClient(_load_app(tmp_path, monkeypatch))
    jobs = [
        ("数据分析实习生", "熟悉 Python 和 SQL，完成数据看板", "数据分析/BI"),
        ("商业分析实习生", "使用 Excel SQL 开展业务分析", "数据分析/BI"),
        ("产品经理实习生", "负责用户调研、需求分析和原型设计", "产品/AI产品"),
        ("AI 产品实习生", "参与大模型产品需求评审", "产品/AI产品"),
    ]
    job_ids = []
    for title, jd_text, category in jobs:
        created = client.post("/api/jobs", json={"title": title, "jd_text": jd_text})
        assert created.status_code == 200
        job_id = created.json()["id"]
        job_ids.append(job_id)
        reviewed = client.post(
            f"/api/jobs/{job_id}/category-label",
            json={"category": category, "reviewer_note": "test"},
        )
        assert reviewed.status_code == 200

    queue = client.get("/api/jobs/categories/review")
    assert queue.status_code == 200
    assert len(queue.json()["jobs"]) == 4

    trained = client.post("/api/models/job-category/train", json={"include_weak_labels": False})
    assert trained.status_code == 200
    assert trained.json()["manual_sample_count"] == 4
    assert trained.json()["metrics"]["evaluated"] is False

    predicted = client.post(f"/api/jobs/{job_ids[-1]}/predict-category")
    assert predicted.status_code == 200
    analysis = client.get(f"/api/jobs/{job_ids[-1]}/analysis").json()
    assert analysis["job"]["category_source"] == "manual"
    assert analysis["predictions"][0]["prediction_type"] == "job_category"


def test_category_label_accepts_open_taxonomy_values(tmp_path, monkeypatch):
    client = TestClient(_load_app(tmp_path, monkeypatch))
    job = client.post("/api/jobs", json={"title": "量化研究实习生", "jd_text": "构建金融因子"})
    assert job.status_code == 200

    labeled = client.post(
        f"/api/jobs/{job.json()['id']}/category-label",
        json={"category": "量化研究/金融工程", "reviewer_note": "新 taxonomy 示例"},
    )
    assert labeled.status_code == 200
    queue = client.get("/api/jobs/categories/review").json()
    assert queue["category_mode"] == "open_taxonomy"
    assert "量化研究/金融工程" in queue["categories"]


def test_taxonomy_merge_is_confirmed_and_keeps_history(tmp_path, monkeypatch):
    client = TestClient(_load_app(tmp_path, monkeypatch))
    job = client.post("/api/jobs", json={"title": "数据分析实习生", "jd_text": "SQL 数据分析"}).json()
    labeled = client.post(
        f"/api/jobs/{job['id']}/category-label",
        json={"category": "商业数据分析", "reviewer_note": "taxonomy test"},
    )
    assert labeled.status_code == 200

    merged = client.post(
        "/api/taxonomy/merge",
        json={"source_category": "商业数据分析", "target_category": "数据分析", "reason": "合并近义类别"},
    )
    assert merged.status_code == 200
    assert merged.json()["affected_jobs"] == 1
    analysis = client.get(f"/api/jobs/{job['id']}/analysis").json()
    assert analysis["job"]["job_category"] == "数据分析"
    assert analysis["job"]["category_source"] == "taxonomy_merge"
    taxonomy = client.get("/api/taxonomy").json()
    assert taxonomy["history"][0]["previous_category"] == "商业数据分析"
