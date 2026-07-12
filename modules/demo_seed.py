"""匿名 Demo 数据：仅在 APP_MODE=demo 且数据库为空时写入。"""

from __future__ import annotations

from modules import db
from modules.job_structurer import structure_job
from modules.matcher import calculate_match_explanation


DEMO_PROFILE = {
    "target_roles": "数据分析,产品经理,AI产品",
    "target_locations": "上海,杭州,远程",
    "preferred_industries": "互联网,AI,企业服务",
    "seeking_type": "实习",
    "notes": "匿名示例资料，仅用于产品演示。",
}

DEMO_EDUCATION = {
    "degree": "本科",
    "school": "示例大学",
    "major": "信息管理与信息系统",
    "graduation_year": "2027",
}

DEMO_EXPERIENCES = [
    {
        "title": "电商经营分析项目",
        "type": "项目",
        "background": "对匿名订单样例进行经营分析。",
        "methods": "SQL 清洗、漏斗拆解和指标看板设计。",
        "tools": "Python,SQL,Excel,Power BI",
        "results": "形成可复用的经营指标口径。",
        "keywords": "Python,SQL,数据分析,数据可视化,业务分析",
    },
    {
        "title": "校园产品调研",
        "type": "项目",
        "background": "围绕学习工具的需求开展匿名访谈。",
        "methods": "用户访谈、问卷分析、原型迭代。",
        "tools": "Figma,Excel",
        "results": "沉淀需求优先级和原型方案。",
        "keywords": "用户研究,需求分析,产品设计,Figma",
    },
]

DEMO_JOBS = [
    ("星图数据", "数据分析实习生", "上海", "负责业务指标分析、SQL 数据提取和 Power BI 看板搭建，熟悉 Python、SQL、Excel。", "已投递"),
    ("云帆科技", "商业分析实习生", "杭州", "分析用户转化漏斗，使用 SQL、Python 制作数据报告，支持增长策略。", "笔试"),
    ("蓝海智能", "AI 产品实习生", "上海", "参与大模型产品需求调研、用户场景分析和原型设计，熟悉 Figma。", "感兴趣"),
    ("远见软件", "产品经理实习生", "远程", "协助需求拆解、竞品分析和用户访谈，输出 PRD 与原型。", "一面"),
    ("极光实验室", "算法工程实习生", "杭州", "参与机器学习模型训练与评估，熟悉 Python、PyTorch、特征工程。", "未查看"),
    ("云端服务", "后端开发实习生", "上海", "使用 Python 和 SQL 开发服务端接口，参与数据库设计与性能优化。", "未查看"),
    ("像素工坊", "前端开发实习生", "杭州", "使用 React、JavaScript 和 CSS 完成数据看板前端开发。", "感兴趣"),
    ("增长引擎", "用户运营实习生", "上海", "负责用户分层、活动复盘和内容运营，使用 Excel 进行效果分析。", "已投递"),
    ("调研事务所", "用户研究实习生", "远程", "执行用户访谈、可用性测试和问卷分析，沉淀研究报告。", "二面"),
    ("行业咨询", "咨询项目实习生", "上海", "参与行业研究、数据整理、客户访谈和项目汇报材料制作。", "未查看"),
    ("数据商业", "数据产品实习生", "杭州", "负责数据需求分析、指标体系设计和 BI 看板规划，熟悉 SQL。", "Offer"),
    ("智联市场", "市场策略实习生", "上海", "支持市场调研、竞品追踪、活动复盘和增长策略分析。", "放弃"),
]


def seed_demo_data() -> bool:
    """返回是否首次写入种子；绝不覆盖已有 Demo 数据。"""
    if db.get_all_jobs() or db.get_all_experiences() or db.get_profile():
        return False

    db.save_profile(DEMO_PROFILE)
    db.add_education(DEMO_EDUCATION)
    for experience in DEMO_EXPERIENCES:
        db.add_experience(experience)

    for company, title, location, jd_text, status in DEMO_JOBS:
        structured = structure_job({
            "company": company,
            "title": title,
            "location": location,
            "jd_text": jd_text,
            "raw_clip_text": jd_text,
            "source": "demo_seed",
            "source_platform": "匿名示例",
            "status": status,
            "recommendation_reason": "匿名 Demo 岗位，仅用于展示分析与匹配流程。",
        })
        skill_rows = structured.pop("skill_rows", [])
        job_id = db.add_job(structured)
        db.replace_job_skills(job_id, skill_rows)

    profile = db.get_profile() or {}
    experiences = db.get_all_experiences()
    education = db.get_all_education()
    for job in db.get_all_jobs():
        explanation = calculate_match_explanation(job, profile, experiences, education)
        db.update_job_match_result(job["id"], explanation["score"], explanation["evidence_note"])
    return True
