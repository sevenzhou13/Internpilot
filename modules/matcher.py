"""岗位匹配算法：基于关键词和规则计算岗位-用户匹配度。"""

import re


def split_text(text: str) -> list:
    if not text:
        return []
    return [x.strip() for x in text.replace("，", ",").split(",") if x.strip()]


def _extract_tokens(text: str) -> list:
    """从自由文本中提取中文词组（2-8字）和英文词汇（3+字）。"""
    if not text:
        return []
    tokens = re.findall(r'[一-龥]{2,8}|[a-zA-Z][a-zA-Z0-9+#._]{2,}', text)
    return list(set(t.strip() for t in tokens if t.strip()))


def _extract_section(text: str, section_names: list[str]) -> str:
    """从结构化 JD 中抽取指定段落，如【岗位要求】。"""
    if not text:
        return ""

    names = "|".join(re.escape(name) for name in section_names)
    heading_pattern = rf"(?:【\s*(?:{names})\s*】|(?:{names})[：:])"
    match = re.search(heading_pattern, text)
    if not match:
        return ""

    rest = text[match.end():]
    next_heading = re.search(r"(?:【[^】]{2,20}】|^[^\n]{2,20}[：:])", rest, re.MULTILINE)
    return rest[:next_heading.start()].strip() if next_heading else rest.strip()


def extract_requirement_text(job: dict) -> str:
    """优先抽取岗位要求/任职要求段落；没有结构化段落时返回空字符串。"""
    jd_text = job.get("jd_text", "") or job.get("raw_clip_text", "") or ""
    return _extract_section(
        jd_text,
        ["岗位要求", "任职要求", "职位要求", "任职资格", "候选人要求", "加分项"],
    )


def _exp_full_text(exp: dict) -> str:
    """拼接经历的所有文本字段。"""
    return " ".join(filter(None, [
        exp.get("keywords", ""), exp.get("tools", ""),
        exp.get("title", ""), exp.get("background", ""),
        exp.get("methods", ""), exp.get("results", ""),
        exp.get("raw_bullet", ""),
    ]))


def collect_user_keywords(experiences: list, education: list = None) -> list:
    keywords: list = []
    for exp in experiences:
        explicit = split_text(exp.get("keywords", "")) + split_text(exp.get("tools", ""))
        if explicit:
            keywords.extend(explicit)
        else:
            # 无明确关键词时从全文提取兜底
            keywords.extend(_extract_tokens(_exp_full_text(exp))[:20])
    for edu in (education or []):
        for field in ("major", "school"):
            val = (edu.get(field) or "").strip()
            if val:
                keywords.append(val)
    return list(set(k.lower() for k in keywords if k))


def calculate_location_score(job_location: str, target_locations: list) -> float:
    if not job_location:
        return 50.0
    if not target_locations:
        return 50.0
    loc_lower = job_location.lower()
    if "不限" in loc_lower or "远程" in loc_lower:
        return 80.0
    for loc in target_locations:
        if loc in job_location or loc.lower() in loc_lower:
            return 100.0
    return 15.0


def calculate_skill_score(job_skills: list, user_keywords: list) -> float:
    if not job_skills:
        return 50.0
    if not user_keywords:
        return 0.0
    matched = 0
    for skill in job_skills:
        sl = skill.lower().strip()
        for kw in user_keywords:
            if sl in kw or kw in sl:
                matched += 1
                break
    return min(100.0, matched / len(job_skills) * 100)


def calculate_experience_score(jd_text: str, experiences: list) -> float:
    """双向匹配：经历关键词→JD 文本 + JD 文本→经历全文。"""
    if not jd_text or not experiences:
        return 0.0
    jd_lower = jd_text.lower()
    jd_tokens = _extract_tokens(jd_text)

    scores = []
    for exp in experiences:
        exp_text = _exp_full_text(exp)
        if not exp_text.strip():
            continue
        exp_lower = exp_text.lower()

        # 方向1：经历关键词/工具 → JD 文本（精确匹配）
        kws = split_text(exp.get("keywords", "")) + split_text(exp.get("tools", ""))
        if not kws:
            kws = _extract_tokens(exp_text)[:15]

        score1 = 0.0
        if kws:
            matched = sum(1 for k in kws if k.lower() in jd_lower)
            score1 = matched / len(kws) * 100

        # 方向2：JD 提取词 → 经历全文（捕捉语义重叠）
        score2 = 0.0
        if jd_tokens:
            matched2 = sum(1 for t in jd_tokens if t.lower() in exp_lower)
            score2 = matched2 / len(jd_tokens) * 100

        scores.append(score1 * 0.6 + score2 * 0.4)

    return round(max(scores), 1) if scores else 0.0


