"""InternPilot FastAPI 服务器：提供静态前端 + 全部 API 接口。"""

import json
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

from modules.clip_parser import clip_to_job_data, parse_clip_json
from modules.db import (
    add_education,
    add_experience,
    add_generated_output,
    add_job,
    add_job_from_clip,
    delete_education,
    delete_experience,
    delete_job,
    get_all_education,
    get_all_experiences,
    get_all_jobs,
    get_dashboard_stats,
    get_generated_outputs,
    get_job_by_id,
    get_profile,
    init_db,
    update_job_match_result,
    update_job_parsed_fields,
    update_job_status,
    save_profile,
)
from modules.interview_generator import generate_interview_prep
from modules.jd_parser import parse_jd
from modules.llm_client import is_llm_configured
from modules.matcher import calculate_match_score
from modules.resume_generator import generate_resume_bullets

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="InternPilot", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
init_db()

# ── 静态文件 ────────────────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
    return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-store"})


@app.get("/{filename}.jsx")
def serve_jsx(filename: str):
    path = STATIC_DIR / f"{filename}.jsx"
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(path, media_type="text/plain", headers={"Cache-Control": "no-store"})


# ── Pydantic 模型 ───────────────────────────────────────────────────────────

class ProfileIn(BaseModel):
    target_roles: str = ""
    target_locations: str = ""
    preferred_industries: str = ""
    excluded_roles: str = ""
    internship_duration: str = ""
    available_start_date: str = ""
    notes: str = ""
    major: str = ""
    school: str = ""
    education_level: str = ""


class ExperienceIn(BaseModel):
    title: str
    type: str = ""
    background: str = ""
    methods: str = ""
    tools: str = ""
    results: str = ""
    keywords: str = ""
    target_roles: str = ""
    raw_bullet: str = ""


class JobIn(BaseModel):
    company: str = ""
    title: str
    location: str = ""
    role_type: str = ""
    source: str = "manual"
    jd_text: str = ""
    apply_url: str = ""
    skills: str = ""


class ClipIn(BaseModel):
    raw_json: str


class StatusIn(BaseModel):
    status: str


class ApplyUrlIn(BaseModel):
    apply_url: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatIn(BaseModel):
    messages: List[ChatMessage]
    job_id: Optional[int] = None
    use_experiences: bool = True


class GenerateIn(BaseModel):
    job_id: int
    exp_ids: List[int] = []


class ParseJDIn(BaseModel):
    jd_text: str
    page_title: str = ""
    apply_url: str = ""
    source_domain: str = ""


class ParseTextIn(BaseModel):
    text: str


class EducationIn(BaseModel):
    degree: str = ""
    school: str = ""
    major: str = ""
    graduation_year: str = ""


# ── Profile ─────────────────────────────────────────────────────────────────

@app.get("/api/profile")
def api_get_profile():
    return get_profile() or {}


@app.post("/api/profile")
def api_save_profile(data: ProfileIn):
    save_profile(data.model_dump())
    return {"ok": True}


# ── Experiences ──────────────────────────────────────────────────────────────

@app.get("/api/experiences")
def api_get_experiences():
    return get_all_experiences()


@app.post("/api/experiences")
def api_add_experience(data: ExperienceIn):
    exp_id = add_experience(data.model_dump())
    return {"id": exp_id}


@app.delete("/api/experiences/{exp_id}")
def api_delete_experience(exp_id: int):
    delete_experience(exp_id)
    return {"ok": True}


@app.get("/api/education")
def api_get_education():
    return get_all_education()


@app.post("/api/education")
def api_add_education(data: EducationIn):
    edu_id = add_education(data.model_dump())
    return {"id": edu_id}


@app.delete("/api/education/{edu_id}")
def api_delete_education(edu_id: int):
    delete_education(edu_id)
    return {"ok": True}


