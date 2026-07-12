"""集中管理运行模式、路径和安全相关配置。"""

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def get_app_mode() -> str:
    mode = os.getenv("APP_MODE", "local").strip().lower()
    return mode if mode in {"local", "demo", "test"} else "local"


def get_database_path() -> Path:
    configured = os.getenv("INTERNPILOT_DB_PATH", "").strip()
    if not configured:
        if get_app_mode() == "demo":
            return BASE_DIR / "data" / "internpilot_demo.db"
        return BASE_DIR / "data" / "internpilot.db"
    path = Path(configured).expanduser()
    return path if path.is_absolute() else (BASE_DIR / path).resolve()


def get_model_artifact_dir() -> Path:
    """返回本地模型产物目录，测试可通过环境变量隔离。"""
    configured = os.getenv("INTERNPILOT_MODEL_DIR", "").strip()
    if not configured:
        return BASE_DIR / "artifacts" / "models"
    path = Path(configured).expanduser()
    return path if path.is_absolute() else (BASE_DIR / path).resolve()


def get_allowed_origins() -> list[str]:
    configured = os.getenv("ALLOWED_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return ["http://localhost:8000", "http://127.0.0.1:8000"]


def is_demo_mode() -> bool:
    return get_app_mode() == "demo"
