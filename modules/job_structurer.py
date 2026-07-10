"""岗位规则结构化、技能标准化和去重。"""

import hashlib
import json
import re
from typing import Any, Dict, Iterable
from urllib.parse import urlparse


ROLE_TYPES = ["数据分析", "AI产品", "产品经理", "用户研究", "其他"]
JOB_CATEGORIES = [
    "产品/AI产品",
    "数据分析/BI",
    "算法/机器学习",
    "后端开发",
    "前端/客户端",
    "用户研究",
    "市场/运营",
    "销售/咨询/项目管理",
]

SKILL_DICTIONARY: dict[str, tuple[str, tuple[str, ...]]] = {
    "Python": ("工具", ("python",)),
    "SQL": ("工具", ("sql", "mysql", "postgresql")),
    "Excel": ("工具", ("excel", "vlookup", "数据透视表")),
    "Pandas": ("工具", ("pandas",)),
    "NumPy": ("工具", ("numpy",)),
    "Scikit-learn": ("工具", ("scikit-learn", "sklearn")),
    "PyTorch": ("工具", ("pytorch", "torch")),
    "TensorFlow": ("工具", ("tensorflow",)),
    "Tableau": ("工具", ("tableau",)),
    "Power BI": ("工具", ("power bi", "powerbi")),
    "SPSS": ("工具", ("spss",)),
    "R": ("工具", (" r语言", "r 语言")),
    "Java": ("工具", ("java",)),
    "Go": ("工具", ("golang", "go语言")),
    "JavaScript": ("工具", ("javascript", "typescript")),
    "React": ("工具", ("react",)),
    "Vue": ("工具", ("vue",)),
    "Figma": ("工具", ("figma",)),
    "Axure": ("工具", ("axure",)),
    "数据分析": ("硬技能", ("数据分析", "指标分析", "业务分析")),
    "数据可视化": ("硬技能", ("数据可视化", "可视化看板", "数据看板")),
    "机器学习": ("硬技能", ("机器学习", "machine learning")),
    "深度学习": ("硬技能", ("深度学习", "deep learning")),
    "自然语言处理": ("硬技能", ("自然语言处理", "nlp")),
    "大语言模型": ("领域知识", ("大语言模型", "大模型", "llm", "aigc")),
    "A/B测试": ("硬技能", ("a/b测试", "ab测试", "a/b test")),
    "用户研究": ("硬技能", ("用户研究", "用户调研", "可用性测试")),
    "需求分析": ("硬技能", ("需求分析", "需求拆解")),
    "产品设计": ("硬技能", ("产品设计", "原型设计", "产品方案")),
    "沟通协作": ("软技能", ("沟通能力", "沟通协作", "团队协作")),
    "逻辑思维": ("软技能", ("逻辑思维", "逻辑能力")),
}

CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("算法/机器学习", ("算法", "机器学习", "深度学习", "大模型", "nlp", "计算机视觉")),
    ("数据分析/BI", ("数据分析", "商业分析", "业务分析", "数据运营", "bi工程")),
    ("用户研究", ("用户研究", "用户体验研究", "ux researcher", "用研")),
    ("产品/AI产品", ("ai产品", "产品经理", "产品实习", "产品运营")),
    ("后端开发", ("后端", "服务端", "java开发", "python开发", "go开发")),
    ("前端/客户端", ("前端", "客户端", "android", "ios", "web开发")),
    ("市场/运营", ("市场", "运营", "增长", "内容运营", "用户运营")),
    ("销售/咨询/项目管理", ("销售", "咨询", "项目管理", "客户成功", "商务")),
]


