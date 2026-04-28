"""解析 InternPilot Clipper 浏览器插件生成的 JSON。"""

import json
from datetime import datetime


def parse_clip_json(raw_json: str) -> dict:
    """解析插件复制的 JSON 字符串，校验必要字段。"""
    try:
        data = json.loads(raw_json.strip())
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON 格式不正确：{exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("剪藏数据应为 JSON 对象")

    required = ["page_title", "url", "source_domain", "created_at"]
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"缺少必要字段：{', '.join(missing)}")

    return data


def clip_to_job_data(clip_data: dict) -> dict:
    """将剪藏数据转换为 jobs 表可直接保存的格式。"""
    selected = clip_data.get("selected_text", "") or ""
    page = clip_data.get("page_text", "") or ""
    raw_clip = selected.strip() or page.strip()

    return {
        "company": "待解析",
        "title": (clip_data.get("page_title") or "待解析岗位").strip(),
        "location": "待解析",
        "role_type": "待解析",
        "source": "clipped",
        "jd_text": raw_clip,
        "raw_clip_text": raw_clip,
        "source_domain": clip_data.get("source_domain", ""),
        "apply_url": clip_data.get("url", ""),
        "status": "未查看",
        "clipped_at": clip_data.get("created_at") or datetime.now().isoformat(timespec="seconds"),
    }
