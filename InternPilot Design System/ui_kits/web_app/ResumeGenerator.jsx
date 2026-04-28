// Resume Generator Screen

const BULLETS_DATA = [
  "基于 50 万+ MAU 行为数据，构建用户美颜功能使用漏斗，精准定位 3 个关键流失节点，流失率降低 18%",
  "设计并主导 A/B 实验方案，结合统计检验验证 UI 优化效果，推动功能迭代，最终实现 DAU 提升 12%",
  "搭建自动化数据报告系统（Python + SQL），将日报生产周期从 4 小时压缩至 30 分钟，提效 87%",
  "深度参与眼动 AOI 分析项目，基于 25 名用户眼动数据识别信息架构问题，输出可用性报告被产品团队采纳",
];

function ResumeGenerator({ job }) {
  if (!job) job = JOBS_DATA[0];
  const [selected, setSelected] = React.useState([0, 1, 2]);
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState(true);

  const toggleExp = (i) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <div style={{ flex: 1, overflow: "hidden", background: "#F8F9FB", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 32px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 3 }}>简历生成</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9CA3AF" }}>
              <span>目标岗位：</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>{job.company} · {job.role}</span>
              <MatchPill score={job.match} />
            </div>
          </div>
          <Btn variant="primary" size="md">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            导出简历
          </Btn>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 14, padding: "0 32px 32px", overflowY: "auto", marginTop: 14 }}>
        {/* Col 1: JD Summary */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>岗位需求摘要</div>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#111827" }}>核心技能</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {job.tags?.map(t => <Badge key={t} variant="primary">{t}</Badge>)}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#111827" }}>岗位关键词</div>
              {["数据驱动", "业务洞察", "A/B实验", "可视化", "SQL"].map(k => (
                <div key={k} style={{ fontSize: 11, color: "#6B7280", padding: "2px 0", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: "#10B981" }}>✓</span>{k}
                </div>
              ))}
            </div>
            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 10, fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>
              {job.reason}
            </div>
          </div>
        </div>

        {/* Col 2: Experience selection */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>推荐经历（选择用于生成）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EXPERIENCES.map((exp, i) => (
              <div key={exp.id} onClick={() => toggleExp(i)} style={{
                padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                border: selected.includes(i) ? "1.5px solid #6366F1" : "1px solid #E5E7EB",
                background: selected.includes(i) ? "#EEF2FF" : "#F9FAFB",
                transition: "all 120ms",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{exp.title}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{exp.category} · {exp.date}</div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, border: selected.includes(i) ? "none" : "1.5px solid #D1D5DB",
                    background: selected.includes(i) ? "#6366F1" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {selected.includes(i) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5, lineHeight: 1.5 }}>{exp.desc.slice(0, 80)}...</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn variant="primary" size="md" style={{ width: "100%", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10M12 8v4l3 3"/></svg>
              生成 Bullet Points
            </Btn>
          </div>
        </div>

        {/* Col 3: Generated bullets */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em" }}>生成结果</div>
            <Badge variant="success">已生成</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BULLETS_DATA.map((bullet, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "#F9FAFB", borderRadius: 8, borderLeft: "2.5px solid #6366F1" }}>
                <div style={{ fontSize: 12.5, color: "#111827", lineHeight: 1.65 }}>{bullet}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Btn variant="ghost" size="sm" style={{ fontSize: 11, padding: "3px 8px" }}>编辑</Btn>
                  <Btn variant="ghost" size="sm" style={{ fontSize: 11, padding: "3px 8px" }}>重新生成</Btn>
                  <Btn variant="ghost" size="sm" style={{ fontSize: 11, padding: "3px 8px", marginLeft: "auto" }}>复制</Btn>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#EEF2FF", borderRadius: 8, fontSize: 12, color: "#4338CA", lineHeight: 1.5 }}>
            💡 建议：在第 2 条中补充具体实验样本量数据，会让描述更有说服力。
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ResumeGenerator });
