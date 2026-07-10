"""LLM 调用封装：所有大模型请求从此处发出。"""

import os
from pathlib import Path

from dotenv import load_dotenv

from modules.config import get_app_mode

load_dotenv()

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def get_llm_config() -> dict:
    """读取 LLM 配置，支持 OpenAI 及兼容接口。"""
    if get_app_mode() == "test":
        return {"api_key": "", "base_url": None, "model": "gpt-4o-mini"}
    try:
        import streamlit as st
        api_key = st.secrets.get("OPENAI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
        base_url = st.secrets.get("OPENAI_BASE_URL", "") or os.getenv("OPENAI_BASE_URL", "")
        model = st.secrets.get("OPENAI_MODEL", "") or os.getenv("OPENAI_MODEL", "")
    except Exception:
        api_key = os.getenv("OPENAI_API_KEY", "")
        base_url = os.getenv("OPENAI_BASE_URL", "")
        model = os.getenv("OPENAI_MODEL", "")

    return {
        "api_key": api_key.strip(),
        "base_url": base_url.strip() or None,
        "model": model.strip() or "gpt-4o-mini",
    }


def is_llm_configured() -> bool:
    return bool(get_llm_config()["api_key"])


def call_llm(prompt: str, temperature: float = 0.3) -> str:
    """调用 LLM，返回文本。API Key 缺失或调用失败时返回错误提示字符串。"""
    config = get_llm_config()
    if not config["api_key"]:
        return "⚠️ 未配置 API Key。请在 .env 文件中设置 OPENAI_API_KEY，或在 .streamlit/secrets.toml 中配置。"

    try:
        from openai import OpenAI
        kwargs: dict = {"api_key": config["api_key"]}
        if config["base_url"]:
            kwargs["base_url"] = config["base_url"]
        client = OpenAI(**kwargs)

        response = client.chat.completions.create(
            model=config["model"],
            messages=[
                {
                    "role": "system",
                    "content": "你是一个严谨的求职助手，擅长岗位分析、简历优化和面试准备。只根据用户提供的信息作答，不编造数据。",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        return f"⚠️ LLM 调用失败：{exc}"


def load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""
