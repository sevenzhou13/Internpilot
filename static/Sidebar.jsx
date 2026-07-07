// 共享组件 + 全局状态 (AppContext)

// ── 全局 API 状态 ─────────────────────────────────────────────────────────────

const AppContext = React.createContext({});

function AppProvider({ children }) {
  const [jobs, setJobs] = React.useState([]);
  const [experiences, setExperiences] = React.useState([]);
  const [resumes, setResumes] = React.useState([]);
  const [education, setEducation] = React.useState([]);
  const [profile, setProfile] = React.useState(null);
  const [llmOk, setLlmOk] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [matchStatus, setMatchStatus] = React.useState("idle"); // idle | running | done

  const refresh = React.useCallback(async () => {
    try {
      const [jobsRes, expsRes, resumesRes, eduRes, profileRes, llmRes] = await Promise.all([
        fetch("/api/jobs").then(r => r.json()),
        fetch("/api/experiences").then(r => r.json()),
        fetch("/api/resumes").then(r => r.json()),
        fetch("/api/education").then(r => r.json()),
        fetch("/api/profile").then(r => r.json()),
        fetch("/api/llm/status").then(r => r.json()),
      ]);
      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      setExperiences(Array.isArray(expsRes) ? expsRes : []);
      setResumes(Array.isArray(resumesRes) ? resumesRes : []);
      setEducation(Array.isArray(eduRes) ? eduRes : []);
      setProfile(Object.keys(profileRes).length ? profileRes : null);
      setLlmOk(!!llmRes.configured);
    } catch (e) {
      console.error("refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 快速重算分数（经历变动后自动触发）
  const refreshMatchScores = React.useCallback(async () => {
    try {
      await fetch("/api/jobs/match-scores", { method: "POST" });
      await refresh();
    } catch {}
  }, [refresh]);

  // 完整匹配（含 LLM 推荐理由）
  const runMatchAll = React.useCallback(async () => {
    setMatchStatus("running");
    try {
      await fetch("/api/jobs/match-all", { method: "POST" });
      await refresh();
      setMatchStatus("done");
      setTimeout(() => setMatchStatus("idle"), 3000);
    } catch {
      setMatchStatus("idle");
    }
  }, [refresh]);

  React.useEffect(() => { refresh(); }, []);

  return (
    <AppContext.Provider value={{ jobs, experiences, resumes, education, profile, llmOk, loading, refresh, refreshMatchScores, matchStatus, runMatchAll }}>
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#9CA3AF", fontFamily:"Inter,sans-serif", fontSize:14 }}>
          加载中...
        </div>
      ) : children}
    </AppContext.Provider>
  );
}

// ── 共享 UI 组件 ──────────────────────────────────────────────────────────────

function Badge({ variant = "neutral", children }) {
  const colors = {
    primary: { bg:"#EEF2FF", color:"#4338CA" },
    success: { bg:"#ECFDF5", color:"#047857" },
    warning: { bg:"#FFFBEB", color:"#D97706" },
    danger:  { bg:"#FEF2F2", color:"#DC2626" },
    info:    { bg:"#EFF6FF", color:"#2563EB" },
    neutral: { bg:"#F3F4F6", color:"#4B5563" },
  };
  const c = colors[variant] || colors.neutral;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:9999, fontSize:11, fontWeight:600, background:c.bg, color:c.color, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function MatchPill({ score }) {
  if (score == null) return <span style={{ fontSize:11, color:"#9CA3AF" }}>未计算</span>;
  const color = score >= 80 ? "#047857" : score >= 70 ? "#D97706" : "#DC2626";
  const bg    = score >= 80 ? "#ECFDF5" : score >= 70 ? "#FFFBEB" : "#FEF2F2";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:9999, fontSize:12, fontWeight:700, background:bg, color }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:color, display:"inline-block" }}></span>
      {Math.round(score)}%
    </span>
  );
}

function StatusTag({ status }) {
  const map = {
    "未查看": { bg:"#F3F4F6", color:"#6B7280" },
    "感兴趣": { bg:"#EFF6FF", color:"#2563EB" },
    "已投递": { bg:"#EEF2FF", color:"#4338CA" },
    "笔试":   { bg:"#F5F3FF", color:"#6D28D9" },
    "一面":   { bg:"#FFFBEB", color:"#D97706" },
    "二面":   { bg:"#FFFBEB", color:"#B45309" },
    "HR面":   { bg:"#FEF3C7", color:"#92400E" },
    "Offer":  { bg:"#ECFDF5", color:"#059669" },
    "拒绝":   { bg:"#FEF2F2", color:"#DC2626" },
    "放弃":   { bg:"#F3F4F6", color:"#9CA3AF" },
    "不合适": { bg:"#F3F4F6", color:"#9CA3AF" },
  };
  const s = map[status] || map["未查看"];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:6, fontSize:12, fontWeight:500, background:s.bg, color:s.color }}>
      {status}
    </span>
  );
}

