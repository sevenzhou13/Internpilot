"""数据库访问层：所有 SQLite 读写操作集中在此文件。"""

import shutil
import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from modules.config import get_app_mode, get_database_path


SCHEMA_VERSION = 4


def _db_path() -> Path:
    return get_database_path()


def get_connection() -> sqlite3.Connection:
    db_path = _db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def _table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}


def _add_column_if_missing(
    conn: sqlite3.Connection, table: str, column: str, definition: str
) -> None:
    if column not in _table_columns(conn, table):
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def _current_schema_version(conn: sqlite3.Connection) -> int:
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
    )
    row = conn.execute("SELECT MAX(version) AS version FROM schema_migrations").fetchone()
    return int(row["version"] or 0)


def _backup_legacy_database() -> Optional[Path]:
    db_path = _db_path()
    if not db_path.exists() or db_path.stat().st_size == 0:
        return None
    backup_dir = db_path.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"{db_path.stem}_before_v{SCHEMA_VERSION}_{timestamp}{db_path.suffix}"
    shutil.copy2(db_path, backup_path)
    return backup_path


def _migration_v1(conn: sqlite3.Connection) -> None:
    conn.executescript("""
            CREATE TABLE IF NOT EXISTS profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_roles TEXT,
                target_locations TEXT,
                preferred_industries TEXT,
                excluded_roles TEXT,
                internship_duration TEXT,
                available_start_date TEXT,
                notes TEXT,
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS experience_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT,
                background TEXT,
                methods TEXT,
                tools TEXT,
                results TEXT,
                keywords TEXT,
                target_roles TEXT,
                raw_bullet TEXT,
                optimized_bullet TEXT,
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT,
                title TEXT NOT NULL,
                location TEXT,
                role_type TEXT,
                source TEXT,
                jd_text TEXT,
                raw_clip_text TEXT,
                source_domain TEXT,
                apply_url TEXT,
                publish_date TEXT,
                deadline TEXT,
                skills TEXT,
                status TEXT DEFAULT '未查看',
                match_score REAL,
                recommendation_reason TEXT,
                clipped_at TEXT,
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS interview_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT,
                role_type TEXT,
                source TEXT,
                content TEXT,
                summary TEXT,
                questions TEXT,
                skills_tested TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS generated_outputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER,
                output_type TEXT,
                content TEXT,
                created_at TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );

            CREATE TABLE IF NOT EXISTS education (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                degree TEXT,
                school TEXT,
                major TEXT,
                graduation_year TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                original_filename TEXT,
                file_type TEXT,
                html_content TEXT,
                parsed_text TEXT,
                source_resume_id INTEGER,
                created_at TEXT,
                updated_at TEXT
            );
        """)
    for column in ("seeking_type", "major", "school", "education_level"):
        _add_column_if_missing(conn, "profile", column, "TEXT")
    for column in ("role", "duration"):
        _add_column_if_missing(conn, "experience_blocks", column, "TEXT")


def _migration_v2(conn: sqlite3.Connection) -> None:
    job_columns = {
        "structured_json": "TEXT",
        "city_normalized": "TEXT",
        "salary_min": "REAL",
        "salary_max": "REAL",
        "salary_unit": "TEXT",
        "education_required": "TEXT",
        "experience_required": "TEXT",
        "job_category": "TEXT",
        "category_confidence": "REAL",
        "category_source": "TEXT",
        "duplicate_hash": "TEXT",
        "source_platform": "TEXT",
    }
    for column, definition in job_columns.items():
        _add_column_if_missing(conn, "jobs", column, definition)

    conn.executescript("""
        CREATE TABLE IF NOT EXISTS job_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            skill_type TEXT,
            importance_score REAL DEFAULT 1.0,
            source TEXT,
            created_at TEXT,
            UNIQUE(job_id, skill_name),
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS application_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            from_status TEXT,
            to_status TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            next_action_date TEXT,
            feedback TEXT,
            user_rating REAL,
            notes TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS model_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            model_name TEXT NOT NULL,
            model_version TEXT,
            prediction_type TEXT NOT NULL,
            prediction_value TEXT,
            confidence REAL,
            explanation_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_type TEXT NOT NULL,
            source_id INTEGER,
            related_job_id INTEGER,
            chunk_text TEXT NOT NULL,
            content_hash TEXT NOT NULL UNIQUE,
            vector_id INTEGER,
            embedding_model TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (related_job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_jobs_duplicate_hash ON jobs(duplicate_hash);
        CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(job_category);
        CREATE INDEX IF NOT EXISTS idx_job_skills_job ON job_skills(job_id);
        CREATE INDEX IF NOT EXISTS idx_application_events_job_time
            ON application_events(job_id, occurred_at);
        CREATE INDEX IF NOT EXISTS idx_predictions_job_type
            ON model_predictions(job_id, prediction_type, created_at);
        CREATE INDEX IF NOT EXISTS idx_chunks_job_type
            ON knowledge_chunks(related_job_id, doc_type);
    """)


