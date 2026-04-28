// 岗位详情页

function JobDetail({ job, onResume, onInterview, onBack }) {
  const { show, ToastContainer } = useToast();
  const { refresh, llmOk } = React.useContext(AppContext);
  const [parsing, setParsing] = React.useState(false);
  const [applyUrl, setApplyUrl] = React.useState(job?.apply_url || "");
  const [savingUrl, setSavingUrl] = React.useState(false);

  React.useEffect(() => { setApplyUrl(job?.apply_url || ""); }, [job?.id]);

  if (!job) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF" }}>
      <div>没有选中的岗位</div>
    </div>
  );

  const parseJD = async () => {
    if (!llmOk) { show("未配置 API Key", "error"); return; }
    setParsing(true);
    const res = await fetch(`/api/jobs/${job.id}/parse`, { method:"POST" });
    setParsing(false);
    if (res.ok) {
      const d = await res.json();
      if (d.error) show(d.error, "error");
      else { await refresh(); show("JD 解析完成"); }
    } else {
      const d = await res.json();
      show(d.detail || "解析失败", "error");
    }
  };

  const saveUrl = async () => {
    setSavingUrl(true);
    await fetch(`/api/jobs/${job.id}/apply-url`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ apply_url: applyUrl }) });
    setSavingUrl(false);
    await refresh();
    show("链接已保存");
  };

  // 将 jd_text 按【岗位职责】/【岗位要求】拆分为结构化段落
  const parseJDSections = (text) => {
    if (!text) return null;
    const hasStructure = text.includes("【岗位职责】") || text.includes("【岗位要求】");
    if (!hasStructure) return { raw: text };
    const sections = {};
    const parts = text.split(/【(岗位职责|岗位要求|加分项[^】]*|注意事项[^】]*)】/);
    for (let i = 1; i < parts.length; i += 2) {
      sections[parts[i].trim()] = parts[i + 1]?.trim() || "";
    }
    return sections;
  };

  const jdSections = parseJDSections(job.jd_text || job.raw_clip_text);

  const SectionBlock = ({ title, content }) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:3, height:14, background:"#6366F1", borderRadius:2 }} />
        {title}
      </div>
      <div style={{ fontSize:13, color:"#374151", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{content}</div>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, fontSize:13, color:"#9CA3AF" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"#6B7280", display:"flex", alignItems:"center", gap:4, fontSize:13 }}>
          ← 返回岗位列表
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>
        {/* 主内容 */}
        <div>
          {/* 岗位基本信息 */}
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:4 }}>{job.company || "未知公司"}</div>
                <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:700, color:"#111827", marginBottom:6 }}>{job.title}</h2>
                <div style={{ display:"flex", gap:10, fontSize:13, color:"#6B7280", flexWrap:"wrap" }}>
                  {job.location && <span>📍 {job.location}</span>}
                  {job.role_type && <span>🏷️ {job.role_type}</span>}
                  {job.source && <span>来源：{job.source}</span>}
                </div>
              </div>
              <MatchPill score={job.match_score} />
            </div>

            {job.skills && (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:12 }}>
                {job.skills.split(",").filter(Boolean).map(t => <Badge key={t} variant="primary">{t.trim()}</Badge>)}
              </div>
            )}
          </div>

          {/* 匹配分析 */}
          {job.recommendation_reason && (
            <div style={{ background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>匹配分析</div>
              <div style={{ fontSize:13, color:"#374151", lineHeight:1.7 }}>{job.recommendation_reason}</div>
            </div>
          )}

          {/* JD 内容 */}
          {jdSections && (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>岗位描述</div>
                <Btn variant="outline" size="sm" onClick={parseJD} disabled={parsing || !llmOk}>
                  {parsing ? <><Spinner size={11} /> 解析中…</> : "🔍 AI 重新解析"}
                </Btn>
              </div>

              {jdSections.raw ? (
                <div style={{ fontSize:13, color:"#374151", lineHeight:1.8, whiteSpace:"pre-wrap", maxHeight:400, overflowY:"auto" }}>
                  {jdSections.raw}
                </div>
              ) : (
                Object.entries(jdSections).map(([title, content]) => (
                  <SectionBlock key={title} title={title} content={content} />
                ))
              )}
            </div>
          )}
        </div>

        {/* 右侧操作 */}
        <div style={{ position:"sticky", top:0, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>操作</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Btn variant="primary" size="md" style={{ width:"100%", justifyContent:"center" }} onClick={() => onResume(job)}>✍️ 生成简历 Bullet</Btn>
              <Btn variant="secondary" size="md" style={{ width:"100%", justifyContent:"center" }} onClick={() => onInterview(job)}>🎤 生成面试准备</Btn>
            </div>
          </div>

          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>投递状态</div>
            <StatusTag status={job.status} />
          </div>

          {/* 招聘原链接 */}
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>招聘原链接</div>
            <input
              value={applyUrl}
              onChange={e => setApplyUrl(e.target.value)}
              placeholder="https://..."
              style={{ width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:12, color:"#374151", fontFamily:"Inter,sans-serif", outline:"none", marginBottom:8, boxSizing:"border-box" }}
            />
            <div style={{ display:"flex", gap:6 }}>
              <Btn variant="outline" size="sm" style={{ flex:1, justifyContent:"center" }} onClick={saveUrl} disabled={savingUrl}>
                {savingUrl ? "保存中…" : "保存"}
              </Btn>
              {applyUrl && (
                <a href={applyUrl} target="_blank" rel="noreferrer" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"5px 10px", borderRadius:8, border:"1px solid #6366F1", fontSize:12, color:"#6366F1", textDecoration:"none", fontWeight:500 }}>
                  查看原文
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { JobDetail });
