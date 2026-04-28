// 个人背景库页面

const EXP_TYPES = ["数据分析项目","AI / 产品项目","科研经历","用户研究经历","编程项目","实习经历","竞赛经历","技能模块","其他"];

function ExperienceCard({ exp, onDelete }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow: hovered?"0 4px 12px rgba(0,0,0,0.08)":"0 1px 3px rgba(0,0,0,0.06)", transform: hovered?"translateY(-1px)":"none", transition:"all 150ms" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <Badge variant="neutral">{exp.type || "其他"}</Badge>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:"#111827", marginTop:5 }}>{exp.title}</div>
          <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>{exp.created_at?.slice(0,10)}</div>
        </div>
        <button onClick={() => onDelete(exp.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#D1D5DB", padding:4 }}
          onMouseEnter={e => e.currentTarget.style.color="#EF4444"}
          onMouseLeave={e => e.currentTarget.style.color="#D1D5DB"}>
          <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={14} />
        </button>
      </div>
      {exp.background && <p style={{ fontSize:12.5, color:"#6B7280", lineHeight:1.6, marginBottom:8 }}>{exp.background.slice(0,100)}{exp.background.length>100?"…":""}</p>}
      {exp.keywords && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
          {exp.keywords.split(",").filter(Boolean).map(s => <Badge key={s} variant="primary">{s.trim()}</Badge>)}
        </div>
      )}
      {exp.tools && (
        <div style={{ background:"#F9FAFB", borderRadius:8, padding:"8px 12px", fontSize:11, color:"#6B7280" }}>
          🔧 {exp.tools}
        </div>
      )}
    </div>
  );
}

function ExperienceForm({ onClose, onSaved }) {
  const { show, ToastContainer } = useToast();
  const [tab, setTab] = React.useState("smart");
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ title:"", type:"数据分析项目", background:"", methods:"", tools:"", results:"", keywords:"", target_roles:"", raw_bullet:"" });
  const [smartText, setSmartText] = React.useState("");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) { show("经历名称不能为空", "error"); return; }
    setLoading(true);
    await fetch("/api/experiences", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setLoading(false);
    onSaved();
    onClose();
  };

  const parseSmart = async () => {
    if (!smartText.trim()) { show("请先粘贴经历内容", "error"); return; }
    setLoading(true);
    const res = await fetch("/api/experiences/parse-text", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ text: smartText }) });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); show(d.detail || "识别失败", "error"); return; }
    const d = await res.json();
    setForm({
      title: d.title || "",
      type: d.type || "数据分析项目",
      background: d.background || "",
      methods: d.methods || "",
      tools: d.tools || "",
      results: d.results || "",
      keywords: d.keywords || "",
      target_roles: d.target_roles || "",
      raw_bullet: d.raw_bullet || smartText.slice(0, 200),
    });
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

      <div style={{ display:"flex", gap:0, borderBottom:"1px solid #E5E7EB", marginBottom:16 }}>
        {[["smart","✨ 智能识别"],["manual","手动填写"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"8px 16px", border:"none", borderBottom: tab===id?"2px solid #6366F1":"2px solid transparent", background:"none", fontSize:13, fontWeight: tab===id?600:500, color: tab===id?"#6366F1":"#6B7280", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "smart" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:13, color:"#6B7280", background:"#EEF2FF", borderRadius:8, padding:"10px 12px" }}>
            将简历原文、项目描述或随手记录粘贴到下方，AI 自动提取结构化字段。
          </div>
          <textarea style={{...inp, minHeight:180, resize:"vertical"}} value={smartText} onChange={e=>setSmartText(e.target.value)} placeholder="粘贴经历描述，例如：&#10;&#10;负责小红书平台图文数据采集与分析，使用Python+爬虫收集10万条数据，基于互动指标构建分析模型，产出数据报告…" />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="outline" onClick={onClose}>取消</Btn>
            <Btn variant="primary" onClick={parseSmart} disabled={loading}>{loading ? <><Spinner size={12} /> 识别中…</> : "✨ 智能识别"}</Btn>
          </div>
        </div>
      )}

      {tab === "manual" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><span style={lbl}>经历名称 *</span><input style={inp} value={form.title} onChange={e=>setF("title",e.target.value)} placeholder="例：小红书数据分析项目" /></div>
            <div>
              <span style={lbl}>类别</span>
              <select style={{...inp,cursor:"pointer"}} value={form.type} onChange={e=>setF("type",e.target.value)}>
                {EXP_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><span style={lbl}>项目背景</span><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.background} onChange={e=>setF("background",e.target.value)} placeholder="这个项目解决什么问题？" /></div>
          <div><span style={lbl}>方法与过程</span><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.methods} onChange={e=>setF("methods",e.target.value)} placeholder="你具体做了什么？用了什么方法？" /></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><span style={lbl}>工具 / 技术</span><input style={inp} value={form.tools} onChange={e=>setF("tools",e.target.value)} placeholder="Python, SQL, Figma..." /></div>
            <div><span style={lbl}>关键词（逗号分隔）</span><input style={inp} value={form.keywords} onChange={e=>setF("keywords",e.target.value)} placeholder="数据分析, A/B测试..." /></div>
          </div>
          <div><span style={lbl}>结果与产出</span><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.results} onChange={e=>setF("results",e.target.value)} placeholder="产出了什么？有哪些可量化的结果？" /></div>
          <div><span style={lbl}>原始简历表述（可选）</span><textarea style={{...inp,minHeight:50,resize:"vertical"}} value={form.raw_bullet} onChange={e=>setF("raw_bullet",e.target.value)} placeholder="你在简历里目前怎么写的？" /></div>
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

