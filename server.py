"""InternPilot FastAPI 服务器：提供静态前端 + 全部 API 接口。"""

import json
import re
from pathlib import Path
from html.parser import HTMLParser
from typing import Any, Dict, Generator, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

from modules.clip_parser import clip_to_job_data, parse_clip_json
from modules.config import get_allowed_origins, get_app_mode
from modules.db import (
    add_education,
    add_experience,
    update_experience,
    update_job,
    add_generated_output,
    add_job,
    add_job_from_clip,
    add_resume,
    delete_education,
    delete_experience,
    delete_job,
    delete_resume,
    get_all_education,
    get_all_experiences,
    get_all_jobs,
    get_all_resumes,
    get_dashboard_stats,
    get_generated_outputs,
    get_job_analysis,
    get_job_by_id,
    find_job_by_duplicate_hash,
    get_profile,
    get_resume_by_id,
    init_db,
    update_resume_content,
    update_resume_name,
    update_job_match_result,
    update_job_parsed_fields,
    update_job_status,
    replace_job_skills,
    save_profile,
)
from modules.job_importer import (
    extract_file_text,
    preview_text_jobs,
    preview_url_job,
)
from modules.job_structurer import structure_job
from modules.interview_generator import generate_interview_prep
from modules.jd_parser import parse_jd
from modules.llm_client import is_llm_configured
from modules.matcher import calculate_match_score, calculate_resume_match_score
from modules.resume_generator import generate_resume_bullets

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="InternPilot", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
init_db()

# ── 静态文件 ────────────────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
    return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-store"})


@app.get("/health")
def health():
    return {"status": "ok", "mode": get_app_mode()}


@app.get("/{filename}.jsx")
def serve_jsx(filename: str):
    path = STATIC_DIR / f"{filename}.jsx"
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(path, media_type="text/plain", headers={"Cache-Control": "no-store"})


class _HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: List[str] = []

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self.parts.append(text)


def _html_to_text(html: str) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(html or "")
    return re.sub(r"\s+", " ", "\n".join(parser.parts)).strip()


def _resume_summary(resume: Dict[str, Any]) -> Dict[str, Any]:
    parsed = resume.get("parsed_text") or ""
    html = resume.get("html_content") or ""
    return {
        **resume,
        "html_content": html if resume.get("file_type") == "html" else "",
        "parsed_text_preview": parsed[:600],
        "parsed_text_length": len(parsed),
    }


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
    seeking_type: str = ""


class ExperienceIn(BaseModel):
    title: str
    type: str = ""
    role: str = ""
    duration: str = ""
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
    structured_json: str = ""
    city_normalized: str = ""
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_unit: str = ""
    education_required: str = ""
    experience_required: str = ""
    job_category: str = ""
    category_confidence: Optional[float] = None
    category_source: str = ""
    duplicate_hash: str = ""
    source_platform: str = ""


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


class ResumeRenameIn(BaseModel):
    name: str


class ResumeHtmlIn(BaseModel):
    html_content: str


class OptimizeResumeIn(BaseModel):
    resume_id: int
    job_id: int
    exp_ids: List[int] = []
    html_content: str = ""
    new_name: str = ""


class ParseJDIn(BaseModel):
    jd_text: str
    page_title: str = ""
    apply_url: str = ""
    source_domain: str = ""


class ParseTextIn(BaseModel):
    text: str


class UrlPreviewIn(BaseModel):
    url: str


class ImportCommitIn(BaseModel):
    jobs: List[Dict[str, Any]]
    allow_duplicates: bool = False


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


@app.patch("/api/experiences/{exp_id}")
def api_update_experience(exp_id: int, data: ExperienceIn):
    update_experience(exp_id, data.model_dump())
    return {"ok": True}


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


