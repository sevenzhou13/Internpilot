// Interview Prep Screen

const INTERVIEW_DATA = {
  general: [
    { q: "请介绍一下你自己以及选择数据分析方向的原因", hint: "结构：背景 → 转折 → 目标，突出研究方法能力" },
    { q: "你如何看待数据分析在内容平台业务中的作用？", hint: "结合小红书场景：内容推荐、用户增长、审美偏好" },
    { q: "描述一次你用数据解决实际问题的经历", hint: "STAR法则，重点量化结果" },
  ],
  jobSpecific: [
    { q: "如何设计一个 A/B 实验来测试新功能对用户留存的影响？", hint: "分组策略 → 指标选择 → 样本量计算 → 统计显著性判断" },
    { q: "你会如何分析「美颜功能使用率下降 20%」这个数据异常？", hint: "分层下钻：时间/设备/用户群/功能版本，横向对比竞品" },
    { q: "请解释 P 值和置信区间的区别，并举例说明应用场景", hint: "避免教科书式回答，结合 A/B 实验实例" },
    { q: "SQL 中 LEFT JOIN 和 INNER JOIN 的区别？什么情况下用哪个？", hint: "结合留存分析 / 用户行为漏斗场景举例" },
  ],
  projectFollowUp: [
    { q: "你在小红书数据分析项目中，如何确定 3 个流失节点的优先级？", hint: "从用户量级、业务影响、技术可行性三维度评估" },
    { q: "EEG 数据的 P300 成分提取时，如何处理噪声干扰？", hint: "独立成分分析 (ICA)、epoch 筛选、基线校正" },
    { q: "AIGC 审美评分模型的 82% 准确率是如何评估的？测试集如何构建？", hint: "强调数据标注方法、评分者一致性 (ICC)、跨文化差异" },
  ],
  knowledgeGap: [
    { topic: "Tableau 数据可视化", level: "待补充", link: "建议：完成 Tableau Public 基础教程 (约 4h)" },
    { topic: "漏斗分析与路径分析", level: "了解", link: "建议：阅读《精益数据分析》第 5–7 章" },
    { topic: "电商业务指标体系", level: "待补充", link: "建议：研究阿里/京东数据体系案例" },
  ],
};

function QuestionCard({ item, index }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10,
      overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", background: "#EEF2FF",
          color: "#6366F1", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
        }}>{index + 1}</span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "#111827", lineHeight: 1.5 }}>{item.q}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 150ms", flexShrink: 0, marginTop: 3 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 13px 48px", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>回答建议</div>
            <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.65 }}>{item.hint}</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Btn variant="outline" size="sm">记录回答</Btn>
            <Btn variant="ghost" size="sm">标记重点</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewPrep({ job }) {
  if (!job) job = JOBS_DATA[0];
  const [tab, setTab] = React.useState("general");
  const tabs = [
    { id: "general", label: "通用问题", count: INTERVIEW_DATA.general.length },
    { id: "jobSpecific", label: "岗位专业问题", count: INTERVIEW_DATA.jobSpecific.length },
    { id: "projectFollowUp", label: "项目追问", count: INTERVIEW_DATA.projectFollowUp.length },
    { id: "knowledgeGap", label: "知识补充", count: INTERVIEW_DATA.knowledgeGap.length },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8F9FB", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 3 }}>面试准备</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9CA3AF" }}>
            <span>目标岗位：</span>
            <span style={{ color: "#111827", fontWeight: 600 }}>{job.company} · {job.role}</span>
            <MatchPill score={job.match} />
          </div>
        </div>
        <Btn variant="outline" size="md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          导出清单
        </Btn>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 18, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
            background: tab === t.id ? "#fff" : "transparent",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            fontSize: 13, fontWeight: tab === t.id ? 600 : 500,
            color: tab === t.id ? "#111827" : "#6B7280",
            fontFamily: "Inter, sans-serif", transition: "all 120ms",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {t.label}
            <span style={{ background: tab === t.id ? "#EEF2FF" : "#E5E7EB", color: tab === t.id ? "#6366F1" : "#9CA3AF", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 9999 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab !== "knowledgeGap" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {INTERVIEW_DATA[tab].map((item, i) => (
            <QuestionCard key={i} item={item} index={i} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INTERVIEW_DATA.knowledgeGap.map((item, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: item.level === "待补充" ? "#FFFBEB" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.level === "待补充" ? "#D97706" : "#2563EB"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.topic}</span>
                  <Badge variant={item.level === "待补充" ? "warning" : "info"}>{item.level}</Badge>
                </div>
                <div style={{ fontSize: 12.5, color: "#6B7280" }}>{item.link}</div>
              </div>
              <Btn variant="outline" size="sm">开始学习</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { InterviewPrep });
