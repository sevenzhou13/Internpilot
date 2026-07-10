import sqlite3

from modules import db


def test_init_db_is_idempotent_and_uses_configured_path(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(db_path))

    db.init_db()
    db.init_db()

    with sqlite3.connect(db_path) as conn:
        version = conn.execute("SELECT MAX(version) FROM schema_migrations").fetchone()[0]
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
    assert version == db.SCHEMA_VERSION
    assert {"profile", "experience_blocks", "jobs", "resumes"}.issubset(tables)


def test_legacy_database_is_backed_up_before_migration(tmp_path, monkeypatch):
    db_path = tmp_path / "legacy.db"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE profile (id INTEGER PRIMARY KEY, target_roles TEXT)")
        conn.execute("INSERT INTO profile (target_roles) VALUES ('数据分析')")
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(db_path))

    db.init_db()

    backups = list((tmp_path / "backups").glob("legacy_before_v*.db"))
    assert len(backups) == 1
    with sqlite3.connect(db_path) as conn:
        columns = {row[1] for row in conn.execute("PRAGMA table_info(profile)")}
    assert {"seeking_type", "major", "school", "education_level"}.issubset(columns)


def test_profile_round_trip_preserves_extended_fields(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "profile.db"))
    db.init_db()
    payload = {
        "target_roles": "数据分析,AI产品",
        "target_locations": "上海",
        "preferred_industries": "互联网",
        "major": "数据科学",
        "school": "示例大学",
        "education_level": "硕士",
        "seeking_type": "实习",
    }

    db.save_profile(payload)
    result = db.get_profile()

    for key, value in payload.items():
        assert result[key] == value


def test_job_skills_and_status_events_are_persisted(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "jobs.db"))
    db.init_db()
    job_id = db.add_job({
        "title": "数据分析实习生",
        "status": "未查看",
        "duplicate_hash": "abc123",
    })
    db.replace_job_skills(job_id, [
        {"skill_name": "Python", "skill_type": "工具", "importance_score": 1.0},
        {"skill_name": "SQL", "skill_type": "工具", "importance_score": 0.9},
    ])
    db.update_job_status(job_id, "待投递")

    assert db.find_job_by_duplicate_hash("abc123")["id"] == job_id
    assert [row["skill_name"] for row in db.get_job_skills(job_id)] == ["Python", "SQL"]
    events = list(reversed(db.get_application_events(job_id)))
    assert [(row["from_status"], row["to_status"]) for row in events] == [
        (None, "未查看"),
        ("未查看", "待投递"),
    ]