def _normalize(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_city(location: str) -> str:
    value = _normalize(location)
    for city in (
        "北京", "上海", "广州", "深圳", "杭州", "南京", "苏州", "成都", "武汉",
        "西安", "天津", "重庆", "长沙", "厦门", "合肥", "青岛", "远程",
    ):
        if city in value:
            return city
    return value[:30]


def parse_salary(text: str) -> tuple[float | None, float | None, str]:
    value = _normalize(text).lower().replace("，", ",")
    patterns = [
        (r"(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)\s*k", "千元/月", 1000),
        (r"(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)\s*万(?:元)?/月", "元/月", 10000),
        (r"(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)\s*(?:元)?/天", "元/天", 1),
        (r"(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)\s*(?:元)?/月", "元/月", 1),
    ]
    for pattern, unit, multiplier in patterns:
        match = re.search(pattern, value)
        if match:
            return (
                round(float(match.group(1)) * multiplier, 2),
                round(float(match.group(2)) * multiplier, 2),
                unit,
            )
    return None, None, ""


def extract_education(text: str) -> str:
    for label in ("博士", "硕士", "本科", "大专"):
        if re.search(rf"{label}(?:及以上|以上|优先|学历)?", text or "", re.I):
            return label + ("及以上" if "以上" in (text or "") else "")
    if "学历不限" in (text or "") or "不限学历" in (text or ""):
        return "不限"
    return ""


def extract_experience_requirement(text: str) -> str:
    value = text or ""
    match = re.search(r"(\d+)\s*[-~至]\s*(\d+)\s*年", value)
    if match:
        return f"{match.group(1)}-{match.group(2)}年"
    match = re.search(r"(\d+)\s*年(?:以上)?", value)
    if match:
        return f"{match.group(1)}年以上" if "以上" in match.group(0) else f"{match.group(1)}年"
    if "经验不限" in value or "无需经验" in value or "应届" in value:
        return "不限/应届"
    return ""


def extract_skills(text: str, explicit: Iterable[str] | str | None = None) -> list[Dict]:
    lower = f" {_normalize(text).lower()} "
    explicit_values: list[str] = []
    if isinstance(explicit, str):
        explicit_values = [x.strip() for x in re.split(r"[,，、]", explicit) if x.strip()]
    elif explicit:
        explicit_values = [str(x).strip() for x in explicit if str(x).strip()]

    result: dict[str, Dict] = {}
    for canonical, (skill_type, aliases) in SKILL_DICTIONARY.items():
        if any(alias.lower() in lower for alias in aliases):
            result[canonical.lower()] = {
                "skill_name": canonical,
                "skill_type": skill_type,
                "importance_score": 1.0,
                "source": "rule",
            }
    for name in explicit_values:
        key = name.lower()
        if key not in result:
            canonical = next(
                (item for item in SKILL_DICTIONARY if item.lower() == key), name
            )
            result[key] = {
                "skill_name": canonical,
                "skill_type": SKILL_DICTIONARY.get(canonical, ("未分类", ()))[0],
                "importance_score": 1.0,
                "source": "explicit",
            }
    return sorted(result.values(), key=lambda item: item["skill_name"].lower())


def infer_job_category(title: str, text: str) -> tuple[str, float]:
    haystack = f"{_normalize(title)} {_normalize(text)}".lower()
    scores: list[tuple[int, str]] = []
    for category, keywords in CATEGORY_RULES:
        score = sum(3 if keyword in (title or "").lower() else 1 for keyword in keywords if keyword in haystack)
        scores.append((score, category))
    score, category = max(scores, default=(0, ""))
    if score <= 0:
        return "", 0.0
    confidence = min(0.95, 0.55 + score * 0.08)
    return category, round(confidence, 3)


def infer_role_type(category: str, title: str) -> str:
    value = f"{category} {title}".lower()
    if "数据分析" in value or "bi" in value:
        return "数据分析"
    if "ai产品" in value or ("产品" in value and any(x in value for x in ("ai", "大模型", "人工智能"))):
        return "AI产品"
    if "产品" in value:
        return "产品经理"
    if "用户研究" in value or "用研" in value:
        return "用户研究"
    return "其他"


def infer_source_platform(url: str, source_domain: str = "") -> str:
    domain = (source_domain or urlparse(url or "").hostname or "").lower()
    mapping = {
        "zhipin.com": "BOSS直聘",
        "liepin.com": "猎聘",
        "lagou.com": "拉勾",
        "shixiseng.com": "实习僧",
        "linkedin.com": "LinkedIn",
    }
    return next((name for key, name in mapping.items() if key in domain), domain)


def compute_duplicate_hash(data: Dict) -> str:
    url = _normalize(data.get("apply_url", "")).lower().rstrip("/")
    if url:
        return hashlib.sha256(f"url|{url}".encode("utf-8")).hexdigest()
    parts = [
        _normalize(data.get("company", "")).lower(),
        _normalize(data.get("title", "")).lower(),
        normalize_city(data.get("location", "")).lower(),
    ]
    if not any(parts):
        parts.append(_normalize(data.get("jd_text", ""))[:1000].lower())
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def structure_job(data: Dict, parsed: Dict | None = None) -> Dict:
    parsed = parsed or {}
    raw_text = _normalize(data.get("jd_text") or data.get("raw_clip_text") or "")
    merged = {**data}
    for field in ("company", "title", "location", "role_type", "summary"):
        if parsed.get(field):
            merged[field] = parsed[field]

    explicit_skills = parsed.get("skills") or data.get("skills") or []
    skill_rows = extract_skills(raw_text, explicit_skills)
    salary_min, salary_max, salary_unit = parse_salary(raw_text)
    category, confidence = infer_job_category(merged.get("title", ""), raw_text)
    if not merged.get("role_type") or merged.get("role_type") in {"待解析", "其他"}:
        merged["role_type"] = infer_role_type(category, merged.get("title", ""))

    structured = {
        "summary": parsed.get("summary", ""),
        "responsibilities": parsed.get("responsibilities", []),
        "requirements": parsed.get("requirements", []),
        "risk_points": parsed.get("risk_points", []),
        "skills": skill_rows,
    }
    merged.update({
        "city_normalized": normalize_city(merged.get("location", "")),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_unit": salary_unit,
        "education_required": extract_education(raw_text),
        "experience_required": extract_experience_requirement(raw_text),
        "job_category": category,
        "category_confidence": confidence,
        "category_source": "rule" if category else "",
        "source_platform": infer_source_platform(
            merged.get("apply_url", ""), merged.get("source_domain", "")
        ),
        "structured_json": json.dumps(structured, ensure_ascii=False),
        "skills": ",".join(skill["skill_name"] for skill in skill_rows),
    })
    merged["duplicate_hash"] = compute_duplicate_hash(merged)
    merged["skill_rows"] = skill_rows
    return merged
