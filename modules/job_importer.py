"""安全地预览文本、文件和公开 URL 中的岗位信息。"""

import io
import ipaddress
import re
import socket
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict
from urllib.parse import urljoin, urlparse

import httpx
from docx import Document
from pypdf import PdfReader

from modules.job_structurer import structure_job


MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_URL_BYTES = 2 * 1024 * 1024
MAX_JOBS_PER_IMPORT = 20
# 某些桌面网络/代理会将腾讯招聘域名映射到 RFC 2544 基准测试地址段。
# 只允许已知公开域名使用该映射，不能据此放宽任何本机或内网地址。
BENCHMARK_ALIAS_NETWORK = ipaddress.ip_network("198.18.0.0/15")
BENCHMARK_ALIAS_HOSTS = frozenset({"join.qq.com"})


class _VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.ignored_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() in {"script", "style", "noscript"}:
            self.ignored_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript"} and self.ignored_depth:
            self.ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.ignored_depth and data.strip():
            self.parts.append(data.strip())


def html_to_text(html: str) -> str:
    parser = _VisibleTextParser()
    parser.feed(html or "")
    return re.sub(r"\n{3,}", "\n\n", "\n".join(parser.parts)).strip()


def split_job_texts(text: str) -> list[str]:
    value = (text or "").strip()
    if not value:
        raise ValueError("岗位文本不能为空")
    chunks = re.split(r"\n\s*(?:-{3,}|={3,}|岗位\s*\d+[：:])\s*\n", value)
    chunks = [chunk.strip() for chunk in chunks if len(chunk.strip()) >= 10]
    if not chunks:
        chunks = [value]
    return chunks[:MAX_JOBS_PER_IMPORT]


def _guess_title(text: str, fallback: str = "待确认岗位") -> str:
    for line in (text or "").splitlines()[:8]:
        value = re.sub(r"^[#\-*\d.、\s]+", "", line).strip()
        if 2 <= len(value) <= 60 and not any(x in value for x in ("岗位职责", "任职要求", "职位描述")):
            return value
    return fallback


def preview_text_jobs(text: str, source: str = "text", apply_url: str = "") -> list[Dict]:
    previews = []
    for chunk in split_job_texts(text):
        previews.append(structure_job({
            "title": _guess_title(chunk),
            "jd_text": chunk,
            "raw_clip_text": chunk,
            "source": source,
            "apply_url": apply_url,
            "status": "未查看",
        }))
    return previews


def extract_file_text(filename: str, content: bytes) -> str:
    if not content:
        raise ValueError("上传文件为空")
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("文件不能超过 5 MB")
    suffix = Path(filename or "").suffix.lower()
    if suffix == ".txt":
        return content.decode("utf-8", errors="ignore").strip()
    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    if suffix == ".docx":
        document = Document(io.BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
    raise ValueError("仅支持 TXT、PDF 或 DOCX 文件")


def _validate_public_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("仅支持公开 HTTP/HTTPS URL")
    if parsed.username or parsed.password:
        raise ValueError("URL 不能包含用户名或密码")
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(parsed.hostname, parsed.port or 443)}
    except OSError as exc:
        raise ValueError("无法解析 URL 域名") from exc
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if not ip.is_global and not _is_allowed_benchmark_alias(parsed.hostname, ip):
            raise ValueError("禁止访问本机、内网或保留地址")
    return parsed.geturl()


def _is_allowed_benchmark_alias(hostname: str, ip: ipaddress._BaseAddress) -> bool:
    """只接受指定公开域名经本地代理映射到 198.18.0.0/15 的兼容情形。"""
    normalized_host = (hostname or "").lower().rstrip(".")
    return normalized_host in BENCHMARK_ALIAS_HOSTS and ip in BENCHMARK_ALIAS_NETWORK


def fetch_public_page(url: str) -> tuple[str, str]:
    current = _validate_public_url(url)
    headers = {"User-Agent": "InternPilot/2.0 (+personal job research tool)"}
    with httpx.Client(timeout=10.0, headers=headers, follow_redirects=False) as client:
        for _ in range(4):
            response = client.get(current)
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("location")
                if not location:
                    raise ValueError("页面重定向缺少目标地址")
                current = _validate_public_url(urljoin(current, location))
                continue
            response.raise_for_status()
            content_type = response.headers.get("content-type", "").lower()
            if "text/html" not in content_type and "text/plain" not in content_type:
                raise ValueError("URL 返回的不是 HTML 或纯文本")
            if len(response.content) > MAX_URL_BYTES:
                raise ValueError("页面内容超过 2 MB")
            text = html_to_text(response.text) if "html" in content_type else response.text
            if len(text.strip()) < 20:
                raise ValueError(
                    "页面没有可解析的岗位文本；该页面可能依赖浏览器 JavaScript 渲染，"
                    "请使用浏览器辅助解析或粘贴岗位 JD"
                )
            return text, current
    raise ValueError("页面重定向次数过多")


def preview_url_job(url: str) -> Dict:
    text, final_url = fetch_public_page(url)
    hostname = urlparse(final_url).hostname or ""
    job = preview_text_jobs(text[:12000], source="url", apply_url=final_url)[0]
    job["source_domain"] = hostname
    job["source_platform"] = job.get("source_platform") or hostname
    return job
