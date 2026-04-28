// 面试准备页面

function InterviewPrep({ job: propJob }) {
  const { jobs, llmOk } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const [selectedJobId, setSelectedJobId] = React.useState(propJob?.id || (jobs[0]?.id ?? null));
  const [generating, setGenerating] = React.useState(false);
  const [content, setContent] = React.useState(null);

  const job = jobs.find(j => j.id === selectedJobId) || jobs[0] || null;

  React.useEffect(() => {
    if (propJob?.id) setSelectedJobId(propJob.id);
  }, [propJob]);

  React.useEffect(() => {
    if (!selectedJobId) return;
    const cached = sessionStorage.getItem(`interview_result_${selectedJobId}`);
    setContent(cached || null);
  }, [selectedJobId]);

  const generate = async () => {
    if (!job) { show("请先选择岗位", "error"); return; }
    if (!llmOk) { show("未配置 API Key", "error"); return; }
    setGenerating(true);
    setContent(null);
    const res = await fetch("/api/generate/interview", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ job_id: job.id }) });
    setGenerating(false);
    if (res.ok) {
      const d = await res.json();
      setContent(d.content);
      sessionStorage.setItem(`interview_result_${job.id}`, d.content);
      show("生成完成");
    }
    else { const d = await res.json(); show(d.detail || "生成失败", "error"); }
  };

  const sel = { padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#374151", background:"#fff", outline:"none", cursor:"pointer", fontFamily:"Inter,sans-serif", maxWidth:400, width:"100%" };

  // 简单 markdown 渲染
  const renderContent = (text) => (
    <div className="md" style={{ fontSize:13, color:"#374151" }} dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />
  );

  return (
    <div style={{ flex:1, overflowY:"auto", background:"#F8F9FB", padding:32 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:"#111827", marginBottom:3 }}>面试准备</h1>
          {job && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#9CA3AF" }}>
              <span>目标岗位：</span>
              <span style={{ color:"#111827", fontWeight:600 }}>{job.company || "—"} · {job.title}</span>
              <MatchPill score={job.match_score} />
            </div>
          )}
        </div>
        <Btn variant="primary" size="md" onClick={generate} disabled={generating || !llmOk}>
          {generating ? <><Spinner size={12} /> 生成中…</> : "🎯 生成面试准备"}
        </Btn>
      </div>

      <div style={{ marginBottom:16 }}>
        <select style={sel} value={selectedJobId || ""} onChange={e => setSelectedJobId(Number(e.target.value))}>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.company || "—"} · {j.title}</option>)}
        </select>
      </div>

      {!llmOk && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#92400E", marginBottom:16 }}>
          ⚠️ 未配置 API Key，无法生成面试准备内容。请在 .env 文件中配置 OPENAI_API_KEY。
        </div>
      )}

      {generating ? (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:60, textAlign:"center" }}>
          <Spinner size={32} />
          <div style={{ fontSize:14, color:"#9CA3AF", marginTop:16 }}>AI 分析中，请稍等…</div>
        </div>
      ) : content ? (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:11, color:"#D97706", background:"#FFFBEB", borderRadius:6, padding:"6px 10px", marginBottom:16 }}>
            ⚠️ 以下内容由 AI 生成，仅供参考
          </div>
          {renderContent(content)}
          <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #F3F4F6", display:"flex", justifyContent:"flex-end" }}>
            <Btn variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(content); show("已复制"); }}>复制全部</Btn>
          </div>
        </div>
      ) : (
        <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:60, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🎤</div>
          <div style={{ fontSize:15, fontWeight:600, color:"#111827", marginBottom:8 }}>点击「生成面试准备」</div>
          <div style={{ fontSize:13, color:"#9CA3AF" }}>AI 将根据岗位 JD 和你的经历生成面试问题、项目追问和知识点清单</div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { InterviewPrep });
