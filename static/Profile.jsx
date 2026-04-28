// 求职偏好设置页面

const ROLE_OPTS = ["数据分析","AI产品","产品经理","用户研究","其他"];
const LOC_OPTS  = ["北京","上海","深圳","广州","成都","杭州","远程","不限"];
const IND_OPTS  = ["互联网","AI / 大模型","社交媒体","电商","金融","咨询","研究机构","游戏","其他"];

function Profile() {
  const { profile, refresh } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const [saving, setSaving] = React.useState(false);

  const parseList = (v) => v ? v.split(",").filter(Boolean) : [];
  const toStr = (arr) => arr.join(",");

  const [form, setForm] = React.useState({
    target_roles: parseList(profile?.target_roles),
    target_locations: parseList(profile?.target_locations),
    preferred_industries: parseList(profile?.preferred_industries),
    excluded_roles: [],
    internship_duration: profile?.internship_duration || "",
    available_start_date: profile?.available_start_date || "",
    notes: profile?.notes || "",
    seeking_type: profile?.seeking_type || "",
  });

  React.useEffect(() => {
    if (profile) setForm({
      target_roles: parseList(profile.target_roles),
      target_locations: parseList(profile.target_locations),
      preferred_industries: parseList(profile.preferred_industries),
      excluded_roles: parseList(profile.excluded_roles),
      internship_duration: profile.internship_duration || "",
      available_start_date: profile.available_start_date || "",
      notes: profile.notes || "",
      seeking_type: profile.seeking_type || "",
    });
  }, [profile]);

  const toggle = (key, val) => setForm(f => {
    const arr = f[key];
    return { ...f, [key]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val] };
  });

  const save = async () => {
    setSaving(true);
    await fetch("/api/profile", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        target_roles: toStr(form.target_roles),
        target_locations: toStr(form.target_locations),
        preferred_industries: toStr(form.preferred_industries),
        excluded_roles: toStr(form.excluded_roles),
        internship_duration: form.internship_duration,
        available_start_date: form.available_start_date,
        notes: form.notes,
        seeking_type: form.seeking_type,
      }),
    });
    await refresh();
    setSaving(false);
    show("偏好已保存");
  };

  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none" };

  const MultiSelect = ({ label, options, formKey }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:8 }}>{label}</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {options.map(opt => {
          const active = form[formKey].includes(opt);
          return (
            <button key={opt} onClick={() => toggle(formKey, opt)} style={{ padding:"5px 12px", borderRadius:9999, border: active?"1.5px solid #6366F1":"1px solid #E5E7EB", background: active?"#EEF2FF":"#fff", color: active?"#4338CA":"#6B7280", fontSize:13, cursor:"pointer", fontFamily:"Inter,sans-serif", fontWeight: active?600:400, transition:"all 120ms" }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:"#111827", marginBottom:3 }}>求职偏好</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>设置后用于岗位匹配和推荐排序</p>
        </div>
        <Btn variant="primary" size="md" onClick={save} disabled={saving}>
          {saving ? <><Spinner size={12} />保存中…</> : "💾 保存偏好"}
        </Btn>
      </div>

      <div style={{ maxWidth:680, display:"flex", flexDirection:"column", gap:0 }}>
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"24px 28px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <MultiSelect label="目标岗位方向" options={ROLE_OPTS} formKey="target_roles" />
          <MultiSelect label="目标城市" options={LOC_OPTS} formKey="target_locations" />
          <MultiSelect label="偏好行业" options={IND_OPTS} formKey="preferred_industries" />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>可接受实习周期</div>
              <input style={inp} value={form.internship_duration} onChange={e=>setForm(f=>({...f,internship_duration:e.target.value}))} placeholder="例：3个月以上" />
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>可开始实习时间</div>
              <input style={inp} value={form.available_start_date} onChange={e=>setForm(f=>({...f,available_start_date:e.target.value}))} placeholder="例：2026年6月" />
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:8 }}>求职类型</div>
            <div style={{ display:"flex", gap:8 }}>
              {["应届校招","日常实习","两者均可"].map(t => (
                <button key={t} onClick={() => setForm(f=>({...f, seeking_type: f.seeking_type===t?"":t}))}
                  style={{ padding:"6px 16px", borderRadius:9999, border:`1.5px solid ${form.seeking_type===t?"#6366F1":"#E5E7EB"}`, background:form.seeking_type===t?"#EEF2FF":"#fff", color:form.seeking_type===t?"#4338CA":"#6B7280", fontSize:13, cursor:"pointer", fontFamily:"Inter,sans-serif", fontWeight:form.seeking_type===t?600:400, transition:"all 100ms" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>其他备注</div>
            <textarea style={{...inp,minHeight:70,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="例：优先考虑有导师制的公司；不接受外包岗位..." />
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { Profile });
