// Job Detail Screen — Left: JD, Right: AI Analysis

function JobDetail({ job, onResume, onInterview, onBack }) {
  if (!job) job = JOBS_DATA[0];

  const skills = { matched: ["Python", "SQL", "A/B测试", "数据可视化", "统计分析"], missing: ["Tableau", "电商数据"] };
  const matchedExp = [EXPERIENCES[0], EXPERIENCES[2]];
  const dimensions = [
    { name: "技能匹配", score: 92, bar: "#10B981" },
    { name: "经历相关性", score: 88, bar: "#10B981" },
    { name: "学历要求", score: 85, bar: "#10B981" },
    { name: "关键词覆盖", score: 80, bar: "#10B981" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8F9FB", padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          返回
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              {job.company} · {job.role}
            </h1>
            <MatchPill score={job.match} />
            <StatusTag status={job.status} />
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{job.location} · {job.salary}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="outline" size="md" onClick={() => onInterview(job)}>准备面试</Btn>
          <Btn variant="primary" size="md" onClick={() => onResume(job)}>生成简历</Btn>
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Left: JD */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8"/></svg>
            岗位描述 (JD)
          </h3>
          <pre style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {job.jd || "暂无 JD 内容"}
          </pre>
        </div>

        {/* Right: AI Analysis */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Summary */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>AI 摘要</div>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
              该岗位核心需求为 <strong>Python/SQL 数据分析</strong>能力，要求有 A/B 实验经验。业务侧偏向<strong>内容平台用户行为分析</strong>，需要有良好的业务理解和数据可视化能力。整体门槛中等偏上，适合有互联网实习背景的研究生。
            </p>
          </div>

          {/* Match breakdown */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>匹配度拆解</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dimensions.map(d => (
                <div key={d.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{d.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.score >= 80 ? "#059669" : "#D97706" }}>{d.score}%</span>
                  </div>
                  <MatchBar value={d.score} color={d.bar} />
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>技能关键词</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5 }}>已匹配</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.matched.map(s => <Badge key={s} variant="success">{s}</Badge>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5 }}>缺少 / 待补充</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.missing.map(s => <Badge key={s} variant="warning">{s}</Badge>)}
              </div>
            </div>
          </div>

          {/* Matched experiences */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>匹配经历</div>
            {matchedExp.map(e => (
              <div key={e.id} style={{ padding: "8px 10px", background: "#F9FAFB", borderRadius: 8, marginBottom: 6, borderLeft: "2px solid #6366F1" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{e.title}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{e.category} · {e.date}</div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 8 }}>📋 建议操作</div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              {["在简历中突出 A/B 测试量化结果", "补充 Tableau 或类似可视化工具使用经历", "准备「数据驱动决策」相关面试问题"].map((s, i) => (
                <li key={i} style={{ fontSize: 12, color: "#4338CA", display: "flex", gap: 7 }}>
                  <span style={{ flexShrink: 0 }}>{i + 1}.</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JobDetail });
