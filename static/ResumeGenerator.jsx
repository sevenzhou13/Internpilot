// 简历 Bullet 生成页面

// 模块级：跨页面保持流式生成状态
const _resumeState = { generating: false, jobId: null, content: "" };
let _resumeReader = null; // 当前流的 reader，用于取消

// 计算单条经历对某岗位的关键词匹配度（0-100）
function calcExpMatch(exp, job) {
  if (!job) return 0;

  const splitKws = (s) =>
    (s || "").replace(/，/g, ",").split(",").map(k => k.trim()).filter(k => k.length >= 2);

  const jobText = [job.skills || "", job.jd_text || "", job.title || ""]
    .join(" ").toLowerCase();

  // 经历关键词：优先用 keywords+tools，否则从全文提取
  let kws = [...splitKws(exp.keywords), ...splitKws(exp.tools)];
  if (kws.length === 0) {
    const raw = [exp.title, exp.background, exp.methods, exp.results].filter(Boolean).join(" ");
    const extracted = raw.match(/[一-龥]{2,6}|[a-zA-Z]{3,}/g) || [];
    kws = [...new Set(extracted)].slice(0, 15);
  }

  // 方向1：经历关键词 → 岗位文本
  let score1 = 0;
  if (kws.length > 0) {
    const matched = kws.map(k => k.toLowerCase()).filter(k => jobText.includes(k)).length;
    score1 = matched / kws.length;
  }

  // 方向2：岗位技能 → 经历全文
  const expText = [exp.keywords, exp.tools, exp.title, exp.background, exp.methods, exp.results]
    .filter(Boolean).join(" ").toLowerCase();
  const jobSkills = splitKws(job.skills);
  let score2 = 0;
  if (jobSkills.length > 0) {
    const matched = jobSkills.map(s => s.toLowerCase()).filter(s => expText.includes(s)).length;
    score2 = matched / jobSkills.length;
  }

  const combined = jobSkills.length > 0 ? score1 * 0.6 + score2 * 0.4 : score1;
  return Math.round(combined * 100);
}

// 解析 jd_text 中的结构化段落（复用 JobDetail 的逻辑）
function parseJDSections(text) {
  if (!text) return null;
  if (!text.includes("【")) return { raw: text };
  const sections = {};
  const parts = text.split(/【([^】]+)】/);
  for (let i = 1; i < parts.length; i += 2) {
    sections[parts[i].trim()] = parts[i + 1]?.trim() || "";
  }
  return Object.keys(sections).length ? sections : { raw: text };
}

