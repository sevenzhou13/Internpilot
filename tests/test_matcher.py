from modules.matcher import (
    calculate_location_score,
    calculate_match_score,
    calculate_skill_score,
)


def test_skill_score_counts_each_required_skill_once():
    assert calculate_skill_score(["Python", "SQL"], ["python", "sql分析"]) == 100.0


def test_location_score_handles_remote_and_mismatch():
    assert calculate_location_score("远程", ["上海"]) == 80.0
    assert calculate_location_score("北京", ["上海"]) == 15.0


def test_match_score_stays_in_range():
    job = {
        "title": "数据分析实习生",
        "location": "上海",
        "skills": "Python,SQL",
        "jd_text": "【岗位要求】熟悉 Python、SQL 和数据分析。",
    }
    profile = {"target_locations": "上海"}
    experiences = [{"title": "分析项目", "keywords": "Python,SQL", "tools": "pandas"}]
    score = calculate_match_score(job, profile, experiences)
    assert 0 <= score <= 100
    assert score > 50
