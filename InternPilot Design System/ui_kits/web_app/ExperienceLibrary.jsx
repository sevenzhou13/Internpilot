// Experience Library Screen

function ExperienceCard({ exp, onEdit }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
        padding: "18px 20px",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-1px)" : "none", transition: "all 150ms",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <Badge variant="neutral">{exp.category}</Badge>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 5 }}>{exp.title}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{exp.date}</div>
        </div>
        <button onClick={() => onEdit(exp)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.6, marginBottom: 10 }}>{exp.desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {exp.skills.map(s => <Badge key={s} variant="primary">{s}</Badge>)}
      </div>
      <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bullet Points 预览</div>
        {exp.bullets.slice(0, 2).map((b, i) => (
          <div key={i} style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, marginBottom: 3, display: "flex", gap: 6 }}>
            <span style={{ color: "#6366F1", flexShrink: 0 }}>·</span>{b}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceForm({ exp, onClose }) {
  const isNew = !exp;
  const [form, setForm] = React.useState(exp || { title: "", category: "数据分析项目", date: "", desc: "", skills: [] });

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "22px 24px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {isNew ? "添加新经历" : "编辑经历"}
        </h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {[
        { label: "经历标题", placeholder: "例：小红书数据分析实习" },
        { label: "时间段", placeholder: "例：2023.09 – 2024.01" },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 4 }}>{f.label}</div>
          <input placeholder={f.placeholder} style={{
            width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 8,
            fontSize: 13, color: "#111827", fontFamily: "Inter, sans-serif", outline: "none",
          }} />
        </div>
      ))}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 4 }}>类别</div>
        <select style={{ width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#111827", fontFamily: "Inter, sans-serif", outline: "none" }}>
          {["数据分析项目", "学术研究", "用户研究项目", "AI 应用研究", "实习经历"].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 4 }}>详细描述</div>
        <textarea placeholder="描述你在这段经历中做了什么，取得了什么成果..." style={{
          width: "100%", padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 8,
          fontSize: 13, color: "#111827", fontFamily: "Inter, sans-serif", outline: "none",
          minHeight: 80, resize: "vertical",
        }} defaultValue={exp?.desc || ""} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="outline" size="md" onClick={onClose}>取消</Btn>
        <Btn variant="primary" size="md">保存经历</Btn>
      </div>
    </div>
  );
}

function ExperienceLibrary() {
  const [editing, setEditing] = React.useState(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8F9FB", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 3 }}>经历素材库</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>管理你的经历，用于生成简历和面试准备</p>
        </div>
        <Btn variant="primary" size="md" onClick={() => { setAdding(true); setEditing(null); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          添加经历
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: adding || editing ? "1fr 360px" : "1fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {EXPERIENCES.map(exp => (
            <ExperienceCard key={exp.id} exp={exp} onEdit={e => { setEditing(e); setAdding(false); }} />
          ))}
        </div>

        {(adding || editing) && (
          <div style={{ position: "sticky", top: 0 }}>
            <ExperienceForm exp={editing} onClose={() => { setEditing(null); setAdding(false); }} />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ExperienceLibrary });
