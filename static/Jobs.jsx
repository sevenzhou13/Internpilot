// 岗位推荐页面

const STATUS_OPTIONS = ["未查看","感兴趣","已投递","笔试","一面","二面","HR面","Offer","拒绝","放弃","不合适"];
const ROLE_OPTIONS   = ["数据分析","AI产品","产品经理","用户研究","其他"];

const KANBAN_COLS = [
  { key:"未查看", label:"未查看", color:"#9CA3AF", bg:"#F3F4F6" },
  { key:"感兴趣", label:"感兴趣", color:"#6366F1", bg:"#EEF2FF" },
  { key:"已投递", label:"已投递", color:"#3B82F6", bg:"#EFF6FF" },
  { key:"笔试",   label:"笔试",   color:"#F59E0B", bg:"#FFFBEB" },
  { key:"一面",   label:"一面",   color:"#F97316", bg:"#FFF7ED" },
  { key:"二面",   label:"二面",   color:"#F97316", bg:"#FFF7ED" },
  { key:"HR面",   label:"HR 面",  color:"#EC4899", bg:"#FDF4FF" },
  { key:"Offer",  label:"Offer ✓",color:"#10B981", bg:"#ECFDF5" },
  { key:"结束",   label:"已结束", color:"#6B7280", bg:"#F9FAFB", statuses:["拒绝","放弃","不合适"] },
];

function KanbanCard({ job, onDetail, onStatusChange }) {
  const changeStatus = async (e) => {
    e.stopPropagation();
    await fetch(`/api/jobs/${job.id}/status`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status: e.target.value }) });
    onStatusChange();
  };
  return (
    <div onClick={() => onDetail(job)} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:10, padding:"12px 14px", marginBottom:8, cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", transition:"box-shadow 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.05)"}>
      <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:2 }}>{job.company || "未知公司"}</div>
      <div style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:4, lineHeight:1.3 }}>{job.title}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontSize:11, color:"#6B7280" }}>{job.location || "—"} · {job.role_type || "—"}</div>
        <MatchPill score={job.match_score} />
      </div>
      <select value={job.status} onChange={changeStatus} onClick={e=>e.stopPropagation()}
        style={{ width:"100%", padding:"4px 7px", border:"1px solid #E5E7EB", borderRadius:6, fontSize:11, color:"#6B7280", background:"#F9FAFB", cursor:"pointer", fontFamily:"Inter,sans-serif", outline:"none" }}>
        {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
      </select>
    </div>
  );
}

