"""JD 解析模块：用 LLM 从岗位描述中提取结构化信息。"""

import json
from modules.llm_client import call_llm, load_prompt


def parse_jd(jd_text: str, page_title: str = "", apply_url: str = "", source_domain: str = "") -> dict:
    """解析 JD 文本，返回结构化字段。解析失败时返回带错误标记的 dict。"""
    template = load_prompt("jd_parser_prompt.txt")
    if not template:
        return {"error": "未找到 jd_parser_prompt.txt"}

    prompt = template.format(
        page_title=page_title or "未知",
        url=apply_url or "未知",
        source_domain=source_domain or "未知",
        clip_text=jd_text[:3000],
    )

    raw = call_llm(prompt, temperature=0.1)
    if raw.startswith("⚠️"):
        return {"error": raw}

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())
    except Exception:
        return {"error": "JSON 解析失败", "raw": raw[:500]}
