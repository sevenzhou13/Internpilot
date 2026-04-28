"""数据库访问层：所有 SQLite 读写操作集中在此文件。"""

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).parent.parent / "data" / "internpilot.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """初始化数据库，创建所有表（幂等）。"""
    conn = get_connection()
    try:
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
        """)
        conn.commit()
        # 迁移：profile 加求职类型；experience_blocks 加职务和时间
        for col in ["seeking_type TEXT"]:
            try:
                conn.execute(f"ALTER TABLE profile ADD COLUMN {col}")
                conn.commit()
            except Exception:
                pass
        for col in ["role TEXT", "duration TEXT"]:
            try:
                conn.execute(f"ALTER TABLE experience_blocks ADD COLUMN {col}")
                conn.commit()
            except Exception:
                pass
    finally:
        conn.close()


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
                internship_duration, available_start_date, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("target_roles", ""),
                data.get("target_locations", ""),
                data.get("preferred_industries", ""),
                data.get("excluded_roles", ""),
                data.get("internship_duration", ""),
                data.get("available_start_date", ""),
                data.get("notes", ""),
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
    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO jobs
               (company, title, location, role_type, source, jd_text, raw_clip_text,
                source_domain, apply_url, publish_date, deadline, skills,
                status, match_score, recommendation_reason, clipped_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("company", ""),
                data.get("title", ""),
                data.get("location", ""),
                data.get("role_type", ""),
                data.get("source", "manual"),
                data.get("jd_text", ""),
                data.get("raw_clip_text", ""),
                data.get("source_domain", ""),
                data.get("apply_url", ""),
                data.get("publish_date", ""),
                data.get("deadline", ""),
                data.get("skills", ""),
                data.get("status", "未查看"),
                data.get("match_score"),
                data.get("recommendation_reason", ""),
                data.get("clipped_at", ""),
                _now(),
                _now(),
            ),
        )
        conn.commit()
        return cur.lastrowid
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
        conn.execute(
            "UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?",
            (status, _now(), job_id),
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
            """UPDATE jobs SET company=?, title=?, location=?, role_type=?, skills=?, jd_text=?, apply_url=?, updated_at=?
               WHERE id=?""",
            (data.get("company",""), data.get("title",""), data.get("location",""),
             data.get("role_type",""), data.get("skills",""), data.get("jd_text",""),
             data.get("apply_url",""), _now(), job_id),
        )
        conn.commit()
    finally:
        conn.close()


def delete_job(job_id: int) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
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
