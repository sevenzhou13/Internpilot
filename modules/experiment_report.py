"""生成不含原始 JD 的课程数据挖掘实验摘要。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from modules.analytics import get_analytics_overview
from modules.job_clustering import cluster_jobs


def build_mining_experiment_report(max_clusters: int = 5) -> Dict[str, Any]:
    overview = get_analytics_overview()
    clustering = cluster_jobs(max_clusters=max_clusters)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "method": {
            "text_representation": "TF-IDF (1, 2)-gram, sublinear_tf=True",
            "clustering": "K-Means",
            "random_state": 42,
            "n_init": 10,
            "max_clusters": max_clusters,
        },
        "data_quality": overview["data_quality"],
        "descriptive_analysis": {
            "categories": overview["categories"],
            "sources": overview["sources"],
            "funnel": overview["funnel"],
            "top_skills": overview["top_skills"],
            "skill_gaps": overview["skill_gaps"],
        },
        "clustering": clustering,
        "limitations": [
            "本报告仅输出聚合统计和代表岗位标题，不导出原始 JD、个人经历或联系方式。",
            "技能短板表示岗位高频技能尚未在个人经历关键词中匹配，不等同于能力缺失。",
            "silhouette 用于比较当前样本中的候选簇数，不代表对未来岗位的泛化能力。",
        ],
    }


def render_markdown(report: Dict[str, Any]) -> str:
    quality = report["data_quality"]
    desc = report["descriptive_analysis"]
    clustering = report["clustering"]
    metrics = clustering["metrics"]

    def lines(items: list[Dict[str, Any]]) -> str:
        return "\n".join(f"- {item['name']}：{item['count']}" for item in items) or "- 无"

    cluster_lines = []
    for cluster in clustering["clusters"]:
        names = "、".join(job.get("title") or "未命名岗位" for job in cluster["jobs"][:3])
        cluster_lines.append(
            f"- 需求簇 {cluster['cluster_id'] + 1}（{cluster['size']} 岗）："
            f"关键词：{'、'.join(cluster['keywords'][:5])}；代表岗位：{names}"
        )
    candidates = ", ".join(
        f"k={item['cluster_count']} ({item['silhouette'] if item['silhouette'] is not None else 'N/A'})"
        for item in metrics.get("candidates", [])
    ) or "N/A"

    return f"""# InternPilot 数据挖掘实验摘要

生成时间：{report['generated_at']}

## 数据质量

- 岗位数：{quality['job_count']}
- 含 JD：{quality['jobs_with_jd']}
- 含标准技能：{quality['jobs_with_skills']}
- 含岗位类别：{quality['jobs_with_category']}

## 描述性分析

### 高频技能

{lines(desc['top_skills'])}

### 技能差距提示

{lines(desc['skill_gaps'])}

### 投递漏斗

{lines(desc['funnel'])}

## 文本聚类

- 方法：{report['method']['text_representation']} + {report['method']['clustering']}
- 固定随机种子：{report['method']['random_state']}；`n_init={report['method']['n_init']}`
- 候选簇数/轮廓系数：{candidates}
- 选定簇数：{metrics.get('selected_cluster_count', 'N/A')}
- silhouette：{metrics.get('silhouette', 'N/A')}

{chr(10).join(cluster_lines) or '- 样本不足，未生成需求簇。'}

## 限制

{chr(10).join(f'- {item}' for item in report['limitations'])}
"""
