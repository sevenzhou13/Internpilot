"""可复现的岗位大类分类训练、评估与推理流程。"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from math import ceil
from pathlib import Path
from typing import Any, Dict, Iterable, List

from modules.config import get_model_artifact_dir
from modules.job_structurer import CATEGORY_RULES


MODEL_NAME = "job-category-tfidf-logreg"
MODEL_VERSION = "v1"
MIN_TRAINING_CLASSES = 2


class ClassifierDataError(ValueError):
    """训练样本不足或标签不合格时抛出。"""


def get_category_names() -> List[str]:
    return [category for category, _ in CATEGORY_RULES]


def build_job_text(job: Dict[str, Any]) -> str:
    """只使用岗位自身公开/用户导入文本，避免将个人数据带入分类特征。"""
    parts = (job.get("title", ""), job.get("skills", ""), job.get("jd_text", ""))
    return "\n".join(str(part).strip() for part in parts if str(part).strip())


def _artifact_path() -> Path:
    return get_model_artifact_dir() / f"{MODEL_NAME}-{MODEL_VERSION}.joblib"


def _validate_samples(samples: Iterable[Dict[str, Any]]) -> tuple[List[str], List[str], Dict[str, int]]:
    texts: List[str] = []
    labels: List[str] = []
    for sample in samples:
        text = build_job_text(sample)
        label = str(sample.get("category") or "").strip()
        if text and label:
            texts.append(text)
            labels.append(label)
    distribution = dict(sorted(Counter(labels).items()))
    if len(distribution) < MIN_TRAINING_CLASSES:
        raise ClassifierDataError("至少需要两个岗位类别才能训练分类模型")
    if len(texts) < 4:
        raise ClassifierDataError("至少需要 4 条有效标签岗位才能训练分类模型")
    return texts, labels, distribution


def train_job_category_model(samples: List[Dict[str, Any]]) -> Dict[str, Any]:
    """训练 TF-IDF + Logistic Regression，并只在样本满足条件时输出独立评估。"""
    try:
        import joblib
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score, classification_report, f1_score
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import Pipeline
    except ImportError as exc:  # pragma: no cover - 由部署环境决定
        raise RuntimeError("缺少 scikit-learn，请先安装 requirements.txt") from exc

    texts, labels, distribution = _validate_samples(samples)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
    ])

    minimum_class_count = min(distribution.values())
    metrics: Dict[str, Any] = {"evaluated": False, "reason": "每类样本不足 2 条，未生成独立验证指标"}
    test_count = max(len(distribution), ceil(len(texts) * 0.25))
    if (
        len(texts) >= 8
        and minimum_class_count >= 2
        and len(texts) - test_count >= len(distribution)
    ):
        train_texts, test_texts, train_labels, test_labels = train_test_split(
            texts, labels, test_size=test_count, random_state=42, stratify=labels,
        )
        evaluation_pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
            ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
        ])
        evaluation_pipeline.fit(train_texts, train_labels)
        predicted = evaluation_pipeline.predict(test_texts)
        metrics = {
            "evaluated": True,
            "test_size": len(test_labels),
            "accuracy": round(float(accuracy_score(test_labels, predicted)), 4),
            "macro_f1": round(float(f1_score(test_labels, predicted, average="macro", zero_division=0)), 4),
            "report": classification_report(test_labels, predicted, output_dict=True, zero_division=0),
        }

    pipeline.fit(texts, labels)
    artifact_path = _artifact_path()
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    metadata = {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": len(texts),
        "class_distribution": distribution,
        "metrics": metrics,
        "feature": "title + skills + jd_text",
    }
    joblib.dump({"pipeline": pipeline, "metadata": metadata}, artifact_path)
    return {**metadata, "artifact_path": str(artifact_path)}


def predict_job_category(job: Dict[str, Any]) -> Dict[str, Any]:
    try:
        import joblib
    except ImportError as exc:  # pragma: no cover - 由部署环境决定
        raise RuntimeError("缺少 scikit-learn，请先安装 requirements.txt") from exc

    artifact_path = _artifact_path()
    if not artifact_path.exists():
        raise FileNotFoundError("尚未训练岗位分类模型")
    text = build_job_text(job)
    if not text:
        raise ClassifierDataError("岗位缺少可用于分类的标题、技能或 JD 文本")

    payload = joblib.load(artifact_path)
    pipeline = payload["pipeline"]
    probabilities = pipeline.predict_proba([text])[0]
    labels = pipeline.classes_
    best_index = int(probabilities.argmax())
    top_predictions = [
        {"category": str(labels[index]), "confidence": round(float(probabilities[index]), 4)}
        for index in probabilities.argsort()[::-1][:3]
    ]
    return {
        "category": str(labels[best_index]),
        "confidence": round(float(probabilities[best_index]), 4),
        "top_predictions": top_predictions,
        "model_name": payload["metadata"]["model_name"],
        "model_version": payload["metadata"]["model_version"],
    }