function Btn({ variant="primary", size="md", onClick, children, style, disabled }) {
  const base = { display:"inline-flex", alignItems:"center", gap:6, border:"none", borderRadius:8, fontFamily:"Inter,sans-serif", cursor: disabled ? "not-allowed" : "pointer", fontWeight:500, transition:"all 150ms", whiteSpace:"nowrap", opacity: disabled ? 0.5 : 1 };
  const sizes = { sm:{padding:"5px 11px",fontSize:12}, md:{padding:"7px 14px",fontSize:13}, lg:{padding:"9px 18px",fontSize:14} };
  const variants = {
    primary:   { background:"#6366F1", color:"#fff" },
    secondary: { background:"#F3F4F6", color:"#374151" },
    outline:   { background:"transparent", border:"1px solid #E5E7EB", color:"#6B7280" },
    ghost:     { background:"transparent", color:"#6B7280" },
    danger:    { background:"#FEF2F2", border:"1px solid #FEE2E2", color:"#DC2626" },
  };
  return (
    <button disabled={disabled} onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function MatchBar({ value }) {
  const c = value >= 80 ? "#10B981" : value >= 70 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ height:4, background:"#F3F4F6", borderRadius:9999, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(value||0,100)}%`, background:c, borderRadius:9999 }}></div>
    </div>
  );
}

function Icon({ d, size=15, color="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(d||"").split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M"+seg} />)}
    </svg>
  );
}

function Spinner({ size=16 }) {
  return (
    <div style={{ width:size, height:size, border:"2px solid #E5E7EB", borderTop:"2px solid #6366F1", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}></div>
  );
}

// Toast 通知
function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const show = (msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  const ToastContainer = () => (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:"10px 16px", borderRadius:10, fontSize:13, fontWeight:500,
          background: t.type==="error" ? "#FEF2F2" : "#ECFDF5",
          color: t.type==="error" ? "#DC2626" : "#047857",
          border: `1px solid ${t.type==="error" ? "#FEE2E2" : "#D1FAE5"}`,
          boxShadow:"0 4px 12px rgba(0,0,0,0.08)",
        }}>{t.msg}</div>
      ))}
    </div>
  );
  return { show, ToastContainer };
}

// ── 侧边栏 ─────────────────────────────────────────────────────────────────────

const NAV = [
  { id:"dashboard",   label:"求职控制台",  icon:"M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { id:"jobs",        label:"岗位推荐",    icon:"M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z" },
  { id:"experiences", label:"个人背景",  icon:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
  { id:"resume",      label:"简历管理",    icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  { id:"interview",   label:"面试准备",    icon:"M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { id:"ai",          label:"AI 助手",     icon:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
];

function Sidebar({ active, onNav }) {
  const { jobs, llmOk, matchStatus } = React.useContext(AppContext);
  const highMatch = jobs.filter(j => (j.match_score||0) >= 80).length;

  return (
    <div style={{ width:240, minHeight:"100vh", background:"#fff", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column", flexShrink:0 }}>
      {/* Logo */}
      <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid #E5E7EB" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:30, height:30, background:"#6366F1", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:800, color:"#111827", letterSpacing:-0.3 }}>
            Intern<span style={{ color:"#6366F1" }}>Pilot</span>
          </span>
        </div>
        {!llmOk && (
          <div style={{ marginTop:8, fontSize:11, color:"#D97706", background:"#FFFBEB", borderRadius:6, padding:"4px 8px" }}>
            ⚠️ 未配置 API Key
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ padding:"8px 8px", flex:1 }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <div key={item.id} onClick={() => onNav(item.id)} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 9px", borderRadius:8, cursor:"pointer", marginBottom:1, background: isActive?"#EEF2FF":"transparent", color: isActive?"#4338CA":"#6B7280", fontFamily:"Inter,sans-serif", fontSize:13, fontWeight: isActive?600:500, transition:"all 120ms" }}>
              <Icon d={item.icon} size={14} color={isActive?"#6366F1":"#9CA3AF"} />
              <span style={{ flex:1 }}>{item.label}</span>
              {item.id === "jobs" && matchStatus === "running" && (
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#F59E0B", display:"inline-block", animation:"pulse 1.2s infinite" }} />
              )}
              {item.id === "jobs" && matchStatus !== "running" && highMatch > 0 && (
                <span style={{ background:"#EEF2FF", color:"#4338CA", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:9999 }}>{highMatch}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部设置 */}
      <div style={{ padding:"8px 8px", borderTop:"1px solid #F3F4F6" }}>
        <div onClick={() => onNav("profile")} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 9px", borderRadius:8, cursor:"pointer", background: active==="profile"?"#EEF2FF":"transparent", color: active==="profile"?"#4338CA":"#6B7280", fontSize:13, fontWeight: active==="profile"?600:500 }}>
          <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" size={14} color={active==="profile"?"#6366F1":"#9CA3AF"} />
          <span>求职偏好</span>
        </div>
      </div>

      {/* 用户区域 */}
      <div style={{ padding:"12px 14px", borderTop:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:30, height:30, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:700, color:"#4F46E5" }}>我</div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>InternPilot</div>
          <div style={{ fontSize:11, color:"#9CA3AF" }}>{jobs.length} 个岗位</div>
        </div>
      </div>
    </div>
  );
}

// 全局 CSS 注入（spin 动画）
const styleEl = document.createElement("style");
styleEl.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleEl);

// ── 自定义确认弹窗 ─────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmText = "确认删除", confirmColor = "#EF4444", onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", width:360, boxShadow:"0 16px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <h4 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:"#111827" }}>{title || "确认操作"}</h4>
        </div>
        <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.6, marginBottom:20 }}>{message}</p>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", color:"#374151", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>取消</button>
          <button onClick={onConfirm} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:confirmColor, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = React.useState(null);
  const confirm = (opts) => new Promise(resolve => {
    const o = typeof opts === "string" ? { message: opts } : opts;
    setState({ ...o, resolve });
  });
  const modal = state ? (
    <ConfirmModal
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      confirmColor={state.confirmColor}
      onConfirm={() => { state.resolve(true);  setState(null); }}
      onCancel={() =>  { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, ConfirmModal: modal };
}

Object.assign(window, { AppContext, AppProvider, Badge, MatchPill, StatusTag, Btn, MatchBar, Icon, Spinner, useToast, useConfirm, ConfirmModal, Sidebar });