const EDU_LEVELS = ["本科", "硕士", "博士", "专科", "其他"];

function EducationSection({ education, onSaved }) {
  const { show } = useToast();
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ degree:"硕士", school:"", major:"", graduation_year:"" });

  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:12, fontWeight:500, color:"#6B7280", marginBottom:4, display:"block" };

  const save = async () => {
    if (!form.school.trim() && !form.major.trim()) { show("请至少填写院校或专业", "error"); return; }
    await fetch("/api/education", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setForm({ degree:"硕士", school:"", major:"", graduation_year:"" });
    setAdding(false);
    onSaved();
    show("教育经历已添加");
  };

  const del = async (id) => {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/education/${id}`, { method:"DELETE" });
    onSaved();
    show("已删除");
  };

  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em" }}>教育背景</div>
        <Btn variant="outline" size="sm" onClick={() => setAdding(a => !a)}>{adding ? "收起" : "+ 添加"}</Btn>
      </div>

      {education.length === 0 && !adding && (
        <div style={{ fontSize:13, color:"#9CA3AF" }}>暂无教育经历，点击「+ 添加」录入</div>
      )}

      {education.map(edu => (
        <div key={edu.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#F9FAFB", borderRadius:8, marginBottom:8 }}>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:1 }}>学历</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{edu.degree || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:1 }}>院校</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{edu.school || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:1 }}>专业</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{edu.major || "—"}</div>
            </div>
            {edu.graduation_year && (
              <div>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:1 }}>毕业年份</div>
                <div style={{ fontSize:13, color:"#6B7280" }}>{edu.graduation_year}</div>
              </div>
            )}
          </div>
          <Btn variant="ghost" size="sm" onClick={() => del(edu.id)}>
            <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={12} color="#EF4444" />
          </Btn>
        </div>
      ))}

      {adding && (
        <div style={{ marginTop:12, padding:"14px 16px", background:"#F9FAFB", borderRadius:10, border:"1px solid #E5E7EB" }}>
          <div style={{ display:"grid", gridTemplateColumns:"100px 1fr 1fr 100px", gap:10, marginBottom:10 }}>
            <div>
              <span style={lbl}>学历</span>
              <select style={{...inp,cursor:"pointer"}} value={form.degree} onChange={e=>setForm(f=>({...f,degree:e.target.value}))}>
                {EDU_LEVELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
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
    </div>
  );
}

function ExperienceLibrary() {
  const { experiences, education, refresh } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const [adding, setAdding] = React.useState(false);

  const deleteExp = async (id) => {
    if (!confirm("确认删除此经历？")) return;
    await fetch(`/api/experiences/${id}`, { method:"DELETE" });
    await refresh();
    show("已删除");
  };

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:"#111827", marginBottom:3 }}>个人背景库</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>共 {experiences.length} 条经历 · 用于岗位匹配和简历生成</p>
        </div>
        <Btn variant="primary" size="md" onClick={() => setAdding(true)}>
          <Icon d="M12 5v14M5 12h14" size={13} color="#fff" />
          添加经历
        </Btn>
      </div>

      <EducationSection education={education} onSaved={refresh} />

      <div style={{ display:"grid", gridTemplateColumns: adding ? "1fr 380px" : "1fr", gap:16, alignItems:"start" }}>
        <div>
          {experiences.length === 0 ? (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:40, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📚</div>
              <div style={{ fontSize:16, fontWeight:600, color:"#111827", marginBottom:8 }}>经历库是空的</div>
              <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:16 }}>录入经历后，系统才能为你匹配岗位和生成简历</div>
              <Btn variant="primary" onClick={() => setAdding(true)}>添加第一条经历</Btn>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
              {experiences.map(exp => <ExperienceCard key={exp.id} exp={exp} onDelete={deleteExp} />)}
            </div>
          )}
        </div>
        {adding && (
          <div style={{ position:"sticky", top:0 }}>
            <ExperienceForm onClose={() => setAdding(false)} onSaved={refresh} />
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { ExperienceLibrary });
