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

function InsightCard({ title, items, emptyText="暂无数据" }) {
  return <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
    <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:10}}>{title}</div>
    {items?.length ? items.slice(0,5).map(item=><div key={item.name} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6B7280",padding:"4px 0"}}><span>{item.name}</span><span style={{fontWeight:700,color:"#374151"}}>{item.count}</span></div>) : <div style={{fontSize:12,color:"#9CA3AF",padding:"8px 0"}}>{emptyText}</div>}
  </div>;
}

function TaxonomyManager({ taxonomy, onChanged }) {
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const categories = taxonomy?.categories || [];
  const [source, setSource] = React.useState("");
  const [targetChoice, setTargetChoice] = React.useState("");
  const [customTarget, setCustomTarget] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const target = (targetChoice === "__custom__" ? customTarget : targetChoice).trim();

  const merge = async () => {
    if (!source || !target) { show("请选择来源和目标类别", "error"); return; }
    if (source === target) { show("来源和目标类别不能相同", "error"); return; }
    const sourceCount = categories.find(item => item.category === source)?.count || 0;
    const ok = await confirm({ title:"确认合并类别", message:`将 ${sourceCount} 个“${source}”岗位合并为“${target}”。原类别会保留在历史记录中。`, confirmText:"确认合并", confirmColor:"#6366F1" });
    if (!ok) return;
    setSaving(true);
    const res = await fetch("/api/taxonomy/merge", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({source_category:source,target_category:target,reason}) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { show(data.detail || "类别合并失败", "error"); return; }
    setSource(""); setTargetChoice(""); setCustomTarget(""); setReason("");
    await onChanged();
    show(`已合并 ${data.affected_jobs} 个岗位`);
  };

  if (!categories.length) return null;
  const input = {padding:"7px 9px",border:"1px solid #E5E7EB",borderRadius:7,fontSize:11,color:"#374151",background:"#fff"};
  return <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",marginBottom:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div style={{fontSize:13,fontWeight:700,color:"#374151"}}>岗位类别体系</div><span style={{fontSize:11,color:"#9CA3AF"}}>开放 taxonomy · 用户确认后生效</span></div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"10px 0 12px"}}>{categories.slice(0,10).map(item=><span key={item.category} style={{fontSize:11,padding:"4px 8px",borderRadius:9999,background:"#F3F4F6",color:"#4B5563"}}>{item.category} · {item.count}</span>)}</div>
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <select value={source} onChange={e=>setSource(e.target.value)} style={input}><option value="">来源类别</option>{categories.map(item=><option key={item.category} value={item.category}>{item.category}</option>)}</select>
      <span style={{fontSize:12,color:"#9CA3AF"}}>→</span>
      <select value={targetChoice} onChange={e=>setTargetChoice(e.target.value)} style={input}><option value="">目标类别</option>{categories.map(item=><option key={item.category} value={item.category}>{item.category}</option>)}<option value="__custom__">输入新类别…</option></select>
      {targetChoice === "__custom__" && <input value={customTarget} onChange={e=>setCustomTarget(e.target.value)} placeholder="新类别" style={{...input,minWidth:130}} />}
      <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="合并原因（可选）" style={{...input,minWidth:160,flex:1}} />
      <Btn variant="outline" size="sm" onClick={merge} disabled={saving}>{saving?"合并中…":"确认合并"}</Btn>
    </div>
    {taxonomy.history?.length > 0 && <div style={{fontSize:10,color:"#9CA3AF",marginTop:10}}>最近变更：{taxonomy.history[0].previous_category} → {taxonomy.history[0].new_category}</div>}
    {ConfirmModal}<ToastContainer />
  </div>;
}

function Dashboard({ onNav }) {
  const { jobs, llmOk, refresh } = React.useContext(AppContext);
  const [stats, setStats] = React.useState(null);
  const [topJobs, setTopJobs] = React.useState([]);
  const [recent, setRecent] = React.useState([]);
  const [analytics, setAnalytics] = React.useState(null);
  const [clusters, setClusters] = React.useState(null);
  const [taxonomy, setTaxonomy] = React.useState(null);

  const refreshTaxonomy = React.useCallback(async () => {
    const data = await fetch("/api/taxonomy").then(r=>r.ok?r.json():null).catch(()=>null);
    setTaxonomy(data);
  }, []);

  React.useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(d => {
      setStats(d.stats);
      setTopJobs(d.top_jobs || []);
      setRecent(d.recent_outputs || []);
    });
    fetch("/api/analytics/overview").then(r=>r.ok?r.json():null).then(setAnalytics).catch(()=>setAnalytics(null));
    fetch("/api/analytics/clusters?max_clusters=4").then(r=>r.ok?r.json():null).then(setClusters).catch(()=>setClusters(null));
    refreshTaxonomy();
  }, [jobs, refreshTaxonomy]);

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

      {stats.total > 0 && analytics && <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <InsightCard title="岗位类别" items={analytics.categories} />
        <InsightCard title="投递漏斗" items={analytics.funnel} />
        <InsightCard title="高频技能" items={analytics.top_skills} />
        <InsightCard title="技能短板" items={analytics.skill_gaps} emptyText="经历与岗位技能匹配良好" />
      </div>}

      {clusters?.clusters?.length > 0 && <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:"#374151"}}>岗位需求聚类</div><div style={{fontSize:11,color:"#9CA3AF"}}>{clusters.metrics?.evaluated ? `自动选取 ${clusters.metrics.selected_cluster_count} 簇 · silhouette ${clusters.metrics.silhouette}` : clusters.metrics?.reason}</div></div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(clusters.clusters.length,4)},1fr)`,gap:10}}>{clusters.clusters.map(cluster=><div key={cluster.cluster_id} style={{background:"#F9FAFB",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:11,fontWeight:700,color:"#4F46E5",marginBottom:5}}>需求簇 {cluster.cluster_id+1} · {cluster.size} 岗</div><div style={{fontSize:11,color:"#4B5563",lineHeight:1.55}}>{cluster.keywords.slice(0,4).join(' · ')}</div></div>)}</div>
      </div>}

      {stats.total > 0 && <TaxonomyManager taxonomy={taxonomy} onChanged={async () => { await refresh(); await refreshTaxonomy(); }} />}

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
