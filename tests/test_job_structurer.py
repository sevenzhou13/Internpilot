import pytest
import socket

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


def test_structure_job_prefers_open_llm_category_over_default_examples():
    job = structure_job(
        {"title": "量化研究实习生", "jd_text": "研究因子、构建回测策略"},
        {
            "job_category": "量化研究/金融工程",
            "category_reason": "职责集中于量化因子与策略回测",
            "taxonomy_note": "建议从算法类中单列量化研究",
        },
    )

    assert job["job_category"] == "量化研究/金融工程"
    assert job["category_source"] == "llm"


def test_structure_job_keeps_confirmed_category_during_ai_reparse():
    job = structure_job(
        {
            "title": "量化研究实习生",
            "jd_text": "研究因子、构建回测策略",
            "job_category": "金融数据分析",
            "category_confidence": 1.0,
            "category_source": "manual",
        },
        {"job_category": "量化研究/金融工程"},
    )

    assert job["job_category"] == "金融数据分析"
    assert job["category_source"] == "manual"


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


def test_known_public_host_can_use_constrained_benchmark_alias(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("198.18.0.152", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    assert _validate_public_url("https://join.qq.com/post_detail.html?postid=123")
    with pytest.raises(ValueError, match="内网|保留"):
        _validate_public_url("https://example.com/job")


def test_unsupported_file_type_is_rejected():
    with pytest.raises(ValueError, match="仅支持"):
        extract_file_text("jobs.csv", b"title,description")
