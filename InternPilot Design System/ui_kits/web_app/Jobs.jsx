// Jobs Screen

function JobCard({ job, onDetail, onResume, onInterview }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
        padding: "18px 20px", boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 150ms", cursor: "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginBottom: 3 }}>{job.company}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827" }}>{job.role}</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{job.location} · {job.salary} · {job.duration}</div>
        </div>
        <MatchPill score={job.match} />
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {job.tags && job.tags.map(t => <Badge key={t} variant="primary">{t}</Badge>)}
      </div>

      <MatchBar value={job.match} />

      <div style={{ marginTop: 10, fontSize: 12, color: "#6B7280", lineHeight: 1.5, minHeight: 32 }}>
        {job.reason}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <StatusTag status={job.status} />
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="outline" size="sm" onClick={() => onDetail(job)}>查看详情</Btn>
          <Btn variant="secondary" size="sm" onClick={() => onInterview(job)}>准备面试</Btn>
          <Btn variant="primary" size="sm" onClick={() => onResume(job)}>生成简历</Btn>
        </div>
      </div>
    </div>
  );
}

function FilterBar({ filters, setFilters }) {
  const locations = ["全部城市", "上海", "北京", "深圳", "杭州", "广州"];
  const categories = ["全部类型", "数据分析", "AI 产品经理", "用户研究", "数据产品"];
  const matchLevels = ["全部匹配度", "≥80% 强推荐", "70–79% 推荐", "<70%"];
  const statuses = ["全部状态", "待投递", "已投递", "面试中"];

  const sel = { padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", outline: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input placeholder="搜索岗位名称、公司..." style={{ ...sel, paddingLeft: 30, width: "100%" }} />
      </div>
      {[locations, categories, matchLevels, statuses].map((opts, i) => (
        <select key={i} style={sel}>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ))}
    </div>
  );
}

function Jobs({ onDetail, onResume, onInterview }) {
  const [filters, setFilters] = React.useState({});
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8F9FB", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 3 }}>岗位推荐</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>共 {JOBS_DATA.length} 个岗位 · {JOBS_DATA.filter(j => j.match >= 80).length} 个高匹配</p>
        </div>
        <Btn variant="primary" size="md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          导入岗位 JD
        </Btn>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {JOBS_DATA.map(job => (
          <JobCard key={job.id} job={job} onDetail={onDetail} onResume={onResume} onInterview={onInterview} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Jobs });
