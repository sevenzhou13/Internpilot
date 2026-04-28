"""面试准备生成模块。"""

from modules.llm_client import call_llm, load_prompt
from modules.resume_generator import _format_experiences


def generate_interview_prep(job: dict, experiences: list[dict]) -> str:
    template = load_prompt("interview_prompt.txt")
    if not template:
        return "⚠️ 未找到 interview_prompt.txt，请检查 prompts/ 目录。"

    prompt = template.format(
        company=job.get("company") or "未知公司",
        title=job.get("title") or "未知岗位",
        role_type=job.get("role_type") or "未知方向",
        jd_text=(job.get("jd_text") or "")[:2000],
        experiences=_format_experiences(experiences),
    )
    return call_llm(prompt, temperature=0.4)
