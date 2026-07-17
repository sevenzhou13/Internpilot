import socket
import time

import pytest

import modules.browser_job_importer as browser_importer


BOSS_URL = "https://www.zhipin.com/job_detail/example.html?securityId=test"


@pytest.fixture(autouse=True)
def clear_browser_tasks():
    with browser_importer._tasks_lock:
        browser_importer._tasks.clear()
    yield
    with browser_importer._tasks_lock:
        for task in browser_importer._tasks.values():
            task["cancel_event"].set()
        browser_importer._tasks.clear()


def test_browser_import_url_rejects_private_targets(monkeypatch):
    def fake_getaddrinfo(host, port):
        address = "10.0.0.8" if host == "private.example" else "93.184.216.34"
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, port))]

    monkeypatch.setattr(browser_importer.socket, "getaddrinfo", fake_getaddrinfo)

    assert browser_importer.validate_browser_import_url(BOSS_URL) == BOSS_URL
    assert browser_importer.is_browser_import_url(BOSS_URL)
    assert browser_importer.validate_browser_import_url("https://careers.example/jobs/123")

    for invalid in (
        "file:///etc/passwd",
        "http://localhost:8000/internal",
        "https://service.local/jobs/1",
        "https://127.0.0.1/job_detail/example.html",
        "https://private.example/jobs/1",
    ):
        with pytest.raises(ValueError):
            browser_importer.validate_browser_import_url(invalid)


def test_job_page_detection_rejects_challenge_and_accepts_jd():
    assert not browser_importer._looks_like_job_page("请稍候 - BOSS直聘", "正在加载" * 100)
    text = "职位描述\n负责数据分析和指标体系建设。\n任职要求\n熟悉 Python 和 SQL。" * 10
    assert browser_importer._looks_like_job_page("数据分析实习生 - BOSS直聘", text)


def test_browser_preview_task_completes_without_playwright(monkeypatch):
    expected = {"title": "数据分析实习生", "jd_text": "职位描述：熟悉 Python 和 SQL"}

    def fake_preview(url, cancel_event, update):
        assert url == BOSS_URL
        assert not cancel_event.is_set()
        update("extracting", "正在提取")
        return expected

    monkeypatch.setattr(browser_importer, "_browser_preview_job", fake_preview)
    task_id = browser_importer.start_browser_preview_task(BOSS_URL)

    deadline = time.time() + 2
    task = browser_importer.get_browser_preview_task(task_id)
    while task["status"] not in browser_importer.FINAL_TASK_STATES and time.time() < deadline:
        time.sleep(0.01)
        task = browser_importer.get_browser_preview_task(task_id)

    assert task["status"] == "done"
    assert task["job"] == expected
    assert "cancel_event" not in task