function KanbanView({ jobs, onDetail, onStatusChange, onDelete }) {
  return (
    <div style={{ overflowX:"auto", paddingBottom:16 }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", minWidth: `${KANBAN_COLS.length * 210}px` }}>
        {KANBAN_COLS.map(col => {
          const colJobs = jobs.filter(j =>
            col.statuses ? col.statuses.includes(j.status) : j.status === col.key
          );
          return (
            <div key={col.key} style={{ width:200, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, padding:"6px 10px", borderRadius:8, background:col.bg }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:col.color }} />
                  <span style={{ fontSize:12, fontWeight:700, color:col.color }}>{col.label}</span>
                </div>
                <span style={{ fontSize:11, color:col.color, fontWeight:600, background:"#fff", borderRadius:9999, padding:"1px 7px", border:`1px solid ${col.color}30` }}>{colJobs.length}</span>
              </div>
              <div style={{ minHeight:60 }}>
                {colJobs.map(job => (
                  <KanbanCard key={job.id} job={job} onDetail={onDetail} onStatusChange={onStatusChange} />
                ))}
                {colJobs.length === 0 && (
                  <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:"#D1D5DB" }}>暂无</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobCard({ job, onDetail, onResume, onInterview, onStatusChange, onDelete }) {
  const [hovered, setHovered] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const changeStatus = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    setUpdatingStatus(true);
    await fetch(`/api/jobs/${job.id}/status`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status: newStatus }) });
    setUpdatingStatus(false);
    onStatusChange();
  };

  return (
    <div
      onClick={() => onDetail(job)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow: hovered?"0 4px 12px rgba(0,0,0,0.08)":"0 1px 3px rgba(0,0,0,0.06)", transform: hovered?"translateY(-1px)":"none", transition:"all 150ms", cursor:"pointer" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:500, marginBottom:3 }}>{job.company || "未知公司"}</div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:"#111827" }}>{job.title}</div>
          <div style={{ fontSize:12, color:"#6B7280", marginTop:3 }}>{job.location || "—"} · {job.role_type || "—"}</div>
        </div>
        <MatchPill score={job.match_score} />
      </div>

      {job.skills && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          {job.skills.split(",").filter(Boolean).map(t => <Badge key={t} variant="primary">{t.trim()}</Badge>)}
        </div>
      )}

      {job.match_score != null && <MatchBar value={job.match_score} />}

      {job.recommendation_reason && (
        <div style={{ marginTop:8, fontSize:12, color:"#6B7280", lineHeight:1.5 }}>
          {job.recommendation_reason.slice(0, 120)}{job.recommendation_reason.length > 120 ? "…" : ""}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <StatusTag status={job.status} />
          <select value={job.status} onChange={changeStatus} disabled={updatingStatus} style={{ fontSize:11, border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 6px", color:"#6B7280", background:"#fff", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <Btn variant="ghost" size="sm" onClick={() => onDelete(job.id)}>
            <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={12} color="#EF4444" />
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => onInterview(job)}>面试准备</Btn>
          <Btn variant="primary" size="sm" onClick={() => onResume(job)}>生成简历</Btn>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImported }) {
  const { show, ToastContainer } = useToast();
  const [tab, setTab] = React.useState("smart");
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ company:"", title:"", location:"", role_type:"数据分析", jd_text:"", apply_url:"", skills:"" });
  const [clipJson, setClipJson] = React.useState("");
  const [smartText, setSmartText] = React.useState("");

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submitManual = async () => {
    if (!form.title.trim()) { show("岗位名称不能为空", "error"); return; }
    setLoading(true);
    await fetch("/api/jobs", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setLoading(false);
    onImported();
    onClose();
  };

  const submitClip = async () => {
    if (!clipJson.trim()) { show("请粘贴 JSON 内容", "error"); return; }
    setLoading(true);
    const res = await fetch("/api/jobs/clip", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ raw_json: clipJson }) });
    setLoading(false);
    if (res.ok) { onImported(); onClose(); }
    else { const d = await res.json(); show(d.detail || "导入失败", "error"); }
  };

  const parseSmart = async () => {
    const text = smartText.trim();
    if (!text) { show("请先粘贴 JD 内容", "error"); return; }
    setLoading(true);
    let d;
    try {
      const res = await fetch("/api/jd/parse", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ jd_text: text }) });
      const body = await res.json();
      if (!res.ok) { show(body.detail || "识别失败", "error"); setLoading(false); return; }
      d = body;
    } catch { show("网络错误，请重试", "error"); setLoading(false); return; }
    setLoading(false);
    if (d.error) { show("识别失败：" + d.error, "error"); return; }

    const resp = (d.responsibilities || []).map((r, i) => `${i+1}. ${r}`).join("\n");
    const reqs  = (d.requirements   || []).map((r, i) => `${i+1}. ${r}`).join("\n");
    let cleanJD = "";
    if (resp) cleanJD += `【岗位职责】\n${resp}\n\n`;
    if (reqs)  cleanJD += `【岗位要求】\n${reqs}`;
    if (!cleanJD) cleanJD = d.summary || text.slice(0, 2000);

    setForm({
      company: d.company || "",
      title: d.title || "",
      location: d.location || "",
      role_type: d.role_type || "数据分析",
      jd_text: cleanJD,
      apply_url: d.apply_url || "",
      skills: Array.isArray(d.skills) ? d.skills.join(", ") : (d.skills || ""),
    });
    setTab("manual");
    show("识别成功，请确认后保存");
  };

  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none" };
  const lbl = { fontSize:12, fontWeight:500, color:"#6B7280", marginBottom:4, display:"block" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:16, width:560, maxHeight:"85vh", overflow:"auto", boxShadow:"0 16px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:"#111827" }}>导入岗位</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:18 }}>×</button>
        </div>

        <div style={{ display:"flex", gap:0, borderBottom:"1px solid #E5E7EB" }}>
          {[["smart","✨ 智能识别"],["manual","手动填写"],["clip","Clipper JSON"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding:"10px 18px", border:"none", borderBottom: tab===id?"2px solid #6366F1":"2px solid transparent", background:"none", fontSize:13, fontWeight: tab===id?600:500, color: tab===id?"#6366F1":"#6B7280", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding:24 }}>
          {tab === "smart" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:13, color:"#6B7280", background:"#EEF2FF", borderRadius:8, padding:"10px 12px" }}>
                将招聘页面的 JD 文字全部复制粘贴到下方，AI 自动提取职责、要求、技能等结构化信息。
              </div>
              <textarea style={{...inp, minHeight:220, resize:"vertical"}} value={smartText} onChange={e=>setSmartText(e.target.value)} placeholder="粘贴 JD 原文（职责、要求、技能等）…" />
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Btn variant="outline" onClick={onClose}>取消</Btn>
                <Btn variant="primary" onClick={parseSmart} disabled={loading}>{loading ? <><Spinner size={12} /> 识别中…</> : "✨ 智能识别"}</Btn>
              </div>
            </div>
          )}
          {tab === "manual" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><span style={lbl}>公司名称</span><input style={inp} value={form.company} onChange={e=>setF("company",e.target.value)} placeholder="例：字节跳动" /></div>
                <div><span style={lbl}>岗位名称 *</span><input style={inp} value={form.title} onChange={e=>setF("title",e.target.value)} placeholder="例：数据分析实习生" /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><span style={lbl}>工作地点</span><input style={inp} value={form.location} onChange={e=>setF("location",e.target.value)} placeholder="例：上海" /></div>
                <div>
                  <span style={lbl}>岗位方向</span>
                  <select style={{...inp,cursor:"pointer"}} value={form.role_type} onChange={e=>setF("role_type",e.target.value)}>
                    {ROLE_OPTIONS.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div><span style={lbl}>技能关键词（逗号分隔）</span><input style={inp} value={form.skills} onChange={e=>setF("skills",e.target.value)} placeholder="SQL, Python, 数据分析" /></div>
              <div><span style={lbl}>投递链接</span><input style={inp} value={form.apply_url} onChange={e=>setF("apply_url",e.target.value)} placeholder="https://..." /></div>
              <div><span style={lbl}>JD 原文</span><textarea style={{...inp, minHeight:120, resize:"vertical"}} value={form.jd_text} onChange={e=>setF("jd_text",e.target.value)} placeholder="粘贴完整的岗位描述..." /></div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Btn variant="outline" onClick={onClose}>取消</Btn>
                <Btn variant="primary" onClick={submitManual} disabled={loading}>{loading ? "保存中…" : "保存岗位"}</Btn>
              </div>
            </div>
          )}
          {tab === "clip" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:13, color:"#6B7280", background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                在浏览器中点击 <b>InternPilot Clipper</b> 插件，复制 JSON 后粘贴到下方。
              </div>
              <textarea style={{...inp, minHeight:180, fontFamily:"'JetBrains Mono',monospace", fontSize:12, resize:"vertical"}} value={clipJson} onChange={e=>setClipJson(e.target.value)} placeholder={'{\n  "page_title": "...",\n  "url": "https://...",\n  ...\n}'} />
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Btn variant="outline" onClick={onClose}>取消</Btn>
                <Btn variant="primary" onClick={submitClip} disabled={loading}>{loading ? "导入中…" : "导入岗位"}</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

function Jobs({ onDetail, onResume, onInterview }) {
  const { jobs, refresh, llmOk, matchStatus, runMatchAll } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [showImport, setShowImport] = React.useState(false);
  const [filterRole, setFilterRole] = React.useState("全部");
  const [filterStatus, setFilterStatus] = React.useState("全部");
  const [viewMode, setViewMode] = React.useState("list"); // "list" | "kanban"
  const [search, setSearch] = React.useState("");

  const matching = matchStatus === "running";

  const deleteJob = async (id) => {
    const ok = await confirm({ title:"删除岗位", message:"确认删除此岗位？删除后无法恢复。" });
    if (!ok) return;
    await fetch(`/api/jobs/${id}`, { method:"DELETE" });
    await refresh();
  };

  const filtered = jobs.filter(j => {
    if (filterRole !== "全部" && j.role_type !== filterRole) return false;
    if (filterStatus !== "全部" && j.status !== filterStatus) return false;
    if (search && !j.title?.includes(search) && !j.company?.includes(search)) return false;
    return true;
  });

  const sel = { padding:"6px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#374151", background:"#fff", outline:"none", cursor:"pointer", fontFamily:"Inter,sans-serif" };

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:"#111827", marginBottom:3 }}>岗位推荐</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>共 {jobs.length} 个岗位 · {jobs.filter(j=>(j.match_score||0)>=80).length} 个高匹配</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* 视图切换 */}
          <div style={{ display:"flex", border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
            {[["list","列表","M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"],["kanban","看板","M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]].map(([mode, label, iconD]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ padding:"7px 12px", border:"none", background: viewMode===mode?"#6366F1":"transparent", color: viewMode===mode?"#fff":"#6B7280", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, fontFamily:"Inter,sans-serif", transition:"all 0.15s" }}>
                <Icon d={iconD} size={12} color={viewMode===mode?"#fff":"#6B7280"} />
                {label}
              </button>
            ))}
          </div>
          <Btn variant="secondary" size="md" onClick={runMatchAll} disabled={matching}>
            {matching ? <Spinner size={12} /> : <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" size={13} />}
            {matching ? "计算中…" : "重新计算匹配"}
          </Btn>
          <Btn variant="primary" size="md" onClick={() => setShowImport(true)}>
            <Icon d="M12 5v14M5 12h14" size={13} color="#fff" />
            导入岗位
          </Btn>
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="搜索岗位名称、公司..." style={{...sel, paddingLeft:30, width:"100%"}} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select style={sel} value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
          <option>全部</option>
          {ROLE_OPTIONS.map(o=><option key={o}>{o}</option>)}
        </select>
        <select style={sel} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option>全部</option>
          {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {jobs.length === 0 ? (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:40, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>💼</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#111827", marginBottom:8 }}>还没有岗位</div>
          <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:16 }}>点击「导入岗位」手动添加或使用 Clipper 插件</div>
          <Btn variant="primary" onClick={() => setShowImport(true)}>导入第一个岗位</Btn>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanView jobs={jobs} onDetail={onDetail} onStatusChange={refresh} onDelete={deleteJob} />
      ) : filtered.length === 0 ? (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:32, textAlign:"center", color:"#9CA3AF", fontSize:13 }}>
          没有符合条件的岗位
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
          {filtered.map(job => (
            <JobCard key={job.id} job={job} onDetail={onDetail} onResume={onResume} onInterview={onInterview} onStatusChange={refresh} onDelete={deleteJob} />
          ))}
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={refresh} />}
      {ConfirmModal}
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { Jobs });
