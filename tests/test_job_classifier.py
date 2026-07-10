from modules import db
from modules.job_classifier import predict_job_category, train_job_category_model


def _add_labeled_job(title: str, jd_text: str, category: str) -> int:
    job_id = db.add_job({"title": title, "jd_text": jd_text})
    db.save_job_category_label(job_id, category)
    return job_id


def test_category_classifier_trains_and_predicts_from_reviewed_labels(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "classifier.db"))
    monkeypatch.setenv("INTERNPILOT_MODEL_DIR", str(tmp_path / "models"))
    db.init_db()

    _add_labeled_job("数据分析实习生", "熟悉 Python SQL Excel，制作数据看板", "数据分析/BI")
    _add_labeled_job("商业分析实习生", "使用 SQL 和 Python 完成业务分析", "数据分析/BI")
    _add_labeled_job("产品经理实习生", "负责需求分析、用户调研和产品原型", "产品/AI产品")
    target_id = _add_labeled_job("AI 产品实习生", "参与大模型产品设计和需求评审", "产品/AI产品")

    result = train_job_category_model(db.get_job_category_training_samples(False))
    prediction = predict_job_category(db.get_job_by_id(target_id))

    assert result["sample_count"] == 4
    assert result["class_distribution"] == {"产品/AI产品": 2, "数据分析/BI": 2}
    assert prediction["category"] in {"产品/AI产品", "数据分析/BI"}
    assert 0 <= prediction["confidence"] <= 1


def test_manual_category_label_overrides_rules_and_is_returned_as_training_data(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "labels.db"))
    db.init_db()
    job_id = db.add_job({"title": "业务分析实习生", "job_category": "数据分析/BI"})

    db.save_job_category_label(job_id, "销售/咨询/项目管理", "实际属于咨询项目")
    samples = db.get_job_category_training_samples(False)
    queue = db.get_job_category_review_queue()

    assert samples == [{
        "job_id": job_id,
        "title": "业务分析实习生",
        "jd_text": "",
        "skills": "",
        "category": "销售/咨询/项目管理",
        "label_source": "manual",
    }]
    assert queue[0]["reviewed_category"] == "销售/咨询/项目管理"


def test_classifier_reports_held_out_metrics_when_label_data_is_sufficient(tmp_path, monkeypatch):
    monkeypatch.setenv("INTERNPILOT_DB_PATH", str(tmp_path / "metrics.db"))
    monkeypatch.setenv("INTERNPILOT_MODEL_DIR", str(tmp_path / "models"))
    db.init_db()
    for index in range(4):
        _add_labeled_job(f"数据分析实习生 {index}", "Python SQL 数据看板", "数据分析/BI")
        _add_labeled_job(f"产品经理实习生 {index}", "用户调研 需求分析 原型", "产品/AI产品")

    result = train_job_category_model(db.get_job_category_training_samples(False))

    assert result["metrics"]["evaluated"] is True
    assert result["metrics"]["test_size"] == 2
    assert 0 <= result["metrics"]["macro_f1"] <= 1
