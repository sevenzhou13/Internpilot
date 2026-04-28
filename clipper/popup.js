const $ = (id) => document.getElementById(id);
const ROLE_OPTIONS = ["数据分析","AI产品","产品经理","用户研究","其他"];

let pollTimer = null;
let parsedData = null;

function setStatus(type, text) {
  const el = $("status");
  el.className = `status ${type}`;
  el.innerHTML = type === "loading"
    ? `<div class="spinner"></div><span>${text}</span>`
    : `<span>${type === "error" ? "⚠️" : "✅"} ${text}</span>`;
}

function showPreview(data, pageUrl) {
  parsedData = data;
  $("f-company").value  = data.company  || "";
  $("f-title").value    = data.title    || "";
  $("f-location").value = data.location || "";
  $("f-url").value      = pageUrl || "";

  const roleSelect = $("f-role");
  roleSelect.value = ROLE_OPTIONS.includes(data.role_type) ? data.role_type : "其他";

  const skills = Array.isArray(data.skills) ? data.skills : (data.skills || "").split(",").filter(Boolean);
  $("f-skills").innerHTML = skills.length
    ? skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join("")
    : '<span style="color:#9CA3AF;font-size:11px">未识别到技能关键词</span>';

  $("preview").style.display = "block";
  $("actions").style.display = "block";
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const state = await sendMsg({ action: "getStatus" });
    if (!state) return;

    if (state.status === "loading") {
      const prog = state.progress || "";
      const hint = prog.length > 0
        ? `AI 识别中 (${Math.round(prog.length / 10)}%)…`
        : "AI 识别中，请稍候…";
      setStatus("loading", hint);
    } else if (state.status === "done") {
      clearInterval(pollTimer);
      setStatus("success", `识别完成：${state.result?.company || ""} · ${state.result?.title || "未知岗位"}`);
      showPreview(state.result, state.pageUrl);
    } else if (state.status === "error") {
      clearInterval(pollTimer);
      setStatus("error", state.error || "识别失败");
    } else if (state.status === "saved") {
      clearInterval(pollTimer);
      setStatus("success", "已保存到 InternPilot ✓");
      $("preview").style.display = "none";
      $("actions").style.display = "none";
    }
  }, 300);
}

function sendMsg(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(resp);
    });
  });
}

async function init() {
  // 先检查服务器是否运行
  const serverOk = await sendMsg({ action: "checkServer" });
  if (!serverOk?.ok) {
    setStatus("error", "InternPilot 未运行，请先启动服务");
    return;
  }

  // 检查是否有进行中或已完成的任务
  const state = await sendMsg({ action: "getStatus" });

  if (state?.status === "loading") {
    // 后台正在识别（用户切窗口后重新打开）
    setStatus("loading", "AI 识别中，后台运行中…");
    startPolling();
    return;
  }

  if (state?.status === "done" && state.result?.title) {
    // 上次识别已完成，直接显示
    setStatus("success", `识别完成：${state.result.company || ""} · ${state.result.title}`);
    showPreview(state.result, state.pageUrl);
    $("actions").style.display = "block";
    return;
  }

  // 重新识别当前页面
  setStatus("loading", "读取页面内容…");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        url: location.href,
        selected: window.getSelection().toString().trim(),
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

    const text = result.selected || result.text;
    if (!text.trim()) { setStatus("error", "页面内容为空，请选中 JD 文字后重试"); return; }

    setStatus("loading", "AI 识别中，可切换到其他窗口…");

    // 委托给 background 处理（不受 popup 生命周期限制）
    await sendMsg({ action: "startParse", text, url: result.url });
    startPolling();
  } catch (e) {
    setStatus("error", e.message || "读取页面失败");
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

  const res = await sendMsg({
    action: "saveJob",
    data: {
      company:   $("f-company").value.trim(),
      title,
      location:  $("f-location").value.trim(),
      role_type: $("f-role").value,
      jd_text:   cleanJD,
      apply_url: $("f-url").value.trim(),
      skills,
      source: "clipper",
    },
  });

  if (res?.ok) {
    setStatus("success", "已保存到 InternPilot ✓");
    $("preview").style.display = "none";
    $("actions").style.display = "none";
  } else {
    setStatus("error", res?.error || "保存失败");
    $("btn-save").disabled = false;
    $("btn-save").textContent = "保存到 InternPilot";
  }
});

$("btn-retry").addEventListener("click", async () => {
  clearInterval(pollTimer);
  $("preview").style.display = "none";
  $("actions").style.display = "none";
  await sendMsg({ action: "clear" });
  await init();
});

init();
