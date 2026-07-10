"""本地 RAG 基础：切片、持久化元数据与 TF-IDF 检索。"""

from __future__ import annotations

import re
from typing import Dict, List, Optional

from modules import db


def chunk_text(text: str, max_chars: int = 500, overlap: int = 80) -> List[str]:
    value = re.sub(r"\s+", " ", text or "").strip()
    if not value:
        return []
    chunks = []
    start = 0
    while start < len(value):
        end = min(len(value), start + max_chars)
        if end < len(value):
            boundary = max(value.rfind("。", start, end), value.rfind("；", start, end), value.rfind(" ", start, end))
            if boundary > start + max_chars // 2:
                end = boundary + 1
        chunks.append(value[start:end].strip())
        if end >= len(value):
            break
        start = max(end - overlap, start + 1)
    return chunks


def rebuild_knowledge_index() -> Dict[str, int]:
    counts = {"job": 0, "experience": 0, "resume": 0}
    for job in db.get_all_jobs():
        text = "\n".join(filter(None, [job.get("title"), job.get("skills"), job.get("jd_text")]))
        counts["job"] += db.replace_knowledge_chunks("job", job["id"], job["id"], chunk_text(text))
    for experience in db.get_all_experiences():
        text = "\n".join(str(experience.get(key) or "") for key in ("title", "background", "methods", "tools", "results", "keywords", "raw_bullet"))
        counts["experience"] += db.replace_knowledge_chunks("experience", experience["id"], None, chunk_text(text))
    for resume in db.get_all_resumes():
        counts["resume"] += db.replace_knowledge_chunks("resume", resume["id"], None, chunk_text(resume.get("parsed_text") or ""))
    return {**counts, "total": sum(counts.values())}


def retrieve_knowledge(query: str, job_id: Optional[int] = None, top_k: int = 5) -> List[Dict]:
    chunks = db.get_knowledge_chunks()
    if job_id is not None:
        chunks = [item for item in chunks if item["doc_type"] != "job" or item.get("related_job_id") == job_id]
    if not chunks or not (query or "").strip():
        return []
    from sklearn.feature_extraction.text import TfidfVectorizer

    corpus = [item["chunk_text"] for item in chunks]
    matrix = TfidfVectorizer(ngram_range=(1, 2)).fit_transform([query, *corpus])
    scores = (matrix[1:] @ matrix[0].T).toarray().ravel()
    ranked = sorted(enumerate(scores), key=lambda item: item[1], reverse=True)
    return [
        {"doc_type": chunks[index]["doc_type"], "source_id": chunks[index]["source_id"], "related_job_id": chunks[index]["related_job_id"], "chunk_text": chunks[index]["chunk_text"], "score": round(float(score), 4)}
        for index, score in ranked[:max(1, min(top_k, 10))] if score > 0
    ]