def _migration_v3(conn: sqlite3.Connection) -> None:
    """保存岗位大类人工复核标签，供分类模型训练使用。"""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS job_category_labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL UNIQUE,
            category TEXT NOT NULL,
            label_source TEXT NOT NULL DEFAULT 'manual',
            reviewer_note TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_category_labels_category
            ON job_category_labels(category);
    """)


def _migration_v4(conn: sqlite3.Connection) -> None:
    """记录用户确认的 taxonomy 合并，避免历史口径丢失。"""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS job_category_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            previous_category TEXT NOT NULL,
            new_category TEXT NOT NULL,
            change_source TEXT NOT NULL,
            reason TEXT,
            changed_at TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_category_history_job_time
            ON job_category_history(job_id, changed_at DESC);
    """)


MIGRATIONS = {1: _migration_v1, 2: _migration_v2, 3: _migration_v3, 4: _migration_v4}


def init_db() -> None:
    """初始化并按版本升级数据库；旧库升级前自动备份。"""
    db_path = _db_path()
    is_legacy = db_path.exists() and db_path.stat().st_size > 0
    conn = get_connection()
    try:
        current = _current_schema_version(conn)
        if current < SCHEMA_VERSION and is_legacy and current == 0:
            conn.close()
            _backup_legacy_database()
            conn = get_connection()
            current = _current_schema_version(conn)

        for version in range(current + 1, SCHEMA_VERSION + 1):
            migration = MIGRATIONS[version]
            with conn:
                migration(conn)
                conn.execute(
                    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                    (version, _now()),
                )
    finally:
        conn.close()

    if get_app_mode() == "demo":
        from modules.demo_seed import seed_demo_data

        seed_demo_data()


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


# ── Profile ────────────────────────────────────────────────────────────────

def get_profile() -> Optional[Dict]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM profile ORDER BY id DESC LIMIT 1").fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def save_profile(data: dict) -> None:
    """保存求职偏好（只保留一条，先清空再插入）。"""
    conn = get_connection()
    try:
        conn.execute("DELETE FROM profile")
        conn.execute(
            """INSERT INTO profile
               (target_roles, target_locations, preferred_industries, excluded_roles,
                internship_duration, available_start_date, notes, major, school,
                education_level, seeking_type, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("target_roles", ""),
                data.get("target_locations", ""),
                data.get("preferred_industries", ""),
                data.get("excluded_roles", ""),
                data.get("internship_duration", ""),
                data.get("available_start_date", ""),
                data.get("notes", ""),
                data.get("major", ""),
                data.get("school", ""),
                data.get("education_level", ""),
                data.get("seeking_type", ""),
                _now(),
                _now(),
            ),
        )
        conn.commit()
    finally:
        conn.close()


# ── Experience Blocks ──────────────────────────────────────────────────────

def add_experience(data: dict) -> int:
    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO experience_blocks
               (title, type, role, duration, background, methods, tools, results,
                keywords, target_roles, raw_bullet, optimized_bullet, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("title", ""),
                data.get("type", ""),
                data.get("role", ""),
                data.get("duration", ""),
                data.get("background", ""),
                data.get("methods", ""),
                data.get("tools", ""),
                data.get("results", ""),
                data.get("keywords", ""),
                data.get("target_roles", ""),
                data.get("raw_bullet", ""),
                data.get("optimized_bullet", ""),
                _now(),
                _now(),
            ),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def get_all_experiences() -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM experience_blocks ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def update_experience(experience_id: int, data: dict) -> None:
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE experience_blocks SET
               title=?, type=?, role=?, duration=?, background=?, methods=?, tools=?, results=?,
               keywords=?, target_roles=?, raw_bullet=?, updated_at=?
               WHERE id=?""",
            (data.get("title",""), data.get("type",""), data.get("role",""), data.get("duration",""),
             data.get("background",""), data.get("methods",""), data.get("tools",""), data.get("results",""),
             data.get("keywords",""), data.get("target_roles",""), data.get("raw_bullet",""),
             _now(), experience_id),
        )
        conn.commit()
    finally:
        conn.close()


