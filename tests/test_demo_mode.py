import importlib


def test_demo_mode_uses_isolated_seeded_database_and_disables_llm(tmp_path, monkeypatch):
    monkeypatch.setenv("APP_MODE", "demo")
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "demo.db"))
    monkeypatch.setenv("OPENAI_API_KEY", "should-not-be-used")

    import modules.db as db
    import modules.llm_client as llm_client

    importlib.reload(db)
    importlib.reload(llm_client)
    db.init_db()

    assert len(db.get_all_jobs()) == 12
    assert len(db.get_all_experiences()) == 2
    assert db.get_profile()["notes"] == "匿名示例资料，仅用于产品演示。"
    assert llm_client.is_llm_configured() is False
    assert "Demo 模式" in llm_client.call_llm("hello")
