// 个人背景页面

const DEFAULT_TYPES = ["实习经历","科研经历","项目经历","校园经历","竞赛经历","志愿服务","技能/证书","其他"];

// 自定义分类存 localStorage
const loadCustomTypes = () => { try { return JSON.parse(localStorage.getItem("custom_exp_types") || "[]"); } catch { return []; } };
const saveCustomTypes = (arr) => localStorage.setItem("custom_exp_types", JSON.stringify(arr));

// ── 经历详情/编辑弹窗 ─────────────────────────────────────────────────────────

function ExperienceDetailModal({ exp, onClose, onSaved, onDeleted, allTypes }) {
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [form, setForm] = React.useState({ ...exp });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const extractKeywords = async () => {
    setExtracting(true);
    const res = await fetch(`/api/experiences/${exp.id}/extract-keywords`, { method:"POST" });
    setExtracting(false);
    if (res.ok) { const d = await res.json(); setForm(f=>({...f, keywords:d.keywords})); show("关键词已提取，记得保存"); }
    else { const d = await res.json(); show(d.detail||"提取失败","error"); }
  };

  const save = async () => {
    if (!form.title.trim()) { show("经历名称不能为空", "error"); return; }
    setSaving(true);
    const res = await fetch(`/api/experiences/${exp.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { show("已保存"); setEditing(false); onSaved(); }
    else show("保存失败", "error");
  };

  const del = async () => {
    const ok = await confirm({ title:"删除经历", message:`确认删除「${exp.title}」？删除后无法恢复。` });
    if (!ok) return;
    await fetch(`/api/experiences/${exp.id}`, { method:"DELETE" });
    onDeleted(); onClose();
  };

  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none" };
  const lbl = { fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5, display:"block" };

  const Section = ({ label, value, field, multiline }) => {
    if (!editing && !value) return null;
    return (
      <div style={{ marginBottom:16 }}>
        <span style={lbl}>{label}</span>
        {editing ? (
          multiline
            ? <textarea style={{...inp, minHeight:70, resize:"vertical"}} value={form[field]||""} onChange={e=>setF(field,e.target.value)} />
            : <input style={inp} value={form[field]||""} onChange={e=>setF(field,e.target.value)} />
        ) : (
          <div style={{ fontSize:13, color:"#374151", lineHeight:1.75, whiteSpace:"pre-wrap" }}>{value}</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:16, width:580, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #E5E7EB", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1, marginRight:12 }}>
              {editing
                ? <input style={{...inp, fontSize:16, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif"}} value={form.title} onChange={e=>setF("title",e.target.value)} />
                : <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:"#111827" }}>{exp.title}</h3>
              }
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                {editing
                  ? <select style={{ padding:"4px 8px", border:"1px solid #E5E7EB", borderRadius:6, fontSize:12, color:"#374151", outline:"none", fontFamily:"Inter,sans-serif" }} value={form.type||""} onChange={e=>setF("type",e.target.value)}>
                      {allTypes.map(t=><option key={t}>{t}</option>)}
                    </select>
                  : <Badge variant="neutral">{exp.type || "其他"}</Badge>
                }
                {editing
                  ? <input placeholder="担任职务，如：负责人、一作" value={form.role||""} onChange={e=>setF("role",e.target.value)}
                      style={{ padding:"4px 8px", border:"1px solid #E5E7EB", borderRadius:6, fontSize:12, outline:"none", fontFamily:"Inter,sans-serif", width:160 }} />
                  : exp.role && <span style={{ fontSize:11, fontWeight:600, color:"#6366F1", background:"#EEF2FF", borderRadius:4, padding:"2px 8px" }}>{exp.role}</span>
                }
                {editing
                  ? <input placeholder="时间节点，如：2024.06 - 2024.09" value={form.duration||""} onChange={e=>setF("duration",e.target.value)}
                      style={{ padding:"4px 8px", border:"1px solid #E5E7EB", borderRadius:6, fontSize:12, outline:"none", fontFamily:"Inter,sans-serif", width:180 }} />
                  : exp.duration && <span style={{ fontSize:11, color:"#9CA3AF" }}>📅 {exp.duration}</span>
                }
                {!editing && <span style={{ fontSize:11, color:"#D1D5DB" }}>|</span>}
                <span style={{ fontSize:11, color:"#9CA3AF" }}>{exp.created_at?.slice(0,10)}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {!editing && <Btn variant="outline" size="sm" onClick={() => setEditing(true)}>✏️ 编辑</Btn>}
              <Btn variant="ghost" size="sm" onClick={del}><Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={13} color="#EF4444" /></Btn>
              <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:18, padding:"4px 6px" }}>×</button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          <Section label="项目背景 / 担任职务" value={exp.background} field="background" multiline />
          <Section label="工作内容 / 主要职责" value={exp.methods} field="methods" multiline />
          <Section label="成果与产出" value={exp.results} field="results" multiline />

          {(editing || exp.tools) && (
            <div style={{ marginBottom:16 }}>
              <span style={lbl}>工具 / 技术</span>
              {editing
                ? <input style={inp} value={form.tools||""} onChange={e=>setF("tools",e.target.value)} placeholder="Python, SQL, Figma..." />
                : <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {(exp.tools||"").split(",").filter(Boolean).map(t=><span key={t} style={{ background:"#F3F4F6", color:"#374151", borderRadius:5, padding:"2px 8px", fontSize:12 }}>🔧 {t.trim()}</span>)}
                  </div>
              }
            </div>
          )}

          {(editing || exp.keywords) && (
            <div style={{ marginBottom:16 }}>
              <span style={lbl}>技能关键词</span>
              {editing
                ? <div style={{ display:"flex", gap:8 }}>
                    <input style={{...inp, flex:1}} value={form.keywords||""} onChange={e=>setF("keywords",e.target.value)} placeholder="数据分析, A/B测试, ..." />
                    <button onClick={extractKeywords} disabled={extracting} style={{ padding:"0 10px", borderRadius:8, border:"1px solid #C7D2FE", background:"#EEF2FF", color:"#6366F1", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif", whiteSpace:"nowrap" }}>
                      {extracting ? <Spinner size={10} /> : "✨ AI提取"}
                    </button>
                  </div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {(exp.keywords||"").split(",").filter(Boolean).map(k=><Badge key={k} variant="primary">{k.trim()}</Badge>)}
                  </div>
              }
            </div>
          )}

          {(editing || exp.raw_bullet) && (
            <div style={{ marginBottom:8 }}>
              <span style={lbl}>原始简历表述</span>
              {editing
                ? <textarea style={{...inp, minHeight:70, resize:"vertical"}} value={form.raw_bullet||""} onChange={e=>setF("raw_bullet",e.target.value)} />
                : <div style={{ fontSize:12.5, color:"#6B7280", lineHeight:1.7, background:"#F9FAFB", borderRadius:8, padding:"10px 12px", whiteSpace:"pre-wrap" }}>{exp.raw_bullet}</div>
              }
            </div>
          )}
        </div>

        {/* Footer */}
        {editing && (
          <div style={{ padding:"14px 24px", borderTop:"1px solid #E5E7EB", display:"flex", gap:8, justifyContent:"flex-end", flexShrink:0 }}>
            <Btn variant="outline" onClick={() => { setForm({...exp}); setEditing(false); }}>取消</Btn>
            <Btn variant="primary" onClick={save} disabled={saving}>{saving?"保存中…":"保存修改"}</Btn>
          </div>
        )}
      </div>
      {ConfirmModal}
      <ToastContainer />
    </div>
  );
}

// ── 经历卡片 ──────────────────────────────────────────────────────────────────

function ExperienceCard({ exp, onDelete, onEdit, allTypes, selected, onSelect }) {
  const [hovered, setHovered] = React.useState(false);
  const [showDetail, setShowDetail] = React.useState(false);
  return (
    <>
      <div onClick={() => onSelect ? onSelect() : setShowDetail(true)}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ background:"#fff", border: selected?"1.5px solid #6366F1":"1px solid #E5E7EB", borderRadius:12, padding:"16px 18px", cursor:"pointer",
          background: selected?"#EEF2FF":"#fff",
          boxShadow: hovered?"0 4px 12px rgba(0,0,0,0.08)":"0 1px 3px rgba(0,0,0,0.06)",
          transform: hovered?"translateY(-1px)":"none", transition:"all 150ms" }}>

        {/* 顶部：[checkbox?] 分类 + 删除 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            {onSelect !== undefined && (
              <div style={{ width:16, height:16, borderRadius:4, border:selected?"none":"1.5px solid #D1D5DB", background:selected?"#6366F1":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {selected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
            )}
            <Badge variant="neutral">{exp.type || "其他"}</Badge>
          </div>
          <button onClick={e=>{e.stopPropagation();onDelete(exp.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", padding:2 }}
            onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color="#D1D5DB"}>
            <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={13} />
          </button>
        </div>

        {/* 经历名称 */}
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, color:"#111827", marginBottom:4, lineHeight:1.3 }}>{exp.title}</div>

        {/* 职务 + 时间 */}
        <div style={{ display:"flex", gap:8, marginBottom:6, flexWrap:"wrap" }}>
          {exp.role && <span style={{ fontSize:11, fontWeight:600, color:"#6366F1", background:"#EEF2FF", borderRadius:4, padding:"1px 7px" }}>{exp.role}</span>}
          {exp.duration && <span style={{ fontSize:11, color:"#9CA3AF" }}>📅 {exp.duration}</span>}
        </div>

        {/* 背景摘要 */}
        {exp.background && <p style={{ fontSize:12, color:"#6B7280", lineHeight:1.6, marginBottom:6 }}>{exp.background.slice(0,80)}{exp.background.length>80?"…":""}</p>}

        {/* 成果片段 */}
        {exp.results && <p style={{ fontSize:12, color:"#059669", lineHeight:1.5, marginBottom:6, fontWeight:500 }}>↗ {exp.results.slice(0,60)}{exp.results.length>60?"…":""}</p>}

        {/* 关键词 */}
        {exp.keywords ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
            {exp.keywords.split(",").filter(Boolean).slice(0,4).map(s=><Badge key={s} variant="primary">{s.trim()}</Badge>)}
          </div>
        ) : (
          <div style={{ fontSize:11, color:"#F59E0B", marginBottom:6 }}>⚠️ 未填写关键词，影响匹配度</div>
        )}

        {/* 工具 */}
        {exp.tools && <div style={{ fontSize:11, color:"#9CA3AF" }}>🔧 {exp.tools.slice(0,50)}{exp.tools.length>50?"…":""}</div>}
      </div>

      {showDetail && (
        <ExperienceDetailModal
          exp={exp}
          allTypes={allTypes}
          onClose={() => setShowDetail(false)}
          onSaved={() => { onEdit(); setShowDetail(false); }}
          onDeleted={() => { onDelete(exp.id, true); setShowDetail(false); }}
        />
      )}
    </>
  );
}

// ── 分类管理 ──────────────────────────────────────────────────────────────────

function CategoryManager({ customTypes, onChange }) {
  const [newType, setNewType] = React.useState("");
  const add = () => {
    const t = newType.trim();
    if (!t || [...DEFAULT_TYPES, ...customTypes].includes(t)) return;
    const next = [...customTypes, t];
    saveCustomTypes(next);
    onChange(next);
    setNewType("");
  };
  const del = (t) => {
    const next = customTypes.filter(x => x !== t);
    saveCustomTypes(next);
    onChange(next);
  };
  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>经历分类管理</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
        {DEFAULT_TYPES.map(t => (
          <span key={t} style={{ padding:"4px 10px", borderRadius:9999, background:"#F3F4F6", color:"#6B7280", fontSize:12 }}>{t}</span>
        ))}
        {customTypes.map(t => (
          <span key={t} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:9999, background:"#EEF2FF", color:"#4338CA", fontSize:12, border:"1px solid #C7D2FE" }}>
            {t}
            <button onClick={() => del(t)} style={{ background:"none", border:"none", cursor:"pointer", color:"#6366F1", fontSize:13, lineHeight:1, padding:0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input value={newType} onChange={e=>setNewType(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
          placeholder="输入新分类名称，回车添加" style={{ flex:1, padding:"6px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", fontFamily:"Inter,sans-serif" }} />
        <Btn variant="outline" size="sm" onClick={add}>+ 添加</Btn>
      </div>
    </div>
  );
}

// ── 添加经历表单 ───────────────────────────────────────────────────────────────

function ExperienceForm({ onClose, onSaved, allTypes }) {
  const { show, ToastContainer } = useToast();
  const [tab, setTab] = React.useState("smart");
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ title:"", type:allTypes[0]||"其他", background:"", methods:"", tools:"", results:"", keywords:"", target_roles:"", raw_bullet:"" });
  const [smartText, setSmartText] = React.useState("");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) { show("经历名称不能为空", "error"); return; }
    setLoading(true);
    await fetch("/api/experiences", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setLoading(false);
    onSaved(); onClose(); // onSaved = afterChange，会触发重算
  };

  const parseSmart = async () => {
    if (!smartText.trim()) { show("请先粘贴经历内容", "error"); return; }
    setLoading(true);
    const res = await fetch("/api/experiences/parse-text", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ text: smartText }) });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); show(d.detail || "识别失败", "error"); return; }
    const d = await res.json();
    setForm({ title:d.title||"", type:d.type||allTypes[0]||"其他", background:d.background||"", methods:d.methods||"", tools:d.tools||"", results:d.results||"", keywords:d.keywords||"", target_roles:d.target_roles||"", raw_bullet:d.raw_bullet||smartText.slice(0,200) });
    setTab("manual");
    show("识别成功，请确认后保存");
  };

  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none" };
  const lbl = { fontSize:12, fontWeight:500, color:"#6B7280", marginBottom:4, display:"block" };

  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"22px 24px", boxShadow:"0 8px 24px rgba(0,0,0,0.08)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:"#111827" }}>添加新经历</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:18 }}>×</button>
      </div>
      <div style={{ display:"flex", borderBottom:"1px solid #E5E7EB", marginBottom:16 }}>
        {[["smart","✨ 智能识别"],["manual","手动填写"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"8px 16px", border:"none", borderBottom: tab===id?"2px solid #6366F1":"2px solid transparent", background:"none", fontSize:13, fontWeight:tab===id?600:500, color:tab===id?"#6366F1":"#6B7280", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>{label}</button>
        ))}
      </div>
      {tab === "smart" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:13, color:"#6B7280", background:"#EEF2FF", borderRadius:8, padding:"10px 12px" }}>将经历描述粘贴到下方，AI 自动提取结构化字段。</div>
          <textarea style={{...inp, minHeight:180, resize:"vertical"}} value={smartText} onChange={e=>setSmartText(e.target.value)} placeholder="粘贴经历描述…" />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="outline" onClick={onClose}>取消</Btn>
            <Btn variant="primary" onClick={parseSmart} disabled={loading}>{loading ? <><Spinner size={12} /> 识别中…</> : "✨ 智能识别"}</Btn>
          </div>
        </div>
      )}
      {tab === "manual" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><span style={lbl}>经历名称 *</span><input style={inp} value={form.title} onChange={e=>setF("title",e.target.value)} /></div>
            <div><span style={lbl}>类别</span>
              <select style={{...inp,cursor:"pointer"}} value={form.type} onChange={e=>setF("type",e.target.value)}>
                {allTypes.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><span style={lbl}>担任职务（可选）</span><input style={inp} value={form.role||""} onChange={e=>setF("role",e.target.value)} placeholder="如：负责人、第一作者、实习生" /></div>
            <div><span style={lbl}>时间节点（可选）</span><input style={inp} value={form.duration||""} onChange={e=>setF("duration",e.target.value)} placeholder="如：2024.06 - 2024.09" /></div>
          </div>
          <div><span style={lbl}>项目背景</span><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.background} onChange={e=>setF("background",e.target.value)} placeholder="这个项目解决什么问题？" /></div>
          <div><span style={lbl}>方法与过程</span><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.methods} onChange={e=>setF("methods",e.target.value)} /></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><span style={lbl}>工具 / 技术</span><input style={inp} value={form.tools} onChange={e=>setF("tools",e.target.value)} placeholder="Python, SQL..." /></div>
            <div><span style={lbl}>关键词（逗号分隔）</span><input style={inp} value={form.keywords} onChange={e=>setF("keywords",e.target.value)} /></div>
          </div>
          <div><span style={lbl}>结果与产出</span><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.results} onChange={e=>setF("results",e.target.value)} /></div>
          <div><span style={lbl}>原始简历表述（可选）</span><textarea style={{...inp,minHeight:50,resize:"vertical"}} value={form.raw_bullet} onChange={e=>setF("raw_bullet",e.target.value)} /></div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="outline" onClick={onClose}>取消</Btn>
            <Btn variant="primary" onClick={submit} disabled={loading}>{loading?"保存中…":"保存经历"}</Btn>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

// ── 教育背景 ──────────────────────────────────────────────────────────────────

const EDU_LEVELS = ["本科","硕士","博士","专科","其他"];

const SEEKING_TYPES = ["应届校招", "日常实习", "两者均可"];

function SeekingTypeBadge({ value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:11, color:"#9CA3AF" }}>求职类型：</span>
      {SEEKING_TYPES.map(t => (
        <button key={t} onClick={() => onChange(t === value ? "" : t)}
          style={{ padding:"2px 10px", borderRadius:9999, border:`1.5px solid ${value===t?"#6366F1":"#E5E7EB"}`, background:value===t?"#6366F1":"#fff", color:value===t?"#fff":"#6B7280", fontSize:11, fontWeight:value===t?600:400, cursor:"pointer", fontFamily:"Inter,sans-serif", transition:"all 100ms" }}>
          {t}
        </button>
      ))}
    </div>
  );
}

function EducationSection({ education, onSaved }) {
  const { show } = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ degree:"硕士", school:"", major:"", graduation_year:"" });
  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:12, fontWeight:500, color:"#6B7280", marginBottom:4, display:"block" };

  const save = async () => {
    if (!form.school.trim() && !form.major.trim()) { show("请至少填写院校或专业", "error"); return; }
    await fetch("/api/education", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setForm({ degree:"硕士", school:"", major:"", graduation_year:"" });
    setAdding(false); onSaved(); show("已添加");
  };
  const del = async (id) => {
    const ok = await confirm({ title:"删除教育经历", message:"确认删除此条教育经历？" });
    if (!ok) return;
    await fetch(`/api/education/${id}`, { method:"DELETE" });
    onSaved(); show("已删除");
  };

  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em" }}>教育背景</div>
        <Btn variant="outline" size="sm" onClick={() => setAdding(a=>!a)}>{adding?"收起":"+ 添加"}</Btn>
      </div>
      {education.length === 0 && !adding && <div style={{ fontSize:13, color:"#9CA3AF" }}>暂无教育经历</div>}
      {education.map(edu => (
        <div key={edu.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#F9FAFB", borderRadius:8, marginBottom:8 }}>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[["学历",edu.degree],["院校",edu.school],["专业",edu.major],["毕业年份",edu.graduation_year]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k}><div style={{ fontSize:10, color:"#9CA3AF", marginBottom:1 }}>{k}</div><div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{v}</div></div>
            ))}
          </div>
          <Btn variant="ghost" size="sm" onClick={() => del(edu.id)}>
            <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={12} color="#EF4444" />
          </Btn>
        </div>
      ))}
      {adding && (
        <div style={{ marginTop:12, padding:"14px 16px", background:"#F9FAFB", borderRadius:10, border:"1px solid #E5E7EB" }}>
          <div style={{ display:"grid", gridTemplateColumns:"100px 1fr 1fr 100px", gap:10, marginBottom:10 }}>
            <div><span style={lbl}>学历</span><select style={{...inp,cursor:"pointer"}} value={form.degree} onChange={e=>setForm(f=>({...f,degree:e.target.value}))}>{EDU_LEVELS.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><span style={lbl}>院校</span><input style={inp} value={form.school} onChange={e=>setForm(f=>({...f,school:e.target.value}))} placeholder="例：复旦大学" /></div>
            <div><span style={lbl}>专业</span><input style={inp} value={form.major} onChange={e=>setForm(f=>({...f,major:e.target.value}))} placeholder="例：计算机科学" /></div>
            <div><span style={lbl}>毕业年份</span><input style={inp} value={form.graduation_year} onChange={e=>setForm(f=>({...f,graduation_year:e.target.value}))} placeholder="2025" /></div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <Btn variant="outline" size="sm" onClick={() => setAdding(false)}>取消</Btn>
            <Btn variant="primary" size="sm" onClick={save}>保存</Btn>
          </div>
        </div>
      )}
      {ConfirmModal}
    </div>
  );
}

// ── 简历导入弹窗 ───────────────────────────────────────────────────────────────

// 标题相似度（Jaccard 字符二元组）
function titleSimilarity(a, b) {
  const norm = s => (s||"").toLowerCase().replace(/[\s\-·（）()【】]/g, "");
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb || na.includes(nb) || nb.includes(na)) return 1;
  const bigrams = s => new Set([...Array(Math.max(0,s.length-1))].map((_,i)=>s.slice(i,i+2)));
  const ba = bigrams(na), bb = bigrams(nb);
  const inter = [...ba].filter(x=>bb.has(x)).length;
  const union = new Set([...ba,...bb]).size;
  return union === 0 ? 0 : inter / union;
}

function ResumeImportModal({ onClose, onImported, allTypes, existingExps }) {
  const { show, ToastContainer } = useToast();
  const fileRef = React.useRef(null);
  const [step, setStep] = React.useState("paste");
  const [text, setText] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [parsed, setParsed] = React.useState(null);
  const [selEdu, setSelEdu] = React.useState(new Set());
  const [selExp, setSelExp] = React.useState(new Set());
  const [expTypes, setExpTypes] = React.useState({});
  // duplicate resolution: "both" | "skip" | "replace"
  const [dupRes, setDupRes] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  // 检测重复：返回 { [parsedIndex]: existingExp }
  const detectDupes = (exps) => {
    const dupes = {};
    (exps || []).forEach((pe, i) => {
      const match = existingExps.find(ee => titleSimilarity(pe.title, ee.title) >= 0.6);
      if (match) dupes[i] = match;
    });
    return dupes;
  };

  const [dupes, setDupes] = React.useState({});

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const suffix = file.name.split(".").pop().toLowerCase();
    if (suffix === "txt") {
      const reader = new FileReader();
      reader.onload = ev => setText(ev.target.result.slice(0, 8000));
      reader.readAsText(file, "utf-8");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/resume/upload", { method:"POST", body: form });
      const d = await res.json();
      if (!res.ok) { show(d.detail || "文件解析失败", "error"); return; }
      setText(d.text);
    } catch { show("上传失败，请重试", "error"); }
    finally { setUploading(false); }
  };

  const parse = async () => {
    if (!text.trim()) { show("请先粘贴简历内容或上传文件", "error"); return; }
    setParsing(true);
    try {
      const res = await fetch("/api/resume/parse", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ text }) });
      const d = await res.json();
      if (!res.ok) { show(d.detail || "解析失败", "error"); return; }
      setParsed(d);
      setSelEdu(new Set((d.education||[]).map((_,i)=>i)));
      setSelExp(new Set((d.experiences||[]).map((_,i)=>i)));
      const types = {};
      (d.experiences||[]).forEach((e,i) => { types[i] = e.type || allTypes[0] || "其他"; });
      setExpTypes(types);
      const detected = detectDupes(d.experiences);
      setDupes(detected);
      // 有重复的默认设为 "both"
      const res2 = {};
      Object.keys(detected).forEach(i => { res2[i] = "both"; });
      setDupRes(res2);
      setStep("preview");
    } catch { show("网络错误，请重试", "error"); }
    finally { setParsing(false); }
  };

  const toggleSelExp = (i) => setSelExp(s => { const n=new Set(s); n.has(i)?n.delete(i):n.add(i); return n; });

  const save = async () => {
    setSaving(true);
    const edu = (parsed.education||[]).filter((_,i) => selEdu.has(i));
    const expList = (parsed.experiences||[])
      .map((e,i) => ({ ...e, _i:i, type: expTypes[i] || e.type || "其他" }))
      .filter(e => selExp.has(e._i) && dupRes[e._i] !== "skip");

    for (const e of edu) {
      await fetch("/api/education", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(e) });
    }
    for (const e of expList) {
      if (dupRes[e._i] === "replace" && dupes[e._i]) {
        await fetch(`/api/experiences/${dupes[e._i].id}`, { method:"DELETE" });
      }
      const { _i, ...data } = e;
      await fetch("/api/experiences", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    }
    setSaving(false);
    const imported = edu.length + expList.length;
    show(`已导入 ${edu.length} 条教育经历、${expList.length} 条项目经历`);
    onImported(); onClose();
  };

  const totalSel = selEdu.size + [...selExp].filter(i => dupRes[i] !== "skip").length;
  const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" };
  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none" };
  const Checkbox = ({checked}) => (
    <div style={{ width:18, height:18, borderRadius:4, border:checked?"none":"1.5px solid #D1D5DB", background:checked?"#6366F1":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
    </div>
  );

  return (
    <div style={overlay}>
      <div style={{ background:"#fff", borderRadius:16, width:660, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:"#111827" }}>
              {step==="paste" ? "📄 导入简历" : "✅ 确认导入内容"}
            </h3>
            <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>
              {step==="paste" ? "支持粘贴文字 或 上传 PDF / DOCX / TXT 文件" : `识别到 ${(parsed?.education||[]).length} 条教育 · ${(parsed?.experiences||[]).length} 条经历${Object.keys(dupes).length>0?" · ⚠️ "+Object.keys(dupes).length+" 条有重复":""}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:20 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {step === "paste" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* 文件上传区 */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#F9FAFB", border:"1.5px dashed #D1D5DB", borderRadius:10 }}>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display:"none" }} onChange={handleFileSelect} />
                <Btn variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <><Spinner size={11} /> 解析中…</> : "📂 选择文件"}
                </Btn>
                <span style={{ fontSize:12, color: fileName?"#374151":"#9CA3AF" }}>{fileName || "支持 PDF、DOCX、TXT"}</span>
                {text && fileName && <span style={{ fontSize:11, color:"#10B981", marginLeft:"auto" }}>✓ 已提取文字</span>}
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
                <span style={{ fontSize:12, color:"#9CA3AF" }}>或直接粘贴</span>
                <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
              </div>

              <textarea style={{...inp, minHeight:260, resize:"vertical", fontSize:12.5, lineHeight:1.6}}
                value={text} onChange={e=>{ setText(e.target.value); if(fileName) setFileName(""); }}
                placeholder={"粘贴简历全文…\n\n教育背景\n复旦大学  计算机科学  硕士  2023-2026\n...\n\n实习经历\n字节跳动  数据分析实习  2024.06-2024.09\n..."} />
            </div>
          ) : parsed && (
            <div>
              {/* 教育经历 */}
              {(parsed.education||[]).length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:3, height:14, background:"#6366F1", borderRadius:2 }} />教育经历（{(parsed.education||[]).length} 条）
                  </div>
                  {(parsed.education||[]).map((edu,i) => (
                    <div key={i} onClick={() => setSelEdu(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n;})}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, marginBottom:8, cursor:"pointer", border:selEdu.has(i)?"1.5px solid #6366F1":"1px solid #E5E7EB", background:selEdu.has(i)?"#EEF2FF":"#F9FAFB", transition:"all 100ms" }}>
                      <Checkbox checked={selEdu.has(i)} />
                      <div style={{ flex:1, display:"flex", gap:16, flexWrap:"wrap" }}>
                        {[["学历",edu.degree],["院校",edu.school],["专业",edu.major],["毕业年份",edu.graduation_year]].filter(([,v])=>v).map(([k,v])=>(
                          <div key={k}><div style={{ fontSize:10, color:"#9CA3AF" }}>{k}</div><div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{v}</div></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 项目/实习经历 */}
              {(parsed.experiences||[]).length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:3, height:14, background:"#6366F1", borderRadius:2 }} />项目 / 实习经历（{(parsed.experiences||[]).length} 条）
                  </div>
                  {(parsed.experiences||[]).map((exp,i) => {
                    const isDupe = !!dupes[i];
                    const res = dupRes[i] || "both";
                    const skipped = isDupe && res === "skip";
                    return (
                      <div key={i} style={{ marginBottom:12, border: skipped?"1px solid #E5E7EB": selExp.has(i)?"1.5px solid #6366F1":"1px solid #E5E7EB", borderRadius:10, background: skipped?"#F9FAFB": selExp.has(i)?"#EEF2FF":"#F9FAFB", opacity: skipped?0.5:1, transition:"all 100ms" }}>
                        {/* 主行 */}
                        <div onClick={() => !isDupe && toggleSelExp(i)}
                          style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", cursor: isDupe?"default":"pointer" }}>
                          <div style={{ marginTop:2 }}><Checkbox checked={selExp.has(i) && !skipped} /></div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{exp.title || "（未识别标题）"}</span>
                              {isDupe && <span style={{ fontSize:11, background:"#FEF3C7", color:"#92400E", borderRadius:4, padding:"1px 6px", fontWeight:600 }}>⚠️ 有相似经历</span>}
                            </div>
                            {exp.background && <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.5 }}>{exp.background.slice(0,80)}{exp.background.length>80?"…":""}</div>}
                            {exp.keywords && <div style={{ fontSize:11, color:"#9CA3AF", marginTop:3 }}>{exp.keywords}</div>}
                          </div>
                        </div>

                        {/* 分类选择 */}
                        <div style={{ padding:"0 14px 10px 44px", display:"flex", alignItems:"center", gap:10 }}>
                          <select value={expTypes[i]||"其他"} onChange={e=>setExpTypes(t=>({...t,[i]:e.target.value}))}
                            style={{ padding:"4px 8px", border:"1px solid #E5E7EB", borderRadius:6, fontSize:11, color:"#6B7280", background:"#fff", cursor:"pointer", fontFamily:"Inter,sans-serif", outline:"none" }}>
                            {allTypes.map(t=><option key={t}>{t}</option>)}
                          </select>
                        </div>

                        {/* 重复对比区 */}
                        {isDupe && (
                          <div style={{ margin:"0 14px 14px", borderRadius:8, border:"1px solid #FDE68A", background:"#FFFBEB", overflow:"hidden" }}>
                            <div style={{ padding:"8px 12px", borderBottom:"1px solid #FDE68A", fontSize:11, fontWeight:600, color:"#92400E" }}>与已有经历对比</div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                              <div style={{ padding:"10px 12px", borderRight:"1px solid #FDE68A" }}>
                                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>已有经历</div>
                                <div style={{ fontSize:12, fontWeight:600, color:"#111827", marginBottom:3 }}>{dupes[i].title}</div>
                                <div style={{ fontSize:11, color:"#6B7280" }}>{(dupes[i].background||"").slice(0,60)}{(dupes[i].background||"").length>60?"…":""}</div>
                                {dupes[i].keywords && <div style={{ fontSize:10, color:"#9CA3AF", marginTop:3 }}>{dupes[i].keywords}</div>}
                              </div>
                              <div style={{ padding:"10px 12px" }}>
                                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:4 }}>导入内容</div>
                                <div style={{ fontSize:12, fontWeight:600, color:"#111827", marginBottom:3 }}>{exp.title}</div>
                                <div style={{ fontSize:11, color:"#6B7280" }}>{(exp.background||"").slice(0,60)}{(exp.background||"").length>60?"…":""}</div>
                                {exp.keywords && <div style={{ fontSize:10, color:"#9CA3AF", marginTop:3 }}>{exp.keywords}</div>}
                              </div>
                            </div>
                            <div style={{ padding:"8px 12px", borderTop:"1px solid #FDE68A", display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:11, color:"#92400E" }}>处理方式：</span>
                              {[["both","两个都保留"],["replace","用新的替换"],["skip","跳过不导入"]].map(([v,label]) => (
                                <button key={v} onClick={() => setDupRes(r=>({...r,[i]:v}))}
                                  style={{ padding:"3px 10px", borderRadius:6, border:`1px solid ${res===v?"#6366F1":"#E5E7EB"}`, background:res===v?"#6366F1":"#fff", color:res===v?"#fff":"#6B7280", fontSize:11, cursor:"pointer", fontFamily:"Inter,sans-serif", fontWeight:res===v?600:400, transition:"all 100ms" }}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          {step === "preview" && <div style={{ fontSize:12, color:"#9CA3AF" }}>将导入 {totalSel} 条 · 点击条目可取消勾选</div>}
          <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
            {step === "preview" && <Btn variant="outline" onClick={() => setStep("paste")}>← 重新输入</Btn>}
            <Btn variant="outline" onClick={onClose}>取消</Btn>
            {step === "paste" ? (
              <Btn variant="primary" onClick={parse} disabled={parsing||uploading}>
                {parsing ? <><Spinner size={12} /> 解析中…</> : "✨ AI 解析"}
              </Btn>
            ) : (
              <Btn variant="primary" onClick={save} disabled={saving || totalSel === 0}>
                {saving ? <><Spinner size={12} /> 导入中…</> : `导入 (${totalSel} 条)`}
              </Btn>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

function ExperienceLibrary() {
  const { experiences, education, refresh, refreshMatchScores } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmModal: DelConfirm } = useConfirm();
  const [adding, setAdding] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [showCategoryMgr, setShowCategoryMgr] = React.useState(false);
  const [customTypes, setCustomTypes] = React.useState(loadCustomTypes);
  const [filterType, setFilterType] = React.useState("全部");
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const { confirm: confirmBatch, ConfirmModal: BatchConfirm } = useConfirm();

  const enterSelectMode = () => { setSelectMode(true); setSelectedIds(new Set()); };
  const exitSelectMode  = () => { setSelectMode(false); setSelectedIds(new Set()); };
  const toggleId = (id) => setSelectedIds(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const allTypes = [...DEFAULT_TYPES, ...customTypes];

  const { profile } = React.useContext(AppContext);
  const [seekingType, setSeekingType] = React.useState("");
  React.useEffect(() => { setSeekingType(profile?.seeking_type || ""); }, [profile?.seeking_type]);

  const saveSeekingType = async (val) => {
    setSeekingType(val);
    const current = await fetch("/api/profile").then(r => r.json()).catch(() => ({}));
    await fetch("/api/profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...current, seeking_type: val }) });
    await refresh();
  };

  const afterChange = async () => {
    await refresh();
    refreshMatchScores(); // 后台静默重算，不阻塞 UI
  };

  const deleteExp = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const ok = await confirm({ title:"删除经历", message:"确认删除此经历？删除后无法恢复。" });
      if (!ok) return;
    }
    await fetch(`/api/experiences/${id}`, { method:"DELETE" });
    await afterChange(); show("已删除");
  };

  const filtered = filterType === "全部" ? experiences : experiences.filter(e => e.type === filterType);

  // 只显示有内容的分类 tab
  const usedTypes = ["全部", ...allTypes.filter(t => experiences.some(e => e.type === t))];

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      {/* 标题栏 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:"#111827", marginBottom:3 }}>个人背景</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>共 {experiences.length} 条经历 · 用于岗位匹配和简历生成</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="outline" size="md" onClick={() => setShowCategoryMgr(v=>!v)}>
            <Icon d="M4 6h16M4 12h16M4 18h7" size={13} />管理分类
          </Btn>
          <Btn variant="secondary" size="md" onClick={() => setShowImport(true)}>
            📄 导入简历
          </Btn>
          <Btn variant="primary" size="md" onClick={() => setAdding(true)}>
            <Icon d="M12 5v14M5 12h14" size={13} color="#fff" />添加经历
          </Btn>
        </div>
      </div>

      {/* 求职类型 + 教育背景 */}
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"14px 20px", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <SeekingTypeBadge value={seekingType} onChange={saveSeekingType} />
      </div>
      <EducationSection education={education} onSaved={refresh} />

      {/* 分类管理（可折叠） */}
      {showCategoryMgr && <CategoryManager customTypes={customTypes} onChange={setCustomTypes} />}

      {/* 分类筛选 tabs + 删除控件（同行右侧） */}
      {experiences.length > 0 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:8 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {usedTypes.map(t => (
              <button key={t} onClick={() => { setFilterType(t); if(selectMode) exitSelectMode(); }}
                style={{ padding:"5px 14px", borderRadius:9999, border:"1.5px solid", borderColor: filterType===t?"#6366F1":"#E5E7EB", background: filterType===t?"#6366F1":"#fff", color: filterType===t?"#fff":"#6B7280", fontSize:12, fontWeight: filterType===t?600:400, cursor:"pointer", fontFamily:"Inter,sans-serif", transition:"all 100ms" }}>
                {t}{t !== "全部" && ` (${experiences.filter(e=>e.type===t).length})`}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
            {!selectMode ? (
              <button onClick={enterSelectMode}
                style={{ fontSize:12, color:"#EF4444", background:"none", border:"1px solid #FCA5A5", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", gap:4 }}>
                <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={11} color="#EF4444" />
                删除
              </button>
            ) : (
              <>
                <span style={{ fontSize:12, color:"#9CA3AF" }}>
                  {selectedIds.size > 0 ? `已选 ${selectedIds.size}` : "点击经历选择"}
                </span>
                <button onClick={() => setSelectedIds(s => s.size === filtered.length ? new Set() : new Set(filtered.map(e=>e.id)))}
                  style={{ fontSize:12, color:"#6366F1", background:"none", border:"1px solid #C7D2FE", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                  {selectedIds.size === filtered.length && filtered.length > 0 ? "全取消" : "全选"}
                </button>
                <button onClick={exitSelectMode}
                  style={{ fontSize:12, color:"#6B7280", background:"none", border:"1px solid #E5E7EB", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                  取消
                </button>
                <button disabled={selectedIds.size === 0}
                  onClick={async () => {
                    const ok = await confirmBatch({ title:"批量删除", message:`确认删除选中的 ${selectedIds.size} 条经历？此操作不可撤销。`, confirmText:`删除 ${selectedIds.size} 条` });
                    if (!ok) return;
                    for (const id of selectedIds) await fetch(`/api/experiences/${id}`, { method:"DELETE" });
                    exitSelectMode();
                    await afterChange();
                    show("已删除");
                  }}
                  style={{ fontSize:12, color:"#fff", background: selectedIds.size > 0?"#EF4444":"#D1D5DB", border:"none", borderRadius:6, padding:"4px 12px", cursor: selectedIds.size>0?"pointer":"not-allowed", fontFamily:"Inter,sans-serif", fontWeight:600 }}>
                  删除选中
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 经历卡片 + 添加表单 */}
      <div style={{ display:"grid", gridTemplateColumns: adding ? "1fr 380px" : "1fr", gap:16, alignItems:"start" }}>
        <div>
          {experiences.length === 0 ? (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:40, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📚</div>
              <div style={{ fontSize:16, fontWeight:600, color:"#111827", marginBottom:8 }}>经历库是空的</div>
              <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:16 }}>可以「导入简历」一次性解析所有经历，或手动添加</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                <Btn variant="secondary" onClick={() => setShowImport(true)}>📄 导入简历</Btn>
                <Btn variant="primary" onClick={() => setAdding(true)}>手动添加</Btn>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:32, textAlign:"center", color:"#9CA3AF", fontSize:13 }}>
              该分类下暂无经历
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
              {filtered.map(exp => (
                <ExperienceCard key={exp.id} exp={exp} onDelete={deleteExp} onEdit={afterChange} allTypes={allTypes}
                  selected={selectMode && selectedIds.has(exp.id)}
                  onSelect={selectMode ? () => toggleId(exp.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
        {adding && (
          <div style={{ position:"sticky", top:0 }}>
            <ExperienceForm onClose={() => setAdding(false)} onSaved={afterChange} allTypes={allTypes} />
          </div>
        )}
      </div>

      {/* 简历导入弹窗 */}
      {showImport && <ResumeImportModal onClose={() => setShowImport(false)} onImported={afterChange} allTypes={allTypes} existingExps={experiences} />}
      {DelConfirm}
      {BatchConfirm}
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { ExperienceLibrary });
