"""使用本地可见 Chrome 解析需要 JavaScript 或登录态的单个公开岗位页面。"""

from __future__ import annotations

import ipaddress
import re
import socket
import threading
import time
import uuid
from typing import Callable, Dict
from urllib.parse import urlparse

from modules.config import get_browser_import_timeout, get_browser_profile_dir
from modules.job_structurer import structure_job


FINAL_TASK_STATES = frozenset({"done", "error", "cancelled"})
BENCHMARK_ALIAS_NETWORK = ipaddress.ip_network("198.18.0.0/15")
BLOCKED_HOST_SUFFIXES = (".localhost", ".local", ".internal", ".lan", ".home")
CHALLENGE_MARKERS = (
    "请稍候",
    "安全验证",
    "访问验证",
    "人机验证",
    "完成验证",
    "正在加载",
    "just a moment",
    "checking your browser",
)
JOB_TEXT_MARKERS = (
    "职位描述",
    "职位详情",
    "岗位职责",
    "任职要求",
    "工作内容",
    "职位要求",
    "job description",
    "responsibilities",
    "requirements",
    "what you'll do",
)
UNAVAILABLE_MARKERS = ("职位不存在", "岗位不存在", "职位已下线", "岗位已下线")

_tasks: dict[str, dict] = {}
_tasks_lock = threading.Lock()
_browser_lock = threading.Lock()


class BrowserImportCancelled(Exception):
    """用户取消了浏览器辅助导入。"""


def validate_browser_import_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme not in {"http", "https"} or not hostname:
        raise ValueError("浏览器辅助解析仅支持公开 HTTP/HTTPS URL")
    if parsed.username or parsed.password:
        raise ValueError("URL 不能包含用户名或密码")
    if hostname == "localhost" or hostname.endswith(BLOCKED_HOST_SUFFIXES):
        raise ValueError("禁止访问本机或内网域名")
    try:
        literal_ip = ipaddress.ip_address(hostname)
    except ValueError:
        literal_ip = None
    if literal_ip is not None:
        if not literal_ip.is_global:
            raise ValueError("禁止访问本机、内网或保留地址")
        return parsed.geturl()
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))}
    except OSError as exc:
        raise ValueError("无法解析 URL 域名") from exc
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if not ip.is_global and ip not in BENCHMARK_ALIAS_NETWORK:
            raise ValueError("禁止访问本机、内网或保留地址")
    return parsed.geturl()


def is_browser_import_url(url: str) -> bool:
    try:
        validate_browser_import_url(url)
        return True
    except ValueError:
        return False


def _looks_like_job_page(title: str, text: str) -> bool:
    title_value = (title or "").strip()
    text_value = (text or "").strip()
    combined_head = f"{title_value}\n{text_value[:500]}".lower()
    if any(marker in combined_head for marker in CHALLENGE_MARKERS):
        return False
    searchable_text = text_value.lower()
    return len(text_value) >= 200 and any(marker in searchable_text for marker in JOB_TEXT_MARKERS)


def _clean_page_title(title: str) -> str:
    value = re.sub(r"\s*[-_|]\s*BOSS直聘.*$", "", (title or "").strip(), flags=re.I)
    return value[:120]


def _extract_visible_job(page, source_url: str) -> Dict:
    fields = page.evaluate(
        """
        () => {
          const firstText = (selectors) => {
            for (const selector of selectors) {
              const node = document.querySelector(selector);
              const value = node?.innerText?.trim();
              if (value) return value;
            }
            return "";
          };
          const longestText = (selectors) => {
            const values = selectors.flatMap(selector =>
              Array.from(document.querySelectorAll(selector))
                .map(node => node.innerText?.trim() || "")
                .filter(Boolean)
            );
            return values.sort((a, b) => b.length - a.length)[0] || "";
          };
          return {
            body: document.body?.innerText?.trim() || "",
            title: firstText([".job-banner .name", ".job-primary .name", "[data-testid='job-title']", "h1"]),
            company: firstText([".company-info .company-name", ".company-info h3 a", ".sider-company a", "[data-testid='company-name']"]),
            location: firstText([".job-address .location-address", ".job-primary .text-desc", "[data-testid='job-location']"]),
            jd: longestText([".job-detail-section .job-sec-text", ".job-sec-text", ".job-detail", "[data-testid='job-description']", "main", "article"]),
          };
        }
        """
    )
    body = (fields.get("body") or "").strip()
    jd_text = (fields.get("jd") or body).strip()[:12000]
    title = (fields.get("title") or _clean_page_title(page.title()) or "待确认岗位").strip()
    final_url = page.url or source_url
    hostname = (urlparse(final_url).hostname or "").lower()
    return structure_job({
        "company": (fields.get("company") or "").strip(),
        "title": title,
        "location": (fields.get("location") or "").strip(),
        "jd_text": jd_text,
        "raw_clip_text": body[:12000],
        "source": "browser_url",
        "source_domain": hostname,
        "apply_url": final_url,
        "status": "未查看",
    })


