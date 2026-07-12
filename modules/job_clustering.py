"""岗位文本聚类：用于识别岗位池中的主要需求簇。"""

from collections import Counter
from typing import Dict, List

from modules import db


def cluster_jobs(max_clusters: int = 4) -> Dict:
    jobs = [job for job in db.get_all_jobs() if (job.get("title") or job.get("jd_text") or "").strip()]
    if len(jobs) < 2:
        return {"clusters": [], "metrics": {"evaluated": False, "reason": "至少需要 2 个岗位才能聚类"}, "job_count": len(jobs)}

    from sklearn.cluster import KMeans
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics import silhouette_score

    texts = ["\n".join(filter(None, [job.get("title"), job.get("skills"), job.get("jd_text")])) for job in jobs]
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)
    maximum = min(max(2, int(max_clusters)), len(jobs))
    candidates: List[Dict] = []
    fitted: dict[int, tuple[object, object, float | None]] = {}
    for cluster_count in range(2, maximum + 1):
        model = KMeans(n_clusters=cluster_count, random_state=42, n_init=10)
        labels = model.fit_predict(matrix)
        evaluated = len(jobs) > cluster_count and len(set(labels)) > 1
        silhouette = round(float(silhouette_score(matrix, labels)), 4) if evaluated else None
        candidates.append({"cluster_count": cluster_count, "silhouette": silhouette})
        fitted[cluster_count] = (model, labels, silhouette)

    scored = [item for item in candidates if item["silhouette"] is not None]
    cluster_count = (
        max(scored, key=lambda item: (item["silhouette"], -item["cluster_count"]))["cluster_count"]
        if scored else 2
    )
    model, labels, silhouette = fitted[cluster_count]
    features = vectorizer.get_feature_names_out()
    clusters: List[Dict] = []
    for label in range(cluster_count):
        indexes = [index for index, value in enumerate(labels) if value == label]
        top_indexes = model.cluster_centers_[label].argsort()[::-1][:6]
        clusters.append({
            "cluster_id": int(label),
            "size": len(indexes),
            "keywords": [str(features[index]) for index in top_indexes],
            "jobs": [{"id": jobs[index]["id"], "title": jobs[index].get("title"), "company": jobs[index].get("company")} for index in indexes[:5]],
        })
    evaluated = silhouette is not None
    return {
        "job_count": len(jobs),
        "clusters": clusters,
        "metrics": {
            "evaluated": evaluated,
            "silhouette": silhouette,
            "selected_cluster_count": cluster_count,
            "candidates": candidates,
            "random_state": 42,
            "n_init": 10,
            "reason": "样本量不足以计算 silhouette 指标" if not evaluated else "",
        },
    }
