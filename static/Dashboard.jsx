// Dashboard 页面

function StatCard({ label, value, delta, color="#6366F1", icon }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:500, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:30, fontWeight:700, color:"#111827", letterSpacing:-0.5, lineHeight:1 }}>{value}</div>
          {delta != null && <div style={{ fontSize:11, color:"#10B981", fontWeight:500, marginTop:6 }}>{delta}</div>}
        </div>
        <div style={{ width:36, height:36, background:color+"18", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon d={icon} size={16} color={color} />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onNav }) {
  const { jobs, llmOk } = React.useContext(AppContext);
  const [stats, setStats] = React.useState(null);
  const [topJobs, setTopJobs] = React.useState([]);
  const [recent, setRecent] = React.useState([]);

  React.useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(d => {
      setStats(d.stats);
      setTopJobs(d.top_jobs || []);
      setRecent(d.recent_outputs || []);
    });
  }, [jobs]);

  if (!stats) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF" }}>
      <Spinner size={24} />
    </div>
  );

  const typeLabels = { resume_bullet:"简历 Bullet", interview_prep:"面试准备" };

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:700, color:"#111827", marginBottom:4 }}>求职控制台</h1>
        {stats.high_match > 0
          ? <p style={{ fontSize:13, color:"#9CA3AF" }}>你有 <b style={{color:"#111827"}}>{stats.high_match}</b> 个高匹配岗位，快去查看吧</p>
          : <p style={{ fontSize:13, color:"#9CA3AF" }}>导入岗位并计算匹配分后，这里会显示推荐</p>
        }
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard label="岗位总数" value={stats.total} color="#6366F1" icon="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z" />
        <StatCard label="高匹配 ≥80%" value={stats.high_match} color="#10B981" icon="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
        <StatCard label="已投递" value={stats.applied} color="#3B82F6" icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <StatCard label="面试中" value={stats.interviewing} color="#F59E0B" icon="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </div>

      {stats.total === 0 ? (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:40, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🚀</div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:700, color:"#111827", marginBottom:8 }}>开始你的求职之旅</div>
          <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:20 }}>先设置求职偏好，录入个人经历，再导入岗位</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <Btn variant="outline" onClick={() => onNav("profile")}>设置偏好</Btn>
            <Btn variant="outline" onClick={() => onNav("experiences")}>录入经历</Btn>
            <Btn variant="primary" onClick={() => onNav("jobs")}>导入岗位</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:"#111827" }}>推荐岗位 Top 5</h3>
              <Btn variant="ghost" size="sm" onClick={() => onNav("jobs")}>查看全部 →</Btn>
            </div>
            {topJobs.length === 0 ? (
              <div style={{ fontSize:13, color:"#9CA3AF", padding:"20px 0", textAlign:"center" }}>
                还没有计算匹配分。前往「岗位推荐」批量计算。
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {topJobs.map((job, i) => (
                  <div key={job.id} onClick={() => onNav("jobs")} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background="#F9FAFB"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <span style={{ width:20, height:20, borderRadius:"50%", background:"#F3F4F6", fontSize:11, fontWeight:700, color:"#6B7280", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{job.company || "—"} · {job.title}</div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>{job.location || "—"} · {job.role_type || "—"}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      <StatusTag status={job.status} />
                      <MatchPill score={job.match_score} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:"#111827", marginBottom:12 }}>最近生成内容</h3>
            {recent.length === 0 ? (
              <div style={{ fontSize:13, color:"#9CA3AF", textAlign:"center", padding:"20px 0" }}>暂无生成记录</div>
            ) : recent.map((r, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #F3F4F6" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#6366F1", flexShrink:0 }}></div>
                <span style={{ flex:1, fontSize:13, color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {r.company || ""} {r.job_title || ""} · {typeLabels[r.output_type] || r.output_type}
                </span>
                <span style={{ fontSize:11, color:"#9CA3AF", flexShrink:0 }}>{r.created_at?.slice(5,16)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Dashboard });
