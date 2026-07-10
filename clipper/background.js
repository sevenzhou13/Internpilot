// InternPilot Clipper - Background Service Worker
// 在后台持续运行 API 调用，不受 popup 关闭影响

const BASE = "http://localhost:8000";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "startParse") {
    // 开始解析，存储状态
    chrome.storage.local.set({ status: "loading", progress: "", result: null, error: null, pageUrl: msg.url });
    runParse(msg.text, msg.url);
    sendResponse({ ok: true });
  } else if (msg.action === "getStatus") {
    chrome.storage.local.get(["status", "progress", "result", "error", "pageUrl"], sendResponse);
  } else if (msg.action === "saveJob") {
    saveJob(msg.data).then(r => sendResponse(r)).catch(e => sendResponse({ error: e.message }));
  } else if (msg.action === "clear") {
    chrome.storage.local.set({ status: "idle", progress: "", result: null, error: null });
    sendResponse({ ok: true });
  } else if (msg.action === "checkServer") {
    fetch(`${BASE}/api/llm/status`)
      .then(r => r.json())
      .then(d => sendResponse({ ok: true, configured: d.configured }))
      .catch(() => sendResponse({ ok: false }));
  }
  return true; // 保持消息通道开启等待异步响应
});

async function runParse(text, url) {
  try {
    const res = await fetch(`${BASE}/api/jd/parse/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd_text: text.slice(0, 4000) }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      chrome.storage.local.set({ status: "error", error: d.detail || "服务器错误" });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", progress = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") break;
        try {
          const p = JSON.parse(payload);
          if (p.error) {
            chrome.storage.local.set({ status: "error", error: p.error });
            return;
          }
          if (p.chunk) {
            progress += p.chunk;
            // 更新进度（每积累 50 字符通知一次，避免频繁写 storage）
            if (progress.length % 50 < 5) {
              chrome.storage.local.set({ status: "loading", progress });
            }
          }
          if (p.done && p.result) {
            chrome.storage.local.set({ status: "done", result: p.result, pageUrl: url, progress });
            return;
          }
        } catch {}
      }
    }
  } catch (e) {
    chrome.storage.local.set({ status: "error", error: `连接失败：${e.message}` });
  }
}

async function saveJob(data) {
  const res = await fetch(`${BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    const detail = typeof d.detail === "object" ? d.detail.message : d.detail;
    throw new Error(detail || "保存失败");
  }
  // 匹配为纯规则计算；缺少偏好或经历时接口会安全返回 updated=0。
  await fetch(`${BASE}/api/jobs/match-scores`, { method: "POST" }).catch(() => null);
  chrome.storage.local.set({ status: "saved" });
  return { ok: true };
}
