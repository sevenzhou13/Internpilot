// Dashboard Screen

function StatCard({ label, value, delta, color = "#6366F1", icon }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
      padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#111827", letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
          {delta && <div style={{ fontSize: 11, color: "#10B981", fontWeight: 500, marginTop: 6 }}>{delta}</div>}
        </div>
        <div style={{ width: 36, height: 36, background: color + "18", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icon} size={16} color={color} />
        </div>
      </div>
    </div>
  );
}

function RecentItem({ label, tag, time }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366F1", flexShrink: 0 }}></div>
      <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{label}</span>
      <Badge variant="neutral">{tag}</Badge>
      <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>{time}</span>
    </div>
  );
}

function Dashboard({ onNav }) {
  const topJobs = JOBS_DATA.slice(0, 5);
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8F9FB", padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
          早上好，李同学 👋
        </h1>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>你有 3 个高匹配岗位待处理，简历生成进度 2/5</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="收藏岗位" value="24" delta="↑ 3 本周新增" color="#6366F1" icon="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z" />
        <StatCard label="高匹配 ≥80%" value="8" delta="↑ 1 今日新增" color="#10B981" icon="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
        <StatCard label="已投递" value="5" delta="本周 2 份" color="#3B82F6" icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <StatCard label="面试中" value="2" delta="腾讯 · 字节跳动" color="#F59E0B" icon="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Top Jobs */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827" }}>推荐岗位 Top 5</h3>
            <Btn variant="ghost" size="sm" onClick={() => onNav("jobs")}>查看全部 →</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {topJobs.map((job, i) => (
              <div key={job.id} onClick={() => onNav("jobs")} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", transition: "background 120ms",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#F3F4F6", fontSize: 11, fontWeight: 700, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{job.company} · {job.role}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{job.location} · {job.salary}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <StatusTag status={job.status} />
                  <MatchPill score={job.match} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>最近生成内容</h3>
          <RecentItem label="小红书 · 简历 Bullet Points" tag="简历" time="今天 10:22" />
          <RecentItem label="字节跳动 · 面试准备清单" tag="面试" time="今天 09:15" />
          <RecentItem label="腾讯 · 岗位 AI 分析报告" tag="分析" time="昨天 21:30" />
          <RecentItem label="AIGC 审美计算项目 · 经历更新" tag="经历" time="昨天 20:10" />
          <RecentItem label="字节跳动 · 简历 Bullet Points" tag="简历" time="3 天前" />
          <div style={{ marginTop: 14 }}>
            <Btn variant="outline" size="sm" style={{ width: "100%", justifyContent: "center" }}>查看所有历史</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
