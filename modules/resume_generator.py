"""简历 bullet 生成模块。"""

from modules.llm_client import call_llm, load_prompt


def _format_experiences(experiences: list[dict]) -> str:
    lines = []
    for exp in experiences:
        lines.append(f"【{exp.get('title', '')} · {exp.get('type', '')}】")
        if exp.get("background"):
            lines.append(f"  背景：{exp['background']}")
        if exp.get("methods"):
            lines.append(f"  方法：{exp['methods']}")
        if exp.get("tools"):
            lines.append(f"  工具：{exp['tools']}")
        if exp.get("results"):
            lines.append(f"  结果：{exp['results']}")
        if exp.get("keywords"):
            lines.append(f"  关键词：{exp['keywords']}")
        lines.append("")
    return "\n".join(lines)


def generate_resume_bullets(job: dict, experiences: list[dict]) -> str:
    template = load_prompt("resume_prompt.txt")
    if not template:
        return "⚠️ 未找到 resume_prompt.txt，请检查 prompts/ 目录。"

    prompt = template.format(
        company=job.get("company") or "未知公司",
        title=job.get("title") or "未知岗位",
        role_type=job.get("role_type") or "未知方向",
        jd_text=(job.get("jd_text") or "")[:2000],
        experiences=_format_experiences(experiences),
    )
    return call_llm(prompt, temperature=0.3)