def _browser_preview_job(
    url: str,
    cancel_event: threading.Event,
    update: Callable[[str, str], None],
) -> Dict:
    try:
        from playwright.sync_api import Error as PlaywrightError
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("缺少 Playwright，请重新安装 requirements.txt 后重启 InternPilot") from exc

    profile_dir = get_browser_profile_dir()
    profile_dir.mkdir(parents=True, exist_ok=True)
    timeout_seconds = get_browser_import_timeout()

    with _browser_lock:
        if cancel_event.is_set():
            raise BrowserImportCancelled()
        update("opening", "正在打开专用 Chrome 窗口…")
        with sync_playwright() as playwright:
            try:
                context = playwright.chromium.launch_persistent_context(
                    str(profile_dir),
                    channel="chrome",
                    headless=False,
                    accept_downloads=False,
                )
            except Exception as exc:
                raise RuntimeError(f"无法启动 Google Chrome：{exc}") from exc

            try:
                page = context.pages[0] if context.pages else context.new_page()
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30_000)
                except PlaywrightTimeoutError:
                    pass
                except PlaywrightError as exc:
                    if "ERR_" in str(exc):
                        raise RuntimeError(
                            "Chrome 无法访问该页面；请恢复代理连接，或刷新系统 DNS 后重试"
                        ) from exc
                    raise

                update("waiting", "Chrome 已打开；如出现登录或验证，请在窗口中完成")
                deadline = time.monotonic() + timeout_seconds
                last_validated_url = ""
                while time.monotonic() < deadline:
                    if cancel_event.is_set():
                        raise BrowserImportCancelled()
                    try:
                        title = page.title()
                        body = page.locator("body").inner_text(timeout=3_000)
                    except Exception as exc:
                        raise RuntimeError("浏览器窗口已关闭，解析已停止") from exc

                    if page.url != last_validated_url:
                        if page.url.startswith("chrome-error://"):
                            raise RuntimeError(
                                "Chrome 无法访问该页面；请恢复代理连接，或刷新系统 DNS 后重试"
                            )
                        validate_browser_import_url(page.url)
                        last_validated_url = page.url

                    if any(marker in body for marker in UNAVAILABLE_MARKERS):
                        raise ValueError("该 BOSS 岗位已下线或不存在")
                    if _looks_like_job_page(title, body):
                        update("extracting", "岗位页面已加载，正在提取正文…")
                        return _extract_visible_job(page, url)
                    page.wait_for_timeout(1_000)

                raise TimeoutError("等待岗位页面超时；请完成登录或验证后重试")
            finally:
                context.close()


def _set_task(task_id: str, **changes) -> None:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if task:
            task.update(changes)
            task["updated_at"] = time.time()


def _run_task(task_id: str, url: str, cancel_event: threading.Event) -> None:
    def update(status: str, message: str) -> None:
        _set_task(task_id, status=status, message=message)

    try:
        job = _browser_preview_job(url, cancel_event, update)
        _set_task(task_id, status="done", message="浏览器解析完成", job=job)
    except BrowserImportCancelled:
        _set_task(task_id, status="cancelled", message="浏览器解析已取消")
    except Exception as exc:
        _set_task(task_id, status="error", message=str(exc))


def _cleanup_tasks() -> None:
    cutoff = time.time() - 600
    with _tasks_lock:
        expired = [
            task_id for task_id, task in _tasks.items()
            if task.get("status") in FINAL_TASK_STATES and task.get("updated_at", 0) < cutoff
        ]
        for task_id in expired:
            _tasks.pop(task_id, None)


def start_browser_preview_task(url: str) -> str:
    normalized_url = validate_browser_import_url(url)
    _cleanup_tasks()
    task_id = uuid.uuid4().hex
    cancel_event = threading.Event()
    now = time.time()
    with _tasks_lock:
        active = any(task.get("status") not in FINAL_TASK_STATES for task in _tasks.values())
        if active:
            raise ValueError("已有浏览器解析任务正在进行，请完成或取消后再试")
        _tasks[task_id] = {
            "id": task_id,
            "status": "queued",
            "message": "浏览器解析任务已创建",
            "job": None,
            "created_at": now,
            "updated_at": now,
            "cancel_event": cancel_event,
        }
    threading.Thread(
        target=_run_task,
        args=(task_id, normalized_url, cancel_event),
        daemon=True,
        name=f"browser-job-import-{task_id[:8]}",
    ).start()
    return task_id


def get_browser_preview_task(task_id: str) -> Dict:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if not task:
            raise KeyError(task_id)
        return {key: value for key, value in task.items() if key != "cancel_event"}


def cancel_browser_preview_task(task_id: str) -> bool:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if not task:
            return False
        if task.get("status") in FINAL_TASK_STATES:
            return True
        task["cancel_event"].set()
        task["message"] = "正在取消浏览器解析…"
        task["updated_at"] = time.time()
        return True