@app.post("/api/experiences/parse-text")
def api_parse_experience_text(data: ParseTextIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    from modules.llm_client import call_llm, load_prompt
    template = load_prompt("experience_parse_prompt.txt")
    prompt = template.format(text=data.text[:3000])
    raw = call_llm(prompt, temperature=0.1)
    if raw.startswith("⚠️"):
        raise HTTPException(500, detail=raw)
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())
    except Exception:
        raise HTTPException(500, detail="解析失败，请重试")


# ── Jobs ─────────────────────────────────────────────────────────────────────

@app.get("/api/jobs")
def api_get_jobs():
    return get_all_jobs()


@app.post("/api/jobs")
def api_add_job(data: JobIn):
    job_id = add_job(data.model_dump())
    return {"id": job_id}


@app.delete("/api/jobs/{job_id}")
def api_delete_job(job_id: int):
    delete_job(job_id)
    return {"ok": True}


@app.patch("/api/jobs/{job_id}/status")
def api_update_status(job_id: int, data: StatusIn):
    update_job_status(job_id, data.status)
    return {"ok": True}


@app.patch("/api/jobs/{job_id}/apply-url")
def api_update_apply_url(job_id: int, data: ApplyUrlIn):
    from modules.db import get_connection
    from datetime import datetime, timezone
    conn = get_connection()
    try:
        conn.execute("UPDATE jobs SET apply_url=?, updated_at=? WHERE id=?", (data.apply_url, datetime.now(timezone.utc).isoformat(), job_id))
        conn.commit()
    finally:
        conn.close()
    return {"ok": True}


@app.post("/api/jobs/clip")
def api_import_clip(data: ClipIn):
    try:
        clip_data = parse_clip_json(data.raw_json)
        job_data = clip_to_job_data(clip_data)
        job_id = add_job(job_data)
        return {"id": job_id, "title": job_data["title"]}
    except ValueError as e:
        raise HTTPException(400, detail=str(e))


@app.post("/api/jobs/match-all")
def api_match_all():
    profile = get_profile()
    if not profile:
        raise HTTPException(400, detail="请先设置求职偏好")
    experiences = get_all_experiences()
    if not experiences:
        raise HTTPException(400, detail="请先录入个人经历")
    education = get_all_education()
    jobs = get_all_jobs()

    from modules.matcher import collect_user_keywords
    from modules.llm_client import call_llm, load_prompt, is_llm_configured

    user_keywords = collect_user_keywords(experiences, education)
    edu_str = "、".join(
        f"{e.get('degree','')} {e.get('school','')} {e.get('major','')}".strip()
        for e in education
    ) or "未填写"
    rec_template = load_prompt("recommendation_prompt.txt") if is_llm_configured() else ""

    for job in jobs:
        score = calculate_match_score(job, profile, experiences, education)
        reason = ""
        if rec_template:
            prompt = rec_template.format(
                company=job.get("company") or "未知",
                title=job.get("title") or "",
                role_type=job.get("role_type") or "",
                skills=job.get("skills") or "",
                jd_text=(job.get("jd_text") or "")[:500],
                user_keywords="、".join(user_keywords[:20]),
                education=edu_str,
            )
            reason = call_llm(prompt, temperature=0.3)
            if reason.startswith("⚠️"):
                reason = ""
        update_job_match_result(job["id"], score, reason)

    return {"updated": len(jobs)}


# ── JD 解析 ───────────────────────────────────────────────────────────────────

