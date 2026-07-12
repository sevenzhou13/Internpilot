"""本地岗位与投递数据的可解释聚合分析。"""

from collections import Counter
from typing import Dict

from modules import db
from modules.matcher import collect_user_keywords, split_text


def _top(counter: Counter, limit: int = 8) -> list[Dict]:
    return [{"name": name, "count": count} for name, count in counter.most_common(limit) if name]


def get_analytics_overview() -> Dict:
    jobs = db.get_all_jobs()
    experiences = db.get_all_experiences()
    education = db.get_all_education()
    user_keywords = collect_user_keywords(experiences, education)
    skill_counts = Counter()
    for job in jobs:
        skill_counts.update(skill.strip() for skill in split_text(job.get("skills", "")) if skill.strip())

    normalized_keywords = set(user_keywords)
    gaps = Counter({skill: count for skill, count in skill_counts.items() if skill.lower() not in normalized_keywords})
    total_jobs = len(jobs)
    return {
        "total_jobs": total_jobs,
        "categories": _top(Counter(job.get("job_category") or "未分类" for job in jobs)),
        "sources": _top(Counter(job.get("source_platform") or job.get("source") or "未知" for job in jobs)),
        "funnel": _top(Counter(job.get("status") or "未查看" for job in jobs)),
        "top_skills": _top(skill_counts),
        "skill_gaps": _top(gaps),
        "data_quality": {
            "jobs_with_jd": sum(bool((job.get("jd_text") or job.get("raw_clip_text") or "").strip()) for job in jobs),
            "jobs_with_skills": sum(bool((job.get("skills") or "").strip()) for job in jobs),
            "jobs_with_category": sum(bool((job.get("job_category") or "").strip()) for job in jobs),
            "job_count": total_jobs,
        },
    }