def delete_experience(experience_id: int) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM experience_blocks WHERE id = ?", (experience_id,))
        conn.commit()
    finally:
        conn.close()


# ── Jobs ───────────────────────────────────────────────────────────────────

def add_job(data: dict) -> int:
    columns = [
        "company", "title", "location", "role_type", "source", "jd_text",
        "raw_clip_text", "source_domain", "apply_url", "publish_date", "deadline",
        "skills", "status", "match_score", "recommendation_reason", "clipped_at",
        "structured_json", "city_normalized", "salary_min", "salary_max", "salary_unit",
        "education_required", "experience_required", "job_category",
        "category_confidence", "category_source", "duplicate_hash", "source_platform",
        "created_at", "updated_at",
    ]
    values = [data.get(column) for column in columns[:-2]] + [_now(), _now()]
    defaults = {
        "source": "manual",
        "status": "未查看",
        "recommendation_reason": "",
        "structured_json": "",
        "category_source": "",
    }
    values = [
        defaults.get(column, "") if value is None and column in defaults else value
        for column, value in zip(columns, values)
    ]
    conn = get_connection()
    try:
        cur = conn.execute(
            f"INSERT INTO jobs ({', '.join(columns)}) VALUES ({', '.join('?' for _ in columns)})",
            values,
        )
        job_id = cur.lastrowid
        conn.execute(
            """INSERT INTO application_events
               (job_id, from_status, to_status, occurred_at, notes)
               VALUES (?, NULL, ?, ?, ?)""",
            (job_id, data.get("status", "未查看"), _now(), "岗位创建"),
        )
        conn.commit()
        return job_id
    finally:
        conn.close()


def get_all_jobs() -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM jobs ORDER BY match_score DESC NULLS LAST, created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_job_by_id(job_id: int) -> Optional[Dict]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_job_status(job_id: int, status: str) -> None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT status FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            raise ValueError("岗位不存在")
        old_status = row["status"] or ""
        conn.execute(
            "UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?",
            (status, _now(), job_id),
        )
        if old_status != status:
            conn.execute(
                """INSERT INTO application_events
                   (job_id, from_status, to_status, occurred_at)
                   VALUES (?, ?, ?, ?)""",
                (job_id, old_status, status, _now()),
            )
        conn.commit()
    finally:
        conn.close()


def update_job_match_result(
    job_id: int, match_score: float, recommendation_reason: str = ""
) -> None:
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE jobs SET match_score = ?, recommendation_reason = ?, updated_at = ? WHERE id = ?",
            (match_score, recommendation_reason, _now(), job_id),
        )
        conn.commit()
    finally:
        conn.close()