@app.post("/api/jd/parse")
def api_parse_jd(data: ParseJDIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    result = parse_jd(data.jd_text, data.page_title, data.apply_url, data.source_domain)
    return result


@app.post("/api/jobs/{job_id}/parse")
def api_parse_job_jd(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(404, detail="岗位不存在")
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    result = parse_jd(
        job.get("jd_text") or job.get("raw_clip_text") or "",
        page_title=job.get("title", ""),
        apply_url=job.get("apply_url", ""),
        source_domain=job.get("source_domain", ""),
    )
    if "error" not in result:
        update_job_parsed_fields(job_id, result)
    return result


# ── 生成 ─────────────────────────────────────────────────────────────────────

@app.post("/api/generate/resume")
def api_generate_resume(data: GenerateIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    job = get_job_by_id(data.job_id)
    if not job:
        raise HTTPException(404, detail="岗位不存在")
    all_exp = get_all_experiences()
    experiences = [e for e in all_exp if e["id"] in data.exp_ids] if data.exp_ids else all_exp
    if not experiences:
        raise HTTPException(400, detail="未选择任何经历")
    result = generate_resume_bullets(job, experiences)
    add_generated_output(data.job_id, "resume_bullet", result)
    return {"content": result}


@app.post("/api/generate/interview")
def api_generate_interview(data: GenerateIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    job = get_job_by_id(data.job_id)
    if not job:
        raise HTTPException(404, detail="岗位不存在")
    experiences = get_all_experiences()
    result = generate_interview_prep(job, experiences)
    add_generated_output(data.job_id, "interview_prep", result)
    return {"content": result}


# ── AI 聊天 ───────────────────────────────────────────────────────────────────

def _build_chat_context(data: ChatIn) -> list:
    from modules.llm_client import get_llm_config
    from modules.resume_generator import _format_experiences

    system_parts = [
        "你是一个专业的求职助手，只回答与求职、岗位、简历、面试相关的问题。",
        "回答要具体，基于提供的信息，不要编造数据。",
    ]
    if data.job_id:
        job = get_job_by_id(data.job_id)
        if job:
            system_parts.append(
                f"\n【当前目标岗位】\n公司：{job.get('company')}\n岗位：{job.get('title')}\n"
                f"方向：{job.get('role_type')}\nJD（前1500字）：\n{(job.get('jd_text') or '')[:1500]}"
            )
    if data.use_experiences:
        experiences = get_all_experiences()
        if experiences:
            system_parts.append(f"\n【用户个人经历】\n{_format_experiences(experiences)}")

    messages = [{"role": "system", "content": "\n".join(system_parts)}]
    messages += [{"role": m.role, "content": m.content} for m in data.messages[-20:]]
    return messages


@app.post("/api/chat")
def api_chat(data: ChatIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    from modules.llm_client import get_llm_config
    from openai import OpenAI

    config = get_llm_config()
    kwargs: Dict[str, Any] = {"api_key": config["api_key"]}
    if config["base_url"]:
        kwargs["base_url"] = config["base_url"]
    client = OpenAI(**kwargs)
    messages = _build_chat_context(data)
    try:
        resp = client.chat.completions.create(model=config["model"], messages=messages, temperature=0.5)
        return {"content": resp.choices[0].message.content or ""}
    except Exception as exc:
        raise HTTPException(500, detail=str(exc))


@app.post("/api/chat/stream")
def api_chat_stream(data: ChatIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    from modules.llm_client import get_llm_config
    from openai import OpenAI

    config = get_llm_config()
    kwargs: Dict[str, Any] = {"api_key": config["api_key"]}
    if config["base_url"]:
        kwargs["base_url"] = config["base_url"]
    client = OpenAI(**kwargs)
    messages = _build_chat_context(data)

    def generate() -> Generator[str, None, None]:
        try:
            stream = client.chat.completions.create(
                model=config["model"], messages=messages, temperature=0.5, stream=True
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {json.dumps({'content': delta}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/stats")
def api_dashboard_stats():
    stats = get_dashboard_stats()
    jobs = get_all_jobs()
    top_jobs = sorted(
        [j for j in jobs if j.get("match_score") is not None],
        key=lambda j: j["match_score"],
        reverse=True,
    )[:5]
    recent = get_generated_outputs(limit=5)
    return {"stats": stats, "top_jobs": top_jobs, "recent_outputs": recent}


@app.get("/api/llm/status")
def api_llm_status():
    return {"configured": is_llm_configured()}
