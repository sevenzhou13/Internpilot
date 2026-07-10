import pytest

from modules.job_importer import _validate_public_url, extract_file_text, split_job_texts
from modules.job_structurer import compute_duplicate_hash, structure_job


def test_structure_job_extracts_rule_fields_and_skills():
    job = structure_job({
        "company": "示例科技",
        "title": "数据分析实习生",
        "location": "上海市浦东新区",
        "jd_text": "本科及以上，熟悉 Python、SQL、Excel，实习补贴 150-200元/天。",
    })

    assert job["city_normalized"] == "上海"
    assert job["education_required"] == "本科及以上"
    assert (job["salary_min"], job["salary_max"], job["salary_unit"]) == (150.0, 200.0, "元/天")
    assert job["job_category"] == "数据分析/BI"
    assert {item["skill_name"] for item in job["skill_rows"]} >= {"Python", "SQL", "Excel"}


def test_duplicate_hash_prioritizes_normalized_url():
    first = compute_duplicate_hash({"title": "A", "apply_url": "https://example.com/job/1/"})
    second = compute_duplicate_hash({"title": "B", "apply_url": "https://example.com/job/1"})
    assert first == second


def test_text_split_and_txt_file_extraction():
    text = "岗位A\n熟悉 Python 和 SQL，负责数据分析。\n\n---\n\n岗位B\n负责产品需求分析和用户调研。"
    assert len(split_job_texts(text)) == 2
    assert extract_file_text("jobs.txt", text.encode("utf-8")) == text


def test_private_url_is_rejected_before_request():
    with pytest.raises(ValueError, match="内网|保留"):
        _validate_public_url("http://127.0.0.1/internal")


def test_unsupported_file_type_is_rejected():
    with pytest.raises(ValueError, match="仅支持"):
        extract_file_text("jobs.csv", b"title,description")
