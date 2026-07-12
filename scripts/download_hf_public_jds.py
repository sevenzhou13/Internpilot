"""从许可明确的 Hugging Face 中文岗位描述集抽取本地训练候选集。"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import parse, request


DATASET_ID = "wangzihaogithub/job-educational-parser-dataset-08-0-0805"
DATASET_PAGE = f"https://huggingface.co/datasets/{DATASET_ID}"
ROWS_ENDPOINT = "https://datasets-server.huggingface.co/rows"


def _clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", str(value or ""))).strip()


def _extract_tag(text: str, tag: str) -> str:
    match = re.search(rf"<{tag}>\s*(.*?)\s*</{tag}>", text or "", re.S)
    return _clean_text(match.group(1)) if match else ""


def to_public_jd_record(row: dict[str, Any], captured_at: str) -> dict[str, str] | None:
    raw_text = str(row.get("user") or "").strip()
    title = _extract_tag(raw_text, "岗位名称")
    jd_text = _clean_text(raw_text)
    if not title or len(jd_text) < 40:
        return None
    job_id = str(row.get("job_id") or row.get("id") or "unknown")
    return {
        "source_url": f"{DATASET_PAGE}#job_id={parse.quote(job_id, safe='')}",
        "captured_at": captured_at,
        "query": DATASET_ID,
        "platform": "Hugging Face 公开数据集",
        "title": title,
        "company": "公开数据集（未提供）",
        "location": "未提供",
        "jd_text": jd_text,
    }


def _fetch_rows(offset: int, length: int) -> list[dict[str, Any]]:
    parameters = parse.urlencode({
        "dataset": DATASET_ID,
        "config": "default",
        "split": "train",
        "offset": offset,
        "length": length,
    })
    http_request = request.Request(
        f"{ROWS_ENDPOINT}?{parameters}",
        headers={"User-Agent": "InternPilot/2.0 (coursework public-dataset sampler)"},
    )
    with request.urlopen(http_request, timeout=30) as response:  # nosec B310: fixed public HTTPS endpoint
        payload = json.load(response)
    return [item.get("row", {}) for item in payload.get("rows", []) if isinstance(item, dict)]


def download_public_jds(output: Path, count: int = 300, batch_size: int = 100) -> int:
    if count <= 0 or batch_size <= 0:
        raise ValueError("count 和 batch-size 必须为正整数")
    output.parent.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, str]] = []
    seen_ids: set[str] = set()
    offset = 0
    stalled_batches = 0
    captured_at = datetime.now(timezone.utc).astimezone().isoformat()

    while len(records) < count:
        rows = _fetch_rows(offset, min(batch_size, count - len(records)))
        if not rows:
            break
        count_before_batch = len(records)
        for row in rows:
            record = to_public_jd_record(row, captured_at)
            if not record or record["source_url"] in seen_ids:
                continue
            records.append(record)
            seen_ids.add(record["source_url"])
            if len(records) >= count:
                break
        offset += len(rows)
        if len(records) == count_before_batch:
            stalled_batches += 1
            if stalled_batches >= 3:
                break
        else:
            stalled_batches = 0

    if len(records) < count:
        raise ValueError(f"公开接口只返回 {len(records)} 条有效岗位，未达到请求的 {count} 条")
    with output.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    return len(records)


def main() -> int:
    parser = argparse.ArgumentParser(description="抽取 Hugging Face 公开中文岗位描述用于人工复核")
    parser.add_argument("--output", default="data/raw/hf_job_education_300.jsonl")
    parser.add_argument("--count", type=int, default=300)
    parser.add_argument("--batch-size", type=int, default=100)
    args = parser.parse_args()
    try:
        total = download_public_jds(Path(args.output), args.count, args.batch_size)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"下载失败：{exc}")
        return 1
    print(f"已写入 {total} 条公开 JD 到 {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