def update_job_parsed_fields(job_id: int, parsed: dict) -> None:
    """将 JD 解析结果写回 jobs 表。"""
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE jobs SET
               company = COALESCE(NULLIF(?, ''), company),
               title   = COALESCE(NULLIF(?, ''), title),
               location = COALESCE(NULLIF(?, ''), location),
               role_type = COALESCE(NULLIF(?, ''), role_type),
               skills = COALESCE(NULLIF(?, ''), skills),
               updated_at = ?
               WHERE id = ?""",
            (
                parsed.get("company", ""),
                parsed.get("title", ""),
                parsed.get("location", ""),
                parsed.get("role_type", ""),
                ",".join(parsed.get("skills", [])) if isinstance(parsed.get("skills"), list) else parsed.get("skills", ""),
                _now(),
                job_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def update_job(job_id: int, data: dict) -> None:
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE jobs SET company=?, title=?, location=?, role_type=?, skills=?, jd_text=?, apply_url=?,
               structured_json=?, city_normalized=?, salary_min=?, salary_max=?, salary_unit=?,
               education_required=?, experience_required=?, job_category=?, category_confidence=?,
               category_source=?, duplicate_hash=?, source_platform=?, updated_at=?
               WHERE id=?""",
            (data.get("company",""), data.get("title",""), data.get("location",""),
             data.get("role_type",""), data.get("skills",""), data.get("jd_text",""),
             data.get("apply_url",""), data.get("structured_json", ""),
             data.get("city_normalized", ""), data.get("salary_min"), data.get("salary_max"),
             data.get("salary_unit", ""), data.get("education_required", ""),
             data.get("experience_required", ""), data.get("job_category", ""),
             data.get("category_confidence"), data.get("category_source", ""),
             data.get("duplicate_hash", ""), data.get("source_platform", ""),
             _now(), job_id),
        )
        conn.commit()
    finally:
        conn.close()


def delete_job(job_id: int) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM generated_outputs WHERE job_id = ?", (job_id,))
        conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        conn.commit()
    finally:
        conn.close()


