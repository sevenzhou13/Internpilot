const BASE = "http://localhost:8000";

const $ = (id) => document.getElementById(id);

let parsedData = null;
let pageUrl = "";

function setStatus(type, text) {
  const el = $("status");
  el.className = `status ${type}`;
  el.innerHTML = type === "loading"
    ? `<div class="spinner"></div><span>${text}</span>`
    : `<span>${type === "error" ? "⚠️" : "✅"} ${text}</span>`;
}

function showPreview(data) {
  parsedData = data;
  $("f-company").value  = data.company  || "";
  $("f-title").value    = data.title    || "";
  $("f-location").value = data.location || "";
  $("f-url").value      = pageUrl;

  const roleSelect = $("f-role");
  const roles = ["数据分析", "AI产品", "产品经理", "用户研究", "其他"];
  roleSelect.value = roles.includes(data.role_type) ? data.role_type : "其他";

  const skillsEl = $("f-skills");
  const skills = Array.isArray(data.skills) ? data.skills : (data.skills || "").split(",").filter(Boolean);
  skillsEl.innerHTML = skills.length
    ? skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join("")
    : '<span style="color:#9CA3AF;font-size:11px">未识别到技能关键词</span>';

  $("preview").style.display = "block";
  $("actions").style.display = "block";
}

async function parseAndShow(text, url) {
  pageUrl = url;
  setStatus("loading", "AI 识别岗位信息中…");
  try {
    const res = await fetch(`${BASE}/api/jd/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd_text: text.slice(0, 4000) }),
    });
    if (!res.ok) throw new Error("服务返回错误");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.title) throw new Error("未能识别岗位信息，请选中 JD 文字后重试");
    setStatus("success", `识别完成：${data.company || ""} · ${data.title}`);
    showPreview(data);
  } catch (e) {
    setStatus("error", e.message || "识别失败，请确认 InternPilot 正在运行");
  }
}

async function getPageContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      url: location.href,
      selected: window.getSelection().toString().trim(),
      // 跳过导航/页脚，取主要内容区域
      text: (() => {
        const skip = new Set(["SCRIPT","STYLE","NAV","FOOTER","HEADER","NOSCRIPT"]);
        const parts = [];
        const walk = (node) => {
          if (skip.has(node.nodeName)) return;
          if (node.nodeType === 3 && node.textContent.trim()) parts.push(node.textContent.trim());
          node.childNodes.forEach(walk);
        };
        walk(document.body);
        return parts.join("\n").slice(0, 5000);
      })(),
    }),
  });
  return result;
}

async function init() {
  try {
    // 先检查 InternPilot 是否在运行
    await fetch(`${BASE}/api/llm/status`).catch(() => { throw new Error("InternPilot 未运行，请先启动服务"); });
    const content = await getPageContent();
    const text = content.selected || content.text;
    await parseAndShow(text, content.url);
  } catch (e) {
    setStatus("error", e.message);
  }
}

$("btn-save").addEventListener("click", async () => {
  const title = $("f-title").value.trim();
  if (!title) { setStatus("error", "岗位名称不能为空"); return; }

  const jdSections = parsedData || {};
  const resp = (jdSections.responsibilities || []).map((r, i) => `${i+1}. ${r}`).join("\n");
  const reqs  = (jdSections.requirements   || []).map((r, i) => `${i+1}. ${r}`).join("\n");
  let cleanJD = "";
  if (resp) cleanJD += `【岗位职责】\n${resp}\n\n`;
  if (reqs)  cleanJD += `【岗位要求】\n${reqs}`;
  if (!cleanJD) cleanJD = jdSections.summary || "";

  const skills = Array.isArray(jdSections.skills)
    ? jdSections.skills.join(", ")
    : (jdSections.skills || "");

  $("btn-save").disabled = true;
  $("btn-save").textContent = "保存中…";

  try {
    const res = await fetch(`${BASE}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company:   $("f-company").value.trim(),
        title,
        location:  $("f-location").value.trim(),
        role_type: $("f-role").value,
        jd_text:   cleanJD,
        apply_url: $("f-url").value.trim(),
        skills,
        source: "clipper",
      }),
    });
    if (!res.ok) throw new Error("保存失败");
    setStatus("success", "已保存到 InternPilot ✓");
    $("preview").style.display = "none";
    $("actions").style.display = "none";
  } catch (e) {
    setStatus("error", e.message);
    $("btn-save").disabled = false;
    $("btn-save").textContent = "保存到 InternPilot";
  }
});

$("btn-retry").addEventListener("click", async () => {
  $("preview").style.display = "none";
  $("actions").style.display = "none";
  await init();
});

init();
