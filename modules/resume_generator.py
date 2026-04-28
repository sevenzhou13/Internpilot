"""简历 bullet 生成模块。"""

from modules.db import get_profile
from modules.llm_client import call_llm, load_prompt


def _format_experiences(experiences: list) -> str:
    lines = []
    for exp in experiences:
        header = exp.get("title", "")
        if exp.get("role"):
            header += f"  |  {exp['role']}"
        if exp.get("duration"):
            header += f"  |  {exp['duration']}"
        lines.append(f"【{header}】（{exp.get('type', '')}）")
        if exp.get("background"):
            lines.append(f"  背景：{exp['background']}")
        if exp.get("methods"):
            lines.append(f"  工作内容：{exp['methods']}")
        if exp.get("tools"):
            lines.append(f"  工具/技术：{exp['tools']}")
        if exp.get("results"):
            lines.append(f"  成果：{exp['results']}")
        if exp.get("keywords"):
            lines.append(f"  关键词：{exp['keywords']}")
        if exp.get("raw_bullet"):
            lines.append(f"  原始简历表述：{exp['raw_bullet']}")
        lines.append("")
    return "\n".join(lines)


def generate_resume_bullets(job: dict, experiences: list[dict]) -> str:
    template = load_prompt("resume_prompt.txt")
    if not template:
        return "⚠️ 未找到 resume_prompt.txt，请检查 prompts/ 目录。"

    profile = get_profile() or {}
    seeking_type = profile.get("seeking_type") or "未指定"

    prompt = template.format(
        company=job.get("company") or "未知公司",
        title=job.get("title") or "未知岗位",
        skills=job.get("skills") or "未指定",
        role_type=job.get("role_type") or "未知方向",
        seeking_type=seeking_type,
        jd_text=(job.get("jd_text") or "")[:2000],
        experiences=_format_experiences(experiences),
    )
    return call_llm(prompt, temperature=0.3)