function ResumeGenerator({ job: propJob }) {
  const { jobs, experiences, llmOk } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const [selectedJobId, setSelectedJobId] = React.useState(propJob?.id || (jobs[0]?.id ?? null));
  const [selectedExpIds, setSelectedExpIds] = React.useState(new Set());
  const isThisJobGenerating = _resumeState.generating && _resumeState.jobId === (propJob?.id || jobs[0]?.id || null);
  const [generating, setGenerating] = React.useState(isThisJobGenerating);
  const [result, setResult] = React.useState(
    isThisJobGenerating ? _resumeState.content || null : null
  );

  const job = jobs.find(j => j.id === selectedJobId) || jobs[0] || null;

  React.useEffect(() => {
    setSelectedExpIds(new Set(experiences.map(e => e.id)));
  }, [experiences]);

  React.useEffect(() => {
    if (propJob?.id) setSelectedJobId(propJob.id);
  }, [propJob]);

  // 切换岗位时读缓存或接管进行中的流
  React.useEffect(() => {
    if (!selectedJobId) return;
    if (_resumeState.generating && _resumeState.jobId === selectedJobId) {
      // 后台仍在生成：恢复已有内容并等待
      setGenerating(true);
      setResult(_resumeState.content || null);
    } else {
      setGenerating(false);
      const cached = sessionStorage.getItem(`resume_result_${selectedJobId}`);
      setResult(cached || null);
    }
  }, [selectedJobId]);

  // 轮询：后台流式生成时同步内容到 UI
  React.useEffect(() => {
    if (!generating || !selectedJobId) return;
    const iv = setInterval(() => {
      if (_resumeState.jobId === selectedJobId && _resumeState.content) {
        setResult(_resumeState.content);
      }
      if (!_resumeState.generating) {
        setGenerating(false);
        clearInterval(iv);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [generating, selectedJobId]);

  const toggleExp = (id) => setSelectedExpIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const cancelGenerate = () => {
    if (_resumeReader) { try { _resumeReader.cancel(); } catch {} _resumeReader = null; }
    _resumeState.generating = false;
    setGenerating(false);
  };

  const generate = async () => {
    if (!job) { show("请先选择岗位", "error"); return; }
    if (!llmOk) { show("未配置 API Key", "error"); return; }
    _resumeState.generating = true;
    _resumeState.jobId = job.id;
    _resumeState.content = "";
    sessionStorage.removeItem(`resume_result_${job.id}`);
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate/resume/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id, exp_ids: [...selectedExpIds] }),
      });
      if (!res.ok) {
        const d = await res.json();
        _resumeState.generating = false;
        setGenerating(false);
        show(d.detail || "生成失败", "error");
        return;
      }
      const reader = res.body.getReader();
      _resumeReader = reader;
      const decoder = new TextDecoder();
      let buf = "", full = "";
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
            if (p.error) { full = `⚠️ ${p.error}`; break; }
            if (p.content) {
              full += p.content;
              _resumeState.content = full;        // 后台持续更新模块变量
              setResult(full);                    // 若已卸载则为空操作，轮询会补上
            }
          } catch {}
        }
      }
      if (full && !full.startsWith("⚠️")) {
        sessionStorage.setItem(`resume_result_${job.id}`, full);
      }
    } catch (e) {
      if (!e?.message?.includes("cancel")) show("网络错误，请重试", "error");
    }
    _resumeReader = null;
    _resumeState.generating = false;
    setGenerating(false);
  };

  const [history, setHistory] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const loadHistory = async () => {
    if (!selectedJobId) return;
    const res = await fetch(`/api/generate/history/${selectedJobId}?output_type=resume_bullet`);
    if (res.ok) setHistory(await res.json());
  };

  const copy = () => { navigator.clipboard.writeText(result || ""); show("已复制"); };

  const sel = { padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#374151", background:"#fff", outline:"none", cursor:"pointer", fontFamily:"Inter,sans-serif", width:"100%" };

  return (
    <div style={{ flex:1, overflow:"hidden", background:"#F8F9FB", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"20px 32px 0", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:"#111827", marginBottom:3 }}>简历生成</h1>
            {job && (
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#9CA3AF" }}>
                <span>目标岗位：</span>
                <span style={{ color:"#111827", fontWeight:600 }}>{job.company || "—"} · {job.title}</span>
                <MatchPill score={job.match_score} />
              </div>
            )}
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <select style={{...sel, maxWidth:500}} value={selectedJobId || ""} onChange={e => setSelectedJobId(Number(e.target.value))}>
            {jobs.map(j => {
              const kws = (j.skills||"").split(",").filter(Boolean).slice(0,3).join(", ");
              return <option key={j.id} value={j.id}>{j.company||"—"} · {j.title}{kws ? ` [${kws}]` : ""}</option>;
            })}
          </select>
        </div>
      </div>

      <div style={{ flex:1, display:"grid", gridTemplateColumns:"280px 1fr 1fr", gap:14, padding:"0 32px 32px", overflowY:"auto" }}>
        {/* Col 1: JD 摘要 */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", overflowY:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>岗位需求摘要</div>
          {job ? (() => {
            const sections = parseJDSections(job.jd_text);
            return (
              <div>
                {job.skills && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>技能关键词</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {job.skills.split(",").filter(Boolean).map(t => <Badge key={t} variant="primary">{t.trim()}</Badge>)}
                    </div>
                  </div>
                )}
                {sections ? (
                  sections.raw ? (
                    <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{sections.raw.slice(0,400)}{sections.raw.length>400?"…":""}</div>
                  ) : (
                    Object.entries(sections).map(([title, content]) => (
                      <div key={title} style={{ marginBottom:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:3, height:12, background:"#6366F1", borderRadius:2 }} />{title}
                        </div>
                        <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{content}</div>
                      </div>
                    ))
                  )
                ) : <div style={{ fontSize:12, color:"#9CA3AF" }}>请先导入 JD 内容</div>}
              </div>
            );
          })() : <div style={{ fontSize:13, color:"#9CA3AF" }}>请先选择岗位</div>}
        </div>

        {/* Col 2: 经历选择（按匹配度排序） */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", overflowY:"auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em" }}>选择经历（按匹配度排序）</div>
            <button onClick={() => {
              const allSelected = experiences.every(e => selectedExpIds.has(e.id));
              setSelectedExpIds(allSelected ? new Set() : new Set(experiences.map(e=>e.id)));
            }} style={{ fontSize:11, color:"#6366F1", background:"none", border:"1px solid #C7D2FE", borderRadius:5, padding:"2px 8px", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              {experiences.every(e => selectedExpIds.has(e.id)) ? "全取消" : "全选"}
            </button>
          </div>
          {experiences.length === 0 ? (
            <div style={{ fontSize:13, color:"#9CA3AF", textAlign:"center", padding:"20px 0" }}>请先在「个人背景库」录入经历</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[...experiences]
                .map(exp => ({ ...exp, _score: calcExpMatch(exp, job) }))
                .sort((a, b) => b._score - a._score)
                .map(exp => {
                  const checked = selectedExpIds.has(exp.id);
                  const score = exp._score;
                  const scoreColor = score >= 60 ? "#10B981" : score >= 30 ? "#F59E0B" : "#9CA3AF";
                  return (
                    <div key={exp.id} onClick={() => toggleExp(exp.id)} style={{ padding:"10px 12px", borderRadius:8, cursor:"pointer", border: checked?"1.5px solid #6366F1":"1px solid #E5E7EB", background: checked?"#EEF2FF":"#F9FAFB", transition:"all 120ms" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, fontWeight:600, color:"#111827" }}>{exp.title}</div>
                          <div style={{ fontSize:11, color:"#9CA3AF", marginTop:1 }}>{exp.type}</div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, color: scoreColor, background: scoreColor+"18", borderRadius:4, padding:"2px 6px" }}>
                            {score}%
                          </div>
                          <div style={{ width:16, height:16, borderRadius:4, border: checked?"none":"1.5px solid #D1D5DB", background: checked?"#6366F1":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                          </div>
                        </div>
                      </div>
                      {exp.keywords && <div style={{ fontSize:11, color:"#6B7280", marginTop:4 }}>{exp.keywords.slice(0,60)}</div>}
                    </div>
                  );
              })}
            </div>
          )}
          <div style={{ marginTop:12 }}>
            {generating ? (
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="primary" size="md" style={{ flex:1, justifyContent:"center" }} disabled>
                  <Spinner size={12} /> 生成中…
                </Btn>
                <Btn variant="outline" size="md" onClick={cancelGenerate} style={{ flexShrink:0 }}>取消</Btn>
              </div>
            ) : (
              <Btn variant="primary" size="md" style={{ width:"100%", justifyContent:"center" }} onClick={generate} disabled={!job || !llmOk}>
                ✨ 生成 Bullet Points
              </Btn>
            )}
            {!llmOk && <div style={{ fontSize:11, color:"#D97706", marginTop:6, textAlign:"center" }}>需要配置 API Key</div>}
          </div>
        </div>

        {/* Col 3: 生成结果 */}
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", overflowY:"auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em" }}>生成结果</div>
            {result && <div style={{ display:"flex", gap:6 }}><Btn variant="outline" size="sm" onClick={copy}>复制全部</Btn></div>}
          </div>
          {generating && !result ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, flexDirection:"column", gap:12 }}>
              <Spinner size={24} />
              <div style={{ fontSize:13, color:"#9CA3AF" }}>AI 生成中，可切换页面，完成后自动显示…</div>
            </div>
          ) : result ? (
            <div>
              <div style={{ fontSize:11, color:"#D97706", background:"#FFFBEB", borderRadius:6, padding:"6px 10px", marginBottom:10 }}>
                ⚠️ 以下内容由 AI 生成，投递前请人工核查，确认无编造信息
              </div>
              <div className="md" style={{ fontSize:13, color:"#374151" }} dangerouslySetInnerHTML={{ __html: marked.parse(result) }} />
              <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid #F3F4F6" }}>
                <button onClick={async()=>{await loadHistory();setShowHistory(v=>!v);}}
                  style={{ fontSize:11, color:"#9CA3AF", background:"none", border:"none", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                  {showHistory ? "▲ 收起历史版本" : "▼ 查看历史版本"}
                </button>
                {showHistory && history.length > 0 && (
                  <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
                    {history.slice(0,5).map((h,i) => (
                      <div key={h.id} style={{ padding:"8px 10px", background:"#F9FAFB", borderRadius:8, border:"1px solid #E5E7EB" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:"#9CA3AF" }}>版本 {history.length-i} · {h.created_at?.slice(0,16).replace("T"," ")}</span>
                          <button onClick={()=>setResult(h.content)} style={{ fontSize:11, color:"#6366F1", background:"none", border:"none", cursor:"pointer" }}>加载此版本</button>
                        </div>
                        <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.5 }}>{h.content.slice(0,80)}…</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize:13, color:"#9CA3AF", textAlign:"center", padding:"40px 0" }}>
              选择经历后点击「生成 Bullet Points」
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { ResumeGenerator });
