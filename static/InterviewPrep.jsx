// 面试准备页面（含内嵌 AI 问答 + 笔记 + 历史版本）

const _interviewChats = {};
const _getChat = (jobId) => {
  if (!_interviewChats[jobId]) _interviewChats[jobId] = { messages: null, sending: false };
  return _interviewChats[jobId];
};

const INTERVIEW_PROMPTS = [
  "帮我准备一个 2 分钟自我介绍",
  "这个岗位最可能考什么技术点？",
  "针对我的经历，这道题怎么答？",
  "帮我用 STAR 框架组织一个回答",
  "我和 JD 的能力 gap 在哪？",
];

function InterviewChat({ job, experiences, llmOk }) {
  const jobId = job?.id ?? 0;
  const chatState = _getChat(jobId);
  const makeInitMsg = () => [{ role:"assistant", content:`你好！我是 ${job?.company||""}${job?.title ? " · "+job.title : ""}的面试助手。\n\n可以帮你组织回答思路、模拟面试问题、分析能力缺口。`, time: new Date().toLocaleTimeString("zh",{hour:"2-digit",minute:"2-digit"}) }];

  const [messages, setMessages] = React.useState(() => chatState.messages || makeInitMsg());
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(chatState.sending);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    const s = _getChat(jobId);
    setMessages(s.messages || makeInitMsg());
    setSending(s.sending);
  }, [jobId]);

  React.useEffect(() => { chatState.messages = messages; }, [messages]);

  React.useEffect(() => {
    if (!chatState.sending) return;
    const iv = setInterval(() => {
      if (chatState.messages) setMessages([...chatState.messages]);
      if (!chatState.sending) clearInterval(iv);
    }, 150);
    return () => clearInterval(iv);
  }, [jobId]);

  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async (text) => {
    const txt = (text || input).trim();
    if (!txt || sending) return;
    setInput("");
    const userMsg = { role:"user", content:txt, time: new Date().toLocaleTimeString("zh",{hour:"2-digit",minute:"2-digit"}) };
    const loadingMsg = { role:"assistant", content:"", time:"", loading:true };
    const base = [...(chatState.messages || messages), userMsg, loadingMsg];
    chatState.messages = base; chatState.sending = true;
    setMessages(base); setSending(true);

    const apiMessages = [...messages, userMsg].map(m => ({ role:m.role, content:m.content }));
    const now = () => new Date().toLocaleTimeString("zh",{hour:"2-digit",minute:"2-digit"});

    try {
      const res = await fetch("/api/chat/stream", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ messages: apiMessages, job_id: job?.id || null, use_experiences: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        const err = [...base.slice(0,-1), { role:"assistant", content:`⚠️ ${d.detail||"请求失败"}`, time:"" }];
        chatState.messages = err; chatState.sending = false; setMessages(err); setSending(false); return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream:true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const p = JSON.parse(payload);
            if (p.content) {
              full += p.content;
              const next = [...base.slice(0,-1), { role:"assistant", content:full, time:now(), loading:false }];
              chatState.messages = next; setMessages(next);
            }
          } catch {}
        }
      }
      if (!full) { const nr = [...base.slice(0,-1), { role:"assistant", content:"⚠️ 无响应", time:"" }]; chatState.messages = nr; setMessages(nr); }
    } catch { const em = [...base.slice(0,-1), { role:"assistant", content:"⚠️ 网络错误", time:"" }]; chatState.messages = em; setMessages(em); }
    chatState.sending = false; setSending(false);
  };

  const Bubble = ({ msg }) => {
    const isUser = msg.role === "user";
    return (
      <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", marginBottom:12 }}>
        {!isUser && (
          <div style={{ width:26, height:26, borderRadius:"50%", background:"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:7, marginTop:2 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
        )}
        <div style={{ maxWidth:"78%" }}>
          <div style={{ padding:"9px 13px", borderRadius:isUser?"12px 12px 2px 12px":"12px 12px 12px 2px", background:isUser?"#6366F1":"#fff", border:isUser?"none":"1px solid #E5E7EB", fontSize:12.5, color:isUser?"#fff":"#111827", lineHeight:1.65 }}>
            {msg.loading
              ? <div style={{ display:"flex", gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#C7D2FE", animation:`bounce 0.9s ${i*0.2}s infinite` }}/>)}</div>
              : <div className="md" style={{ fontSize:12.5 }} dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
            }
          </div>
          <div style={{ fontSize:10, color:"#9CA3AF", marginTop:3, textAlign:isUser?"right":"left" }}>{msg.time}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#fff" }}>
      <div style={{ padding:"12px 14px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>💬 AI 问答</div>
        <button onClick={() => { const init = makeInitMsg(); chatState.messages = init; setMessages(init); }}
          style={{ fontSize:11, color:"#9CA3AF", background:"none", border:"none", cursor:"pointer" }}>清空</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:"8px 12px 10px", borderTop:"1px solid #F3F4F6" }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          {INTERVIEW_PROMPTS.slice(0,3).map((p, i) => (
            <button key={i} onClick={() => send(p)} disabled={sending || !llmOk}
              style={{ padding:"3px 9px", borderRadius:9999, border:"1px solid #E5E7EB", background:"#F9FAFB", fontSize:11, color:"#6B7280", cursor:"pointer", fontFamily:"Inter,sans-serif", lineHeight:1.6 }}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder={llmOk ? "问 AI... (Enter 发送)" : "请先配置 API Key"}
            disabled={!llmOk || sending} rows={1}
            style={{ flex:1, padding:"8px 11px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:12.5, fontFamily:"Inter,sans-serif", color:"#111827", outline:"none", resize:"none", minHeight:36, maxHeight:100, lineHeight:1.5 }} />
          <button onClick={() => send()} disabled={!llmOk || sending || !input.trim()}
            style={{ width:34, height:34, borderRadius:8, background:(!llmOk||sending||!input.trim())?"#E5E7EB":"#6366F1", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {sending ? <Spinner size={12} /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewPrep({ job: propJob }) {
  const { jobs, experiences, llmOk } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const [selectedJobId, setSelectedJobId] = React.useState(propJob?.id || (jobs[0]?.id ?? null));
  const [generating, setGenerating] = React.useState(false);
  const [content, setContent] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("prep");
  const [notes, setNotes] = React.useState("");
  const [chatOpen, setChatOpen] = React.useState(true);
  const [history, setHistory] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const job = jobs.find(j => j.id === selectedJobId) || jobs[0] || null;

  React.useEffect(() => { if (propJob?.id) setSelectedJobId(propJob.id); }, [propJob]);

  React.useEffect(() => {
    if (!selectedJobId) return;
    const cached = sessionStorage.getItem(`interview_result_${selectedJobId}`);
    setContent(cached || null);
    setNotes(localStorage.getItem(`interview_notes_${selectedJobId}`) || "");
    setHistory([]); setShowHistory(false);
  }, [selectedJobId]);

  const saveNotes = (val) => {
    setNotes(val);
    if (selectedJobId) localStorage.setItem(`interview_notes_${selectedJobId}`, val);
  };

  const generate = async () => {
    if (!job) { show("请先选择岗位", "error"); return; }
    if (!llmOk) { show("未配置 API Key", "error"); return; }
    setGenerating(true); setContent(null);
    const res = await fetch("/api/generate/interview", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ job_id: job.id }) });
    setGenerating(false);
    if (res.ok) {
      const d = await res.json();
      setContent(d.content);
      sessionStorage.setItem(`interview_result_${job.id}`, d.content);
      setHistory([]); setShowHistory(false);
      show("生成完成");
    } else { const d = await res.json(); show(d.detail || "生成失败", "error"); }
  };

  const sel = { padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, color:"#374151", background:"#fff", outline:"none", cursor:"pointer", fontFamily:"Inter,sans-serif" };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#F8F9FB" }}>
      {/* 顶部栏 */}
      <div style={{ padding:"16px 24px 12px", borderBottom:"1px solid #E5E7EB", background:"#fff", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:700, color:"#111827", marginBottom:2 }}>面试准备</h1>
            {job && <div style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:6 }}>{job.company||"—"} · {job.title} <MatchPill score={job.match_score} /></div>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={() => setChatOpen(v => !v)}
              style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E5E7EB", background:chatOpen?"#EEF2FF":"#fff", color:chatOpen?"#6366F1":"#6B7280", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              {chatOpen ? "收起 AI 问答" : "💬 展开 AI 问答"}
            </button>
            <Btn variant="primary" size="md" onClick={generate} disabled={generating || !llmOk}>
              {generating ? <><Spinner size={12} /> 生成中…</> : "🎯 生成面试准备"}
            </Btn>
          </div>
        </div>
        <select style={{...sel, maxWidth:460}} value={selectedJobId || ""} onChange={e => setSelectedJobId(Number(e.target.value))}>
          {jobs.map(j => {
            const kws = (j.skills||"").split(",").filter(Boolean).slice(0,3).join(", ");
            return <option key={j.id} value={j.id}>{j.company||"—"} · {j.title}{kws?` [${kws}]`:""}</option>;
          })}
        </select>
      </div>

      {/* 主体：左右分栏 */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* 左：内容 + 笔记 */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          <div style={{ display:"flex", borderBottom:"1px solid #E5E7EB", marginBottom:16 }}>
            {[["prep","📋 准备内容"],["notes","📝 我的笔记"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ padding:"8px 16px", border:"none", borderBottom:activeTab===id?"2px solid #6366F1":"2px solid transparent", background:"none", fontSize:13, fontWeight:activeTab===id?600:400, color:activeTab===id?"#6366F1":"#6B7280", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === "prep" && (
            <>
              {generating ? (
                <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:60, textAlign:"center" }}>
                  <Spinner size={32} />
                  <div style={{ fontSize:14, color:"#9CA3AF", marginTop:16 }}>AI 分析中，请稍等…</div>
                </div>
              ) : content ? (
                <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 22px" }}>
                  <div style={{ fontSize:11, color:"#D97706", background:"#FFFBEB", borderRadius:6, padding:"5px 10px", marginBottom:14 }}>⚠️ AI 生成内容，仅供参考</div>
                  <div className="md" style={{ fontSize:13, color:"#374151" }} dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
                  <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #F3F4F6" }}>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginBottom:10 }}>
                      <Btn variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(content); show("已复制"); }}>复制全部</Btn>
                      <Btn variant="outline" size="sm" onClick={() => { saveNotes((notes ? notes + "\n\n---\n\n" : "") + content); setActiveTab("notes"); show("已导入笔记"); }}>导入到笔记</Btn>
                    </div>
                    <button onClick={async () => {
                      const r = await fetch(`/api/generate/history/${selectedJobId}?output_type=interview_prep`);
                      if (r.ok) setHistory(await r.json());
                      setShowHistory(v => !v);
                    }} style={{ fontSize:11, color:"#9CA3AF", background:"none", border:"none", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                      {showHistory ? "▲ 收起历史版本" : "▼ 查看历史版本"}
                    </button>
                    {showHistory && history.length > 0 && (
                      <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
                        {history.slice(0,5).map((h, i) => (
                          <div key={h.id} style={{ padding:"8px 10px", background:"#F9FAFB", borderRadius:8, border:"1px solid #E5E7EB" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                              <span style={{ fontSize:11, color:"#9CA3AF" }}>版本 {history.length - i} · {h.created_at?.slice(0,16).replace("T"," ")}</span>
                              <button onClick={() => setContent(h.content)} style={{ fontSize:11, color:"#6366F1", background:"none", border:"none", cursor:"pointer" }}>加载此版本</button>
                            </div>
                            <div style={{ fontSize:11, color:"#6B7280" }}>{h.content.slice(0,80)}…</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:60, textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>🎤</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#111827", marginBottom:6 }}>点击「生成面试准备」</div>
                  <div style={{ fontSize:12, color:"#9CA3AF" }}>AI 根据岗位 JD 和你的经历生成面试题、项目追问和知识点清单</div>
                </div>
              )}
            </>
          )}

          {activeTab === "notes" && (
            <div style={{ display:"flex", flexDirection:"column" }}>
              <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:8 }}>
                笔记自动保存到本地 · 支持 Markdown
                {content && <button onClick={() => { saveNotes((notes?""+notes+"\n\n---\n\n":"")+content); show("已导入"); }} style={{ marginLeft:10, fontSize:11, color:"#6366F1", background:"none", border:"none", cursor:"pointer" }}>← 从AI内容导入</button>}
              </div>
              <textarea value={notes} onChange={e => saveNotes(e.target.value)}
                placeholder={"# 面试笔记\n\n## 核心问题\n- \n\n## 项目回答思路\n\n## 待准备知识点\n"}
                style={{ minHeight:400, padding:"14px 16px", border:"1px solid #E5E7EB", borderRadius:12, fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:"#374151", outline:"none", resize:"vertical", lineHeight:1.7, background:"#fff" }} />
            </div>
          )}
        </div>

        {/* 右：AI 问答面板 */}
        {chatOpen && (
          <div style={{ width:340, borderLeft:"1px solid #E5E7EB", flexShrink:0, display:"flex", flexDirection:"column" }}>
            <InterviewChat job={job} experiences={experiences} llmOk={llmOk} />
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

Object.assign(window, { InterviewPrep });