def calculate_requirement_score(requirement_text: str, experiences: list, user_keywords: list) -> float:
    """单独评估岗位要求，避免硬性要求被完整 JD 文本稀释。"""
    if not requirement_text:
        return 50.0

    exp_score = calculate_experience_score(requirement_text, experiences)
    if not user_keywords:
        return exp_score

    req_lower = requirement_text.lower()
    matched = sum(1 for kw in user_keywords if kw and kw in req_lower)
    keyword_score = min(100.0, matched / max(len(user_keywords), 1) * 100)
    return round(exp_score * 0.65 + keyword_score * 0.35, 1)


def calculate_resume_match_score(job: dict, resume: dict) -> float:
    """计算单份简历与岗位的匹配度。"""
    resume_text = resume.get("parsed_text", "") or resume.get("html_content", "") or ""
    if not resume_text:
        return 0.0

    resume_exp = {
        "title": resume.get("name", "简历"),
        "keywords": "",
        "tools": "",
        "background": resume_text,
        "methods": "",
        "results": "",
        "raw_bullet": "",
    }
    resume_keywords = [k.lower() for k in _extract_tokens(resume_text)[:80]]
    job_skills = split_text(job.get("skills", ""))
    jd_text = job.get("jd_text", "") or job.get("raw_clip_text", "") or ""
    requirement_text = extract_requirement_text(job)

    skill_score = calculate_skill_score(job_skills, resume_keywords)
    experience_score = calculate_experience_score(jd_text, [resume_exp])
    requirement_score = calculate_requirement_score(requirement_text, [resume_exp], resume_keywords)

    return round(skill_score * 0.35 + experience_score * 0.35 + requirement_score * 0.30, 1)


def calculate_match_score(job: dict, profile: dict, experiences: list, education: list = None) -> float:
    """综合加权匹配分（0-100）。"""
    target_locations = split_text(profile.get("target_locations", ""))
    user_keywords = collect_user_keywords(experiences, education)
    job_skills = split_text(job.get("skills", ""))
    jd_text = job.get("jd_text", "") or job.get("raw_clip_text", "") or ""
    requirement_text = extract_requirement_text(job)

    skill_score = calculate_skill_score(job_skills, user_keywords)
    experience_score = calculate_experience_score(jd_text, experiences)
    requirement_score = calculate_requirement_score(requirement_text, experiences, user_keywords)
    location_score = calculate_location_score(job.get("location", ""), target_locations)

    final = (
        skill_score * 0.35
        + experience_score * 0.30
        + requirement_score * 0.25
        + location_score * 0.10
    )
    return round(final, 1)


def calculate_match_explanation(
    job: dict, profile: dict, experiences: list, education: list = None
) -> dict:
    """返回规则匹配的分项证据，供 UI 和后续 RAG 提示词使用。"""
    user_keywords = collect_user_keywords(experiences, education)
    job_skills = split_text(job.get("skills", ""))
    matched_skills = []
    missing_skills = []
    for skill in job_skills:
        normalized = skill.lower().strip()
        if any(normalized in keyword or keyword in normalized for keyword in user_keywords):
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    jd_text = job.get("jd_text", "") or job.get("raw_clip_text", "") or ""
    requirement_text = extract_requirement_text(job)
    scores = {
        "skills": calculate_skill_score(job_skills, user_keywords),
        "experience": calculate_experience_score(jd_text, experiences),
        "requirements": calculate_requirement_score(requirement_text, experiences, user_keywords),
        "location": calculate_location_score(
            job.get("location", ""), split_text(profile.get("target_locations", ""))
        ),
    }
    score = round(
        scores["skills"] * 0.35
        + scores["experience"] * 0.30
        + scores["requirements"] * 0.25
        + scores["location"] * 0.10,
        1,
    )
    return {
        "score": score,
        "label": get_match_label(score)[0],
        "scores": scores,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "requirement_text": requirement_text[:800],
        "evidence_note": "分数为可解释规则结果；能力短板不代表无法投递。",
    }


def get_match_label(score: float) -> tuple:
    if score >= 85:
        return "强烈推荐", "🌟"
    if score >= 70:
        return "推荐", "✅"
    if score >= 55:
        return "谨慎推荐", "⚠️"
    return "暂不优先", "❌"