def find_job_by_duplicate_hash(duplicate_hash: str) -> Optional[Dict]:
    if not duplicate_hash:
        return None
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM jobs WHERE duplicate_hash = ? ORDER BY id LIMIT 1",
            (duplicate_hash,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def replace_job_skills(job_id: int, skills: List[Dict]) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM job_skills WHERE job_id = ?", (job_id,))
        for skill in skills:
            name = (skill.get("skill_name") or "").strip()
            if not name:
                continue
            conn.execute(
                """INSERT OR IGNORE INTO job_skills
                   (job_id, skill_name, skill_type, importance_score, source, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    job_id,
                    name,
                    skill.get("skill_type", ""),
                    float(skill.get("importance_score", 1.0)),
                    skill.get("source", "rule"),
                    _now(),
                ),
            )
        conn.commit()
    finally:
        conn.close()


def get_job_skills(job_id: int) -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM job_skills WHERE job_id = ? ORDER BY importance_score DESC, skill_name",
            (job_id,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_application_events(job_id: Optional[int] = None) -> List[Dict]:
    conn = get_connection()
    try:
        if job_id is None:
            rows = conn.execute(
                "SELECT * FROM application_events ORDER BY occurred_at DESC, id DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM application_events WHERE job_id = ? ORDER BY occurred_at DESC, id DESC",
                (job_id,),
            ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def add_model_prediction(data: dict) -> int:
    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO model_predictions
               (job_id, model_name, model_version, prediction_type, prediction_value,
                confidence, explanation_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data["job_id"], data["model_name"], data.get("model_version", ""),
                data["prediction_type"], data.get("prediction_value", ""),
                data.get("confidence"), data.get("explanation_json", ""), _now(),
            ),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def save_job_category_label(
    job_id: int,
    category: str,
    reviewer_note: str = "",
    label_source: str = "manual",
) -> None:
    """保存人工复核或已映射外部数据集标签。"""
    if label_source not in {"manual", "external_dataset", "llm_mapped"}:
        raise ValueError("类别标签来源必须是 manual、external_dataset 或 llm_mapped")
    conn = get_connection()
    try:
        exists = conn.execute("SELECT id FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not exists:
            raise ValueError("岗位不存在")
        now = _now()
        conn.execute(
            """INSERT INTO job_category_labels
               (job_id, category, label_source, reviewer_note, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(job_id) DO UPDATE SET
                 category=excluded.category,
                 label_source=excluded.label_source,
                 reviewer_note=excluded.reviewer_note,
                 updated_at=excluded.updated_at""",
            (job_id, category, label_source, reviewer_note, now, now),
        )
        conn.execute(
            """UPDATE jobs SET job_category = ?, category_confidence = 1.0,
               category_source = ?, updated_at = ? WHERE id = ?""",
            (category, label_source, now, job_id),
        )
        conn.commit()
    finally:
        conn.close()


def apply_model_job_category(
    job_id: int,
    category: str,
    confidence: float,
    category_source: str = "model",
) -> None:
    """写回模型建议，但绝不覆盖人工或已映射外部类别。"""
    if category_source not in {"model", "llm_bootstrap"}:
        raise ValueError("模型类别来源必须是 model 或 llm_bootstrap")
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE jobs SET job_category = ?, category_confidence = ?,
               category_source = ?, updated_at = ?
               WHERE id = ? AND COALESCE(category_source, '') NOT IN ('manual', 'external_dataset', 'llm_mapped', 'llm', 'taxonomy_merge')""",
            (category, confidence, category_source, _now(), job_id),
        )
        conn.commit()
    finally:
        conn.close()


def get_job_category_options(limit: int = 100) -> List[str]:
    """返回已实际使用过的类别，供自由 taxonomy 的输入建议使用。"""
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT category FROM (
                   SELECT job_category AS category, updated_at AS changed_at
                   FROM jobs WHERE TRIM(COALESCE(job_category, '')) != ''
                   UNION ALL
                   SELECT category, updated_at AS changed_at
                   FROM job_category_labels WHERE TRIM(COALESCE(category, '')) != ''
               )
               GROUP BY category
               ORDER BY MAX(changed_at) DESC, category ASC
               LIMIT ?""",
            (limit,),
        ).fetchall()
        return [str(row["category"]).strip() for row in rows]
    finally:
        conn.close()


def get_taxonomy_overview(limit: int = 100) -> Dict[str, List[Dict]]:
    """返回当前类别频数和最近的用户确认合并记录。"""
    conn = get_connection()
    try:
        categories = conn.execute(
            """SELECT job_category AS category, COUNT(*) AS count
               FROM jobs
               WHERE TRIM(COALESCE(job_category, '')) != ''
               GROUP BY job_category
               ORDER BY count DESC, category ASC
               LIMIT ?""",
            (limit,),
        ).fetchall()
        history = conn.execute(
            """SELECT job_id, previous_category, new_category, change_source, reason, changed_at
               FROM job_category_history
               ORDER BY changed_at DESC, id DESC
               LIMIT 20"""
        ).fetchall()
        return {"categories": [dict(row) for row in categories], "history": [dict(row) for row in history]}
    finally:
        conn.close()


def merge_job_categories(source_category: str, target_category: str, reason: str = "") -> int:
    """将类别合并为用户确认的 taxonomy 决定，并逐岗位保留变更历史。"""
    source = (source_category or "").strip()
    target = (target_category or "").strip()
    if not source or not target:
        raise ValueError("来源类别和目标类别不能为空")
    if source == target:
        raise ValueError("来源类别和目标类别不能相同")
    if len(source) > 60 or len(target) > 60:
        raise ValueError("岗位类别不能超过 60 个字符")

    conn = get_connection()
    try:
        rows = conn.execute("SELECT id FROM jobs WHERE job_category = ?", (source,)).fetchall()
        now = _now()
        for row in rows:
            conn.execute(
                """INSERT INTO job_category_history
                   (job_id, previous_category, new_category, change_source, reason, changed_at)
                   VALUES (?, ?, ?, 'taxonomy_merge', ?, ?)""",
                (row["id"], source, target, reason.strip(), now),
            )
        conn.execute(
            """UPDATE jobs SET job_category = ?, category_confidence = 1.0,
               category_source = 'taxonomy_merge', updated_at = ?
               WHERE job_category = ?""",
            (target, now, source),
        )
        conn.execute(
            """UPDATE job_category_labels SET category = ?, updated_at = ?
               WHERE category = ?""",
            (target, now, source),
        )
        conn.commit()
        return len(rows)
    finally:
        conn.close()


def get_job_category_training_samples(
    include_weak_labels: bool = True,
    include_llm_mapped: bool = False,
) -> List[Dict]:
    """返回训练样本；LLM 映射标签必须显式启用。"""
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT jobs.id AS job_id, jobs.title, jobs.jd_text, jobs.skills,
                      jobs.job_category AS rule_category, jobs.category_confidence,
                      labels.category AS manual_category, labels.label_source AS label_source,
                      labels.reviewer_note
               FROM jobs
               LEFT JOIN job_category_labels AS labels ON labels.job_id = jobs.id
               ORDER BY jobs.id"""
        ).fetchall()
    finally:
        conn.close()

    samples: List[Dict] = []
    for row in rows:
        item = dict(row)
        category = item.get("manual_category")
        source = item.get("label_source") or "manual"
        if category and source == "llm_mapped" and not include_llm_mapped:
            continue
        if not category and include_weak_labels:
            category = item.get("rule_category")
            source = "rule_weak"
        if not category:
            continue
        samples.append({
            "job_id": item["job_id"],
            "title": item.get("title") or "",
            "jd_text": item.get("jd_text") or "",
            "skills": item.get("skills") or "",
            "category": category,
            "label_source": source,
        })
    return samples


def get_job_category_review_queue(limit: int = 50) -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT jobs.id, jobs.company, jobs.title, jobs.job_category,
                      jobs.category_confidence, jobs.category_source, jobs.jd_text,
                      labels.category AS reviewed_category, labels.reviewer_note,
                      labels.updated_at AS reviewed_at
               FROM jobs
               LEFT JOIN job_category_labels AS labels ON labels.job_id = jobs.id
               ORDER BY CASE WHEN labels.id IS NULL THEN 0 ELSE 1 END,
                        jobs.category_confidence ASC, jobs.updated_at DESC
               LIMIT ?""",
            (max(1, min(limit, 1000)),),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_job_analysis(job_id: int) -> Optional[Dict]:
    job = get_job_by_id(job_id)
    if not job:
        return None
    conn = get_connection()
    try:
        predictions = conn.execute(
            """SELECT * FROM model_predictions WHERE job_id = ?
               ORDER BY created_at DESC, id DESC""",
            (job_id,),
        ).fetchall()
    finally:
        conn.close()
    return {
        "job": job,
        "skills": get_job_skills(job_id),
        "application_events": get_application_events(job_id),
        "predictions": [dict(row) for row in predictions],
    }


def replace_knowledge_chunks(doc_type: str, source_id: int, related_job_id: Optional[int], chunks: List[str]) -> int:
    """用最新切片替换一个源文档的本地知识索引。"""
    conn = get_connection()
    try:
        conn.execute("DELETE FROM knowledge_chunks WHERE doc_type = ? AND source_id = ?", (doc_type, source_id))
        count = 0
        for chunk in chunks:
            text = (chunk or "").strip()
            if not text:
                continue
            content_hash = hashlib.sha256(f"{doc_type}|{source_id}|{text}".encode("utf-8")).hexdigest()
            conn.execute(
                """INSERT OR IGNORE INTO knowledge_chunks
                   (doc_type, source_id, related_job_id, chunk_text, content_hash, embedding_model, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, 'tfidf-v1', ?, ?)""",
                (doc_type, source_id, related_job_id, text, content_hash, _now(), _now()),
            )
            count += 1
        conn.commit()
        return count
    finally:
        conn.close()


def get_knowledge_chunks() -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM knowledge_chunks ORDER BY doc_type, source_id, id").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


# ── Resume Library ─────────────────────────────────────────────────────────

def add_resume(data: dict) -> int:
    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO resumes
               (name, original_filename, file_type, html_content, parsed_text,
                source_resume_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("name", ""),
                data.get("original_filename", ""),
                data.get("file_type", ""),
                data.get("html_content", ""),
                data.get("parsed_text", ""),
                data.get("source_resume_id"),
                _now(),
                _now(),
            ),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def get_all_resumes() -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM resumes ORDER BY updated_at DESC, created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_resume_by_id(resume_id: int) -> Optional[Dict]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_resume_name(resume_id: int, name: str) -> None:
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE resumes SET name = ?, updated_at = ? WHERE id = ?",
            (name, _now(), resume_id),
        )
        conn.commit()
    finally:
        conn.close()


def update_resume_content(resume_id: int, html_content: str, parsed_text: str) -> None:
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE resumes SET html_content = ?, parsed_text = ?, file_type = 'html', updated_at = ? WHERE id = ?",
            (html_content, parsed_text, _now(), resume_id),
        )
        conn.commit()
    finally:
        conn.close()


def delete_resume(resume_id: int) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
        conn.commit()
    finally:
        conn.close()


def add_job_from_clip(clip_data: dict, parsed_data: Optional[Dict] = None) -> int:
    """从插件剪藏 JSON 新增岗位。"""
    selected = clip_data.get("selected_text", "")
    page = clip_data.get("page_text", "")
    raw_clip = selected.strip() or page.strip()

    job_data: Dict[str, Any] = {
        "company": parsed_data.get("company", "待解析") if parsed_data else "待解析",
        "title": parsed_data.get("title") or clip_data.get("page_title") or "待解析岗位",
        "location": parsed_data.get("location", "待解析") if parsed_data else "待解析",
        "role_type": parsed_data.get("role_type", "待解析") if parsed_data else "待解析",
        "source": "clipped",
        "jd_text": raw_clip,
        "raw_clip_text": raw_clip,
        "source_domain": clip_data.get("source_domain", ""),
        "apply_url": clip_data.get("url", ""),
        "skills": ",".join(parsed_data.get("skills", [])) if parsed_data and isinstance(parsed_data.get("skills"), list) else "",
        "status": "未查看",
        "clipped_at": clip_data.get("created_at", _now()),
    }
    return add_job(job_data)


# ── Generated Outputs ──────────────────────────────────────────────────────

def add_generated_output(job_id: Optional[int], output_type: str, content: str) -> int:
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO generated_outputs (job_id, output_type, content, created_at) VALUES (?, ?, ?, ?)",
            (job_id, output_type, content, _now()),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def get_generated_outputs(job_id: Optional[int] = None, limit: int = 20) -> List[Dict]:
    conn = get_connection()
    try:
        if job_id is not None:
            rows = conn.execute(
                "SELECT go.*, j.title as job_title, j.company FROM generated_outputs go "
                "LEFT JOIN jobs j ON go.job_id = j.id "
                "WHERE go.job_id = ? ORDER BY go.created_at DESC LIMIT ?",
                (job_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT go.*, j.title as job_title, j.company FROM generated_outputs go "
                "LEFT JOIN jobs j ON go.job_id = j.id "
                "ORDER BY go.created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ── Dashboard Stats ────────────────────────────────────────────────────────

def get_dashboard_stats() -> dict:
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        high_match = conn.execute(
            "SELECT COUNT(*) FROM jobs WHERE match_score >= 85"
        ).fetchone()[0]
        applied = conn.execute(
            "SELECT COUNT(*) FROM jobs WHERE status = '已投递'"
        ).fetchone()[0]
        interviewing = conn.execute(
            "SELECT COUNT(*) FROM jobs WHERE status IN ('一面','二面','HR面','面试中')"
        ).fetchone()[0]
        clipped_7d = conn.execute(
            "SELECT COUNT(*) FROM jobs WHERE source = 'clipped' AND created_at >= datetime('now', '-7 days')"
        ).fetchone()[0]
        return {
            "total": total,
            "high_match": high_match,
            "applied": applied,
            "interviewing": interviewing,
            "clipped_7d": clipped_7d,
        }
    finally:
        conn.close()


# ── Education ──────────────────────────────────────────────────────────────

def get_all_education() -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM education ORDER BY id ASC").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def add_education(data: dict) -> int:
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO education (degree, school, major, graduation_year, created_at) VALUES (?, ?, ?, ?, ?)",
            (data.get("degree", ""), data.get("school", ""), data.get("major", ""),
             data.get("graduation_year", ""), _now()),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def delete_education(edu_id: int) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM education WHERE id = ?", (edu_id,))
        conn.commit()
    finally:
        conn.close()