@app.post("/api/resume/upload")
async def api_resume_upload(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in (".pdf", ".docx", ".doc", ".txt"):
        raise HTTPException(400, detail="仅支持 .pdf、.docx、.txt 格式")
    content = await file.read()
    try:
        if suffix == ".txt":
            text = content.decode("utf-8", errors="ignore")
        elif suffix == ".pdf":
            import io
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(p.extract_text() or "" for p in reader.pages)
        else:
            import io
            from docx import Document
            doc = Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise HTTPException(400, detail=f"文件解析失败：{e}")
    if not text.strip():
        raise HTTPException(400, detail="文件内容为空或无法提取文字（PDF 可能是扫描版）")
    return {"text": text[:8000]}


@app.post("/api/resume/parse")
def api_parse_resume(data: ParseTextIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    from modules.llm_client import call_llm, load_prompt
    template = load_prompt("resume_import_prompt.txt")
    prompt = template.format(resume_text=data.text[:6000])
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
    structured = structure_job(data.model_dump())
    duplicate = find_job_by_duplicate_hash(structured["duplicate_hash"])
    if duplicate:
        raise HTTPException(409, detail={"message": "岗位已存在", "job_id": duplicate["id"]})
    job_id = add_job(structured)
    replace_job_skills(job_id, structured.pop("skill_rows", []))
    return {"id": job_id}


@app.delete("/api/jobs/{job_id}")
def api_delete_job(job_id: int):
    delete_job(job_id)
    return {"ok": True}


@app.patch("/api/jobs/{job_id}")
def api_update_job(job_id: int, data: JobIn):
    existing = get_job_by_id(job_id)
    if not existing:
        raise HTTPException(404, detail="岗位不存在")
    structured = structure_job({**existing, **data.model_dump(exclude_unset=True)})
    skill_rows = structured.pop("skill_rows", [])
    update_job(job_id, structured)
    replace_job_skills(job_id, skill_rows)
    return {"ok": True}


@app.patch("/api/jobs/{job_id}/status")
def api_update_status(job_id: int, data: StatusIn):
    try:
        update_job_status(job_id, data.status)
    except ValueError as exc:
        raise HTTPException(404, detail=str(exc))
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
        job_data = structure_job(clip_to_job_data(clip_data))
        duplicate = find_job_by_duplicate_hash(job_data["duplicate_hash"])
        if duplicate:
            raise HTTPException(409, detail={"message": "岗位已存在", "job_id": duplicate["id"]})
        job_id = add_job(job_data)
        replace_job_skills(job_id, job_data.pop("skill_rows", []))
        return {"id": job_id, "title": job_data["title"]}
    except ValueError as e:
        raise HTTPException(400, detail=str(e))


def _mark_preview_duplicates(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result = []
    for job in jobs:
        duplicate = find_job_by_duplicate_hash(job.get("duplicate_hash", ""))
        result.append({
            **job,
            "duplicate_of": (
                {"id": duplicate["id"], "company": duplicate.get("company"), "title": duplicate.get("title")}
                if duplicate else None
            ),
        })
    return result


@app.post("/api/jobs/import/text/preview")
def api_preview_job_text(data: ParseTextIn):
    try:
        return {"jobs": _mark_preview_duplicates(preview_text_jobs(data.text))}
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc))


@app.post("/api/jobs/import/file/preview")
async def api_preview_job_file(file: UploadFile = File(...)):
    try:
        text = extract_file_text(file.filename or "", await file.read())
        return {"jobs": _mark_preview_duplicates(preview_text_jobs(text, source="file"))}
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(400, detail=f"文件解析失败：{exc}")


@app.post("/api/jobs/import/url/preview")
def api_preview_job_url(data: UrlPreviewIn):
    try:
        return {"jobs": _mark_preview_duplicates([preview_url_job(data.url)])}
    except (ValueError, httpx.HTTPError) as exc:
        raise HTTPException(400, detail=str(exc))


@app.post("/api/jobs/import/commit")
def api_commit_job_import(data: ImportCommitIn):
    if not data.jobs:
        raise HTTPException(400, detail="没有可保存的岗位")
    if len(data.jobs) > 20:
        raise HTTPException(400, detail="单次最多保存 20 个岗位")
    created = []
    duplicates = []
    for raw_job in data.jobs:
        structured = structure_job(raw_job)
        if not (structured.get("title") or "").strip():
            raise HTTPException(400, detail="岗位名称不能为空")
        duplicate = find_job_by_duplicate_hash(structured["duplicate_hash"])
        if duplicate and not data.allow_duplicates:
            duplicates.append({"incoming": structured.get("title"), "existing_id": duplicate["id"]})
            continue
        skill_rows = structured.pop("skill_rows", [])
        job_id = add_job(structured)
        replace_job_skills(job_id, skill_rows)
        created.append({"id": job_id, "title": structured.get("title")})
    return {"created": created, "duplicates": duplicates}


@app.get("/api/jobs/{job_id}/analysis")
def api_get_job_analysis(job_id: int):
    analysis = get_job_analysis(job_id)
    if not analysis:
        raise HTTPException(404, detail="岗位不存在")
    return analysis


@app.post("/api/jobs/match-scores")
def api_match_scores():
    """快速匹配：只计算分数，不调 LLM，用于经历变动后自动触发。"""
    profile = get_profile()
    if not profile:
        return {"updated": 0}
    experiences = get_all_experiences()
    if not experiences:
        return {"updated": 0}
    education = get_all_education()
    jobs = get_all_jobs()
    for job in jobs:
        score = calculate_match_score(job, profile, experiences, education)
        existing_reason = job.get("recommendation_reason") or ""
        update_job_match_result(job["id"], score, existing_reason)
    return {"updated": len(jobs)}


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


# ── Resume Library ───────────────────────────────────────────────────────────

@app.get("/api/resumes")
def api_get_resumes():
    return [_resume_summary(r) for r in get_all_resumes()]


@app.post("/api/resumes")
async def api_upload_resume(file: UploadFile = File(...), name: str = Form("")):
    filename = file.filename or "resume"
    suffix = Path(filename).suffix.lower().lstrip(".")
    if suffix not in {"html", "htm", "pdf"}:
        raise HTTPException(400, detail="仅支持上传 HTML 或 PDF 简历")

    raw = await file.read()
    display_name = (name or Path(filename).stem or "未命名简历").strip()

    if suffix in {"html", "htm"}:
        html = raw.decode("utf-8", errors="ignore")
        parsed_text = _html_to_text(html)
        file_type = "html"
    else:
        try:
            from pypdf import PdfReader
            import io

            reader = PdfReader(io.BytesIO(raw))
            parsed_text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except Exception as exc:
            raise HTTPException(400, detail=f"PDF 解析失败：{exc}")
        html = ""
        file_type = "pdf"

    resume_id = add_resume({
        "name": display_name,
        "original_filename": filename,
        "file_type": file_type,
        "html_content": html,
        "parsed_text": parsed_text,
    })
    return {"id": resume_id}


@app.get("/api/resumes/{resume_id}")
def api_get_resume(resume_id: int):
    resume = get_resume_by_id(resume_id)
    if not resume:
        raise HTTPException(404, detail="简历不存在")
    return resume


@app.patch("/api/resumes/{resume_id}/name")
def api_rename_resume(resume_id: int, data: ResumeRenameIn):
    name = data.name.strip()
    if not name:
        raise HTTPException(400, detail="简历名称不能为空")
    update_resume_name(resume_id, name)
    return {"ok": True}


@app.patch("/api/resumes/{resume_id}/html")
def api_update_resume_html(resume_id: int, data: ResumeHtmlIn):
    resume = get_resume_by_id(resume_id)
    if not resume:
        raise HTTPException(404, detail="简历不存在")
    update_resume_content(resume_id, data.html_content, _html_to_text(data.html_content))
    return {"ok": True}


@app.delete("/api/resumes/{resume_id}")
def api_delete_resume(resume_id: int):
    delete_resume(resume_id)
    return {"ok": True}


@app.get("/api/resumes/match-scores")
def api_resume_match_scores(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(404, detail="岗位不存在")
    return [
        {
            "resume_id": resume["id"],
            "name": resume["name"],
            "file_type": resume.get("file_type"),
            "match_score": calculate_resume_match_score(job, resume),
        }
        for resume in get_all_resumes()
    ]


# ── JD 解析 ───────────────────────────────────────────────────────────────────

@app.post("/api/jd/parse")
def api_parse_jd(data: ParseJDIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    result = parse_jd(data.jd_text, data.page_title, data.apply_url, data.source_domain)
    return result


@app.post("/api/jd/parse/stream")
def api_parse_jd_stream(data: ParseJDIn):
    """流式解析 JD，供插件使用。边生成边返回 token，最后一帧含完整 JSON。"""
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    from modules.llm_client import get_llm_config, load_prompt
    from openai import OpenAI

    template = load_prompt("jd_parser_prompt.txt")
    prompt = template.format(
        page_title=data.page_title or "未知",
        url=data.apply_url or "未知",
        source_domain=data.source_domain or "未知",
        clip_text=data.jd_text[:4000],
    )
    config = get_llm_config()
    kwargs: Dict[str, Any] = {"api_key": config["api_key"]}
    if config["base_url"]:
        kwargs["base_url"] = config["base_url"]
    client = OpenAI(**kwargs)

    def generate() -> Generator[str, None, None]:
        full = ""
        try:
            stream = client.chat.completions.create(
                model=config["model"],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    full += delta
                    yield f"data: {json.dumps({'chunk': delta}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            yield "data: [DONE]\n\n"
            return
        # 最后一帧发完整解析结果
        try:
            cleaned = full.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            parsed = json.loads(cleaned.strip())
        except Exception:
            parsed = {"error": "JSON解析失败", "raw": full[:200]}
        yield f"data: {json.dumps({'done': True, 'result': parsed}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })


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
        structured = structure_job(job, result)
        skill_rows = structured.pop("skill_rows", [])
        update_job(job_id, structured)
        replace_job_skills(job_id, skill_rows)
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


@app.post("/api/generate/resume/stream")
def api_generate_resume_stream(data: GenerateIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    job = get_job_by_id(data.job_id)
    if not job:
        raise HTTPException(404, detail="岗位不存在")
    all_exp = get_all_experiences()
    experiences = [e for e in all_exp if e["id"] in data.exp_ids] if data.exp_ids else all_exp
    if not experiences:
        raise HTTPException(400, detail="未选择任何经历")

    from modules.llm_client import get_llm_config, load_prompt
    from modules.resume_generator import _format_experiences
    from modules.db import get_profile
    from openai import OpenAI

    config = get_llm_config()
    kwargs: Dict[str, Any] = {"api_key": config["api_key"]}
    if config["base_url"]:
        kwargs["base_url"] = config["base_url"]
    client = OpenAI(**kwargs)

    profile = get_profile() or {}
    seeking_type = profile.get("seeking_type") or "未指定"
    template = load_prompt("resume_prompt.txt")
    prompt = template.format(
        company=job.get("company") or "未知公司",
        title=job.get("title") or "未知岗位",
        skills=job.get("skills") or "未指定",
        role_type=job.get("role_type") or "未知方向",
        seeking_type=seeking_type,
        jd_text=(job.get("jd_text") or "")[:2000],
        experiences=_format_experiences(experiences),
    )

    def generate() -> Generator[str, None, None]:
        full = ""
        try:
            stream = client.chat.completions.create(
                model=config["model"],
                messages=[
                    {"role": "system", "content": "你是专业的简历优化助手，只根据用户提供的信息作答，不编造数据。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    full += delta
                    yield f"data: {json.dumps({'content': delta}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)}, ensure_ascii=False)}\n\n"
        if full:
            add_generated_output(data.job_id, "resume_bullet", full)
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })


@app.post("/api/generate/resume-html")
def api_generate_resume_html(data: OptimizeResumeIn):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    resume = get_resume_by_id(data.resume_id)
    if not resume:
        raise HTTPException(404, detail="简历不存在")
    if resume.get("file_type") != "html" and not data.html_content.strip():
        raise HTTPException(400, detail="请选择 HTML 简历，PDF 简历仅支持解析和匹配")
    job = get_job_by_id(data.job_id)
    if not job:
        raise HTTPException(404, detail="岗位不存在")

    all_exp = get_all_experiences()
    experiences = [e for e in all_exp if e["id"] in data.exp_ids] if data.exp_ids else all_exp

    from modules.llm_client import call_llm, load_prompt
    from modules.resume_generator import _format_experiences

    resume_html = data.html_content.strip() or resume.get("html_content", "")
    template = load_prompt("resume_html_optimize_prompt.txt")
    prompt = template.format(
        company=job.get("company") or "未知公司",
        title=job.get("title") or "未知岗位",
        role_type=job.get("role_type") or "未知方向",
        skills=job.get("skills") or "未指定",
        jd_text=(job.get("jd_text") or "")[:3000],
        resume_text=(resume.get("parsed_text") or _html_to_text(resume_html))[:5000],
        experiences=_format_experiences(experiences) if experiences else "未选择额外经历",
        resume_html=resume_html[:12000],
    )
    html = call_llm(prompt, temperature=0.25)
    if html.startswith("⚠️"):
        raise HTTPException(500, detail=html)
    html = html.strip()
    if html.startswith("```"):
        html = html.strip("`")
        if html.lower().startswith("html"):
            html = html[4:].strip()

    new_id = add_resume({
        "name": data.new_name.strip() or f"{resume.get('name') or '简历'} - {job.get('company') or ''}{job.get('title') or '优化版'}",
        "original_filename": "",
        "file_type": "html",
        "html_content": html,
        "parsed_text": _html_to_text(html),
        "source_resume_id": data.resume_id,
    })
    add_generated_output(data.job_id, "resume_html", html)
    return {"id": new_id, "html_content": html}


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


@app.get("/api/generate/history/{job_id}")
def api_generate_history(job_id: int, output_type: str = ""):
    outputs = get_generated_outputs(job_id)
    if output_type:
        outputs = [o for o in outputs if o.get("output_type") == output_type]
    return outputs


@app.post("/api/experiences/{exp_id}/extract-keywords")
def api_extract_keywords(exp_id: int):
    if not is_llm_configured():
        raise HTTPException(400, detail="未配置 API Key")
    from modules.db import get_connection
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM experience_blocks WHERE id=?", (exp_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(404, detail="经历不存在")
    exp = dict(row)
    text = " ".join(filter(None, [exp.get("title",""), exp.get("background",""), exp.get("methods",""), exp.get("results",""), exp.get("tools","")]))
    if not text.strip():
        raise HTTPException(400, detail="经历内容为空，无法提取")
    from modules.llm_client import call_llm
    prompt = f"""从以下经历描述中提取最能代表该经历的技能关键词（10个以内），英文逗号分隔，直接输出关键词，不要解释：

{text[:1500]}"""
    result = call_llm(prompt, temperature=0.1)
    if result.startswith("⚠️"):
        raise HTTPException(500, detail=result)
    # 同时写入数据库
    update_experience(exp_id, {**exp, "keywords": result.strip()})
    return {"keywords": result.strip()}


@app.get("/api/llm/status")
def api_llm_status():
    return {"configured": is_llm_configured()}
