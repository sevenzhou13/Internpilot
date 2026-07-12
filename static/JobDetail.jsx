// 岗位详情页

const ROLE_OPTIONS_JD = ["数据分析","AI产品","产品经理","用户研究","其他"];

function JobDetail({ job, onResume, onInterview, onBack, onNavigate }) {
  const { show, ToastContainer } = useToast();
  const { refresh, llmOk, jobs } = React.useContext(AppContext);
  const currentIndex = jobs.findIndex(j => j.id === job?.id);
  const prevJob = currentIndex > 0 ? jobs[currentIndex - 1] : null;
  const nextJob = currentIndex < jobs.length - 1 ? jobs[currentIndex + 1] : null;
  const [parsing, setParsing] = React.useState(false);
  const [applyUrl, setApplyUrl] = React.useState(job?.apply_url || "");
  const [savingUrl, setSavingUrl] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [analysis, setAnalysis] = React.useState(null);
  const [matchExplanation, setMatchExplanation] = React.useState(null);
  const [resumeMatches, setResumeMatches] = React.useState([]);
  const [matching, setMatching] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [categorySelection, setCategorySelection] = React.useState("");
  const [customCategory, setCustomCategory] = React.useState("");
  const [savingCategory, setSavingCategory] = React.useState(false);

  React.useEffect(() => { setApplyUrl(job?.apply_url || ""); }, [job?.id]);
  React.useEffect(() => {
    if (!job?.id) return;
    fetch("/api/jobs/categories/review")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const options = data?.categories || [];
        setCategories(options);
        const current = job.job_category || "";
        setCategorySelection(current && options.includes(current) ? current : (current ? "__custom__" : ""));
        setCustomCategory(current && !options.includes(current) ? current : "");
      })
      .catch(() => setCategories([]));
  }, [job?.id, job?.job_category]);
  React.useEffect(() => {
    if (!job?.id) return;
    fetch(`/api/jobs/${job.id}/analysis`).then(r=>r.ok?r.json():null).then(setAnalysis).catch(()=>setAnalysis(null));
    fetch(`/api/jobs/${job.id}/match-explanation`).then(r=>r.ok?r.json():null).then(setMatchExplanation).catch(()=>setMatchExplanation(null));
    fetch(`/api/resumes/match-scores?job_id=${job.id}`).then(r=>r.ok?r.json():[]).then(setResumeMatches).catch(()=>setResumeMatches([]));
  }, [job?.id, job?.updated_at]);

  const startEdit = () => {
    setEditForm({ company:job.company||"", title:job.title||"", location:job.location||"", role_type:job.role_type||"其他", skills:job.skills||"", jd_text:job.jd_text||"" });
    setEditing(true);
  };
  const saveEdit = async () => {
    setSaving(true);
    await fetch(`/api/jobs/${job.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(editForm) });
    setSaving(false); setEditing(false); await refresh(); show("已保存");
  };

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

  const runMatching = async () => {
    setMatching(true);
    const res = await fetch(`/api/jobs/${job.id}/match`, { method:"POST" });
    const data = await res.json().catch(() => ({}));
    setMatching(false);
    if (!res.ok) { show(data.detail || "匹配计算失败", "error"); return; }
    setMatchExplanation(data);
    await refresh();
    show("岗位匹配已更新");
  };

  const saveCategory = async () => {
    const category = (categorySelection === "__custom__" ? customCategory : categorySelection).trim();
    if (!category) { show(categorySelection === "__custom__" ? "请输入岗位类别" : "请选择岗位类别", "error"); return; }
    setSavingCategory(true);
    const res = await fetch(`/api/jobs/${job.id}/category-label`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ category }),
    });
    setSavingCategory(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      show(data.detail || "保存分类失败", "error");
      return;
    }
    await refresh();
    show("已保存人工复核类别");
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
  const taxonomyInfo = React.useMemo(() => {
    try {
      const parsed = JSON.parse(job.structured_json || "{}");
      return {
        reason: parsed.category_reason || "",
        note: parsed.taxonomy_note || "",
      };
    } catch (_) {
      return { reason:"", note:"" };
    }
  }, [job?.id, job?.structured_json]);

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
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"#6B7280", display:"flex", alignItems:"center", gap:4, fontSize:13 }}>
          ← 返回岗位列表
        </button>
        {onNavigate && jobs.length > 1 && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"#9CA3AF" }}>{currentIndex + 1} / {jobs.length}</span>
            <button onClick={() => prevJob && onNavigate(prevJob)} disabled={!prevJob}
              style={{ width:32, height:32, borderRadius:8, border:"1px solid #E5E7EB", background:prevJob?"#fff":"#F9FAFB", color:prevJob?"#374151":"#D1D5DB", cursor:prevJob?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => nextJob && onNavigate(nextJob)} disabled={!nextJob}
              style={{ width:32, height:32, borderRadius:8, border:"1px solid #E5E7EB", background:nextJob?"#fff":"#F9FAFB", color:nextJob?"#374151":"#D1D5DB", cursor:nextJob?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>
        {/* 主内容 */}
        <div>
          {/* 岗位基本信息 */}
          <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:16 }}>
            {!editing ? (
              <>
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
                  <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                    <MatchPill score={job.match_score} />
                    <Btn variant="outline" size="sm" onClick={startEdit}>✏️ 编辑</Btn>
                  </div>
                </div>
                {job.skills && (
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:12 }}>
                    {job.skills.split(",").filter(Boolean).map(t => <Badge key={t} variant="primary">{t.trim()}</Badge>)}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {(() => {
                  const inp = { width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#111827", fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box" };
                  const lbl = { fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:4, display:"block" };
                  const setF = (k,v) => setEditForm(f=>({...f,[k]:v}));
                  return <>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div><span style={lbl}>公司</span><input style={inp} value={editForm.company} onChange={e=>setF("company",e.target.value)} /></div>
                      <div><span style={lbl}>岗位名称</span><input style={inp} value={editForm.title} onChange={e=>setF("title",e.target.value)} /></div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div><span style={lbl}>地点</span><input style={inp} value={editForm.location} onChange={e=>setF("location",e.target.value)} /></div>
                      <div><span style={lbl}>方向</span>
                        <select style={{...inp,cursor:"pointer"}} value={editForm.role_type} onChange={e=>setF("role_type",e.target.value)}>
                          {ROLE_OPTIONS_JD.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><span style={lbl}>技能关键词（逗号分隔）</span><input style={inp} value={editForm.skills} onChange={e=>setF("skills",e.target.value)} /></div>
                    <div><span style={lbl}>岗位描述</span><textarea style={{...inp,minHeight:100,resize:"vertical"}} value={editForm.jd_text} onChange={e=>setF("jd_text",e.target.value)} /></div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      <Btn variant="outline" size="sm" onClick={() => setEditing(false)}>取消</Btn>
                      <Btn variant="primary" size="sm" onClick={saveEdit} disabled={saving}>{saving?"保存中…":"保存"}</Btn>
                    </div>
                  </>;
                })()}
              </div>
            )}
          </div>

          {/* 结构化岗位信息 */}
          {(job.job_category || job.education_required || job.salary_min || analysis?.skills?.length) && (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>结构化分析</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                {[["岗位大类",job.job_category||"待分类"],["标准城市",job.city_normalized||job.location||"未识别"],["学历要求",job.education_required||"未识别"]].map(([label,value])=><div key={label} style={{background:"#F9FAFB",borderRadius:8,padding:"9px 10px"}}><div style={{fontSize:10,color:"#9CA3AF",marginBottom:3}}>{label}</div><div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{value}</div></div>)}
              </div>
              {(job.salary_min || job.experience_required) && <div style={{fontSize:12,color:"#6B7280",marginBottom:10}}>薪资：{job.salary_min?`${job.salary_min}-${job.salary_max} ${job.salary_unit}`:"未识别"} · 经验：{job.experience_required||"未识别"}</div>}
              {analysis?.skills?.length > 0 && <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{analysis.skills.map(s=><span key={s.id} title={`${s.skill_type} · ${s.source}`} style={{fontSize:11,padding:"4px 8px",borderRadius:999,background:"#EEF2FF",color:"#4F46E5"}}>{s.skill_name}</span>)}</div>}
            </div>
          )}

          <div style={{ background:"#EEF2FF", border:"1px solid #C7D2FE", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.06em" }}>岗位匹配</div>
                <div style={{fontSize:11,color:"#6B7280",marginTop:3}}>基于求职偏好与个人经历的可解释规则结果</div>
              </div>
              <Btn variant="outline" size="sm" onClick={runMatching} disabled={matching}>{matching ? "计算中…" : "计算此岗位匹配"}</Btn>
            </div>
            {matchExplanation ? <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:12,color:"#4B5563"}}>个人经历匹配</span>
                <span style={{fontSize:12,fontWeight:700,color:"#4338CA"}}>{matchExplanation.score} 分 · {matchExplanation.label}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[['技能',matchExplanation.scores.skills],['经历',matchExplanation.scores.experience],['要求',matchExplanation.scores.requirements],['地点',matchExplanation.scores.location]].map(([label,score])=><div key={label} style={{background:"#fff",borderRadius:8,padding:"8px"}}><div style={{fontSize:10,color:"#9CA3AF"}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:"#374151"}}>{score}</div></div>)}
              </div>
              {matchExplanation.matched_skills?.length > 0 && <div style={{fontSize:12,color:"#374151",marginBottom:6}}>已匹配：{matchExplanation.matched_skills.join('、')}</div>}
              {matchExplanation.missing_skills?.length > 0 && <div style={{fontSize:12,color:"#92400E"}}>待补足：{matchExplanation.missing_skills.join('、')}</div>}
              <div style={{fontSize:10,color:"#6B7280",marginTop:8}}>{matchExplanation.evidence_note}</div>
            </> : <div style={{background:"#fff",borderRadius:8,padding:"12px",fontSize:12,color:"#6B7280"}}>先设置求职偏好并录入至少一条经历，然后点击“计算此岗位匹配”。</div>}
            <div style={{borderTop:"1px solid #C7D2FE",marginTop:12,paddingTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:"#4B5563"}}>已上传简历匹配</span><Btn variant="secondary" size="sm" onClick={() => onResume(job)}>管理简历</Btn></div>
              {resumeMatches.length ? <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{resumeMatches.map(item=><span key={item.resume_id} style={{fontSize:11,padding:"4px 8px",borderRadius:9999,background:"#fff",color:"#374151",border:"1px solid #DDE3F5"}}>{item.name} · {Math.round(item.match_score)}%</span>)}</div> : <div style={{fontSize:11,color:"#6B7280"}}>上传 HTML/PDF 简历后，可在这里对比每份简历与当前岗位的匹配度。</div>}
            </div>
          </div>

          {categories.length > 0 && (
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:16 }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>岗位类别</div>
                <span style={{fontSize:11,color:job.category_source === "manual" ? "#059669" : "#6B7280"}}>{job.category_source === "manual" ? "人工已确认" : job.category_source === "llm" ? "AI 分类" : "规则兜底"}</span>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <select value={categorySelection} onChange={e=>setCategorySelection(e.target.value)} style={{flex:1,minWidth:180,padding:"7px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,color:"#374151",background:"#fff"}}>
                  <option value="">请选择已有类别</option>
                  {categories.map(category => <option key={category} value={category}>{category}</option>)}
                  <option value="__custom__">输入新类别…</option>
                </select>
                {categorySelection === "__custom__" && <input value={customCategory} onChange={e=>setCustomCategory(e.target.value)} placeholder="输入新类别" style={{flex:1,minWidth:160,padding:"7px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,color:"#374151"}} />}
                <Btn variant="outline" size="sm" onClick={saveCategory} disabled={savingCategory}>{savingCategory ? "保存中…" : "确认类别"}</Btn>
                <Btn variant="secondary" size="sm" onClick={parseJD} disabled={parsing || !llmOk}>{parsing ? "分析中…" : "AI 重新分类"}</Btn>
              </div>
              <div style={{fontSize:11,color:"#9CA3AF",marginTop:8}}>类别体系是开放的；八类仅是输入建议。AI 可提出新类别、合并或拆分建议，人工确认后保存。</div>
              {(taxonomyInfo.reason || taxonomyInfo.note) && <div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:"#F8FAFC",fontSize:11,color:"#475569",lineHeight:1.6}}>
                {taxonomyInfo.reason && <div>分类依据：{taxonomyInfo.reason}</div>}
                {taxonomyInfo.note && <div style={{color:"#7C3AED",marginTop:3}}>体系建议：{taxonomyInfo.note}</div>}
              </div>}
            </div>
          )}

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
            {analysis?.application_events?.length > 0 && <div style={{marginTop:12,borderTop:"1px solid #F3F4F6",paddingTop:8}}>{analysis.application_events.slice(0,4).map(event=><div key={event.id} style={{fontSize:10,color:"#9CA3AF",marginTop:5}}>{event.from_status?`${event.from_status} → `:"创建："}{event.to_status}<br/>{event.occurred_at?.replace("T"," ")}</div>)}</div>}
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
