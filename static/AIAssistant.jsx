// AI 求职助手页面

// 模块级状态：组件卸载后流仍在后台写入，重新挂载时读取
const _chat = { messages: null, sending: false };

const QUICK_PROMPTS = [
  "这个岗位我最大的竞争优势是什么？",
  "帮我准备一个 2 分钟的自我介绍",
  "这个 JD 有哪些隐藏要求？",
  "我和 JD 的能力 gap 在哪里？",
  "面试官可能会问什么问题？",
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const renderText = (text) => (
    <div className="md" style={{ fontSize:13.5 }} dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />
  );

  return (
    <div style={{ display:"flex", justifyContent: isUser?"flex-end":"flex-start", marginBottom:16 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:"50%", background:"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:8, marginTop:2 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      )}
      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems: isUser?"flex-end":"flex-start" }}>
        <div style={{ padding:"10px 14px", borderRadius: isUser?"12px 12px 2px 12px":"12px 12px 12px 2px", background: isUser?"#6366F1":"#fff", border: isUser?"none":"1px solid #E5E7EB", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", fontSize:13.5, color: isUser?"#fff":"#111827", lineHeight:1.65 }}>
          {msg.loading ? <div style={{ display:"flex", gap:4, alignItems:"center" }}><Spinner size={14} /><span style={{color:"#9CA3AF",fontSize:12}}>思考中…</span></div> : renderText(msg.content)}
        </div>
        <span style={{ fontSize:10, color:"#9CA3AF", marginTop:4 }}>{msg.time}</span>
      </div>
    </div>
  );
}

function AIAssistant() {
  const { jobs, experiences, llmOk } = React.useContext(AppContext);
  const { show, ToastContainer } = useToast();
  const initMsg = [{ role:"assistant", content:"你好！我是你的 AI 求职助手。\n\n选择一个目标岗位后，我可以帮你分析岗位匹配、优化简历、准备面试问答。有什么可以帮你的？", time: new Date().toLocaleTimeString("zh",{hour:"2-digit",minute:"2-digit"}) }];
  const [messages, setMessages] = React.useState(() => {
    if (_chat.messages) return _chat.messages;
    try { const s = sessionStorage.getItem("ai_messages"); return s ? JSON.parse(s) : initMsg; } catch { return initMsg; }
  });
  const [input, setInput] = React.useState("");
  const [selectedJobId, setSelectedJobId] = React.useState(jobs[0]?.id ?? null);
  const [useExp, setUseExp] = React.useState(true);
  const [sending, setSending] = React.useState(_chat.sending);
  const bottomRef = React.useRef(null);

  // 同步到模块级变量和 sessionStorage
  React.useEffect(() => {
    _chat.messages = messages;
    sessionStorage.setItem("ai_messages", JSON.stringify(messages));
  }, [messages]);

  // 组件挂载时若后台仍在流式输出，轮询同步最新内容
  React.useEffect(() => {
    if (!_chat.sending) return;
    const iv = setInterval(() => {
      if (_chat.messages) setMessages([..._chat.messages]);
      if (!_chat.sending) clearInterval(iv);
    }, 150);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = async (text) => {
    const txt = (text || input).trim();
    if (!txt || sending) return;
    setInput("");

    const userMsg = { role:"user", content:txt, time: new Date().toLocaleTimeString("zh",{hour:"2-digit",minute:"2-digit"}) };
    const loadingMsg = { role:"assistant", content:"", time:"", loading:true };
    const baseMessages = [...(_chat.messages || messages), userMsg, loadingMsg];
    _chat.messages = baseMessages;
    _chat.sending = true;
    setMessages(baseMessages);
    setSending(true);

    const apiMessages = [...messages, userMsg].map(m => ({ role:m.role, content:m.content }));
    const now = () => new Date().toLocaleTimeString("zh",{hour:"2-digit",minute:"2-digit"});

    try {
      const res = await fetch("/api/chat/stream", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ messages: apiMessages, job_id: selectedJobId, use_experiences: useExp }),
      });
      if (!res.ok) {
        const d = await res.json();
        const errMsgs = [...baseMessages.slice(0,-1), { role:"assistant", content:`⚠️ ${d.detail || "请求失败"}`, time:"" }];
        _chat.messages = errMsgs; _chat.sending = false;
        setMessages(errMsgs); setSending(false); return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const p = JSON.parse(payload);
            if (p.error) { full = `⚠️ ${p.error}`; break; }
            if (p.content) {
              full += p.content;
              const next = [...baseMessages.slice(0,-1), { role:"assistant", content: full, time: now(), loading:false }];
              _chat.messages = next;          // 后台继续写模块变量
              sessionStorage.setItem("ai_messages", JSON.stringify(next));
              setMessages(next);              // 若组件已卸载此调用为空操作
            }
          } catch {}
        }
      }
      if (!full) {
        const noRespMsgs = [...baseMessages.slice(0,-1), { role:"assistant", content:"⚠️ 无响应", time:"" }];
        _chat.messages = noRespMsgs;
        setMessages(noRespMsgs);
      }
    } catch {
      const errMsgs = [...baseMessages.slice(0,-1), { role:"assistant", content:"⚠️ 网络错误，请稍后重试", time:"" }];
      _chat.messages = errMsgs;
      setMessages(errMsgs);
    }
    _chat.sending = false;
    setSending(false);
  };

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden", background:"#F8F9FB" }}>
      {/* 左侧面板 */}
      <div style={{ width:260, background:"#fff", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 16px", borderBottom:"1px solid #E5E7EB" }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, color:"#111827", marginBottom:12 }}>AI 求职助手</h2>

          <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>目标岗位</div>
          {jobs.length === 0 ? (
            <div style={{ fontSize:12, color:"#9CA3AF" }}>请先导入岗位</div>
          ) : jobs.slice(0,5).map(job => (
            <div key={job.id} onClick={() => setSelectedJobId(job.id)} style={{ padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:4, background: selectedJobId===job.id?"#EEF2FF":"transparent", border: selectedJobId===job.id?"1.5px solid #C7D2FE":"1px solid transparent", transition:"all 120ms" }}>
              <div style={{ fontSize:12, fontWeight:600, color: selectedJobId===job.id?"#4338CA":"#111827" }}>{job.company || "—"}</div>
              <div style={{ fontSize:11, color:"#9CA3AF" }}>{job.title}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>上下文</div>
          {[
            { label:"个人经历库", count:`${experiences.length} 条经历`, on:useExp, toggle:()=>setUseExp(v=>!v) },
            { label:"目标岗位 JD", count: selectedJobId ? "已选择" : "未选择", on:!!selectedJobId },
            { label:"AI 模型", count: llmOk ? "已配置" : "未配置", on:llmOk },
          ].map((ctx, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", cursor: ctx.toggle?"pointer":"default" }} onClick={ctx.toggle}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: ctx.on?"#10B981":"#D1D5DB", flexShrink:0 }}></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:"#374151" }}>{ctx.label}</div>
                <div style={{ fontSize:10, color:"#9CA3AF" }}>{ctx.count}</div>
              </div>
              {ctx.toggle && <div style={{ fontSize:10, color:"#6366F1" }}>{ctx.on?"✓":"○"}</div>}
            </div>
          ))}
        </div>

        <div style={{ padding:"12px 16px", borderTop:"1px solid #F3F4F6" }}>
          <Btn variant="outline" size="sm" style={{ width:"100%", justifyContent:"center" }} onClick={() => { setMessages(initMsg); sessionStorage.removeItem("ai_messages"); }}>清空对话</Btn>
        </div>
      </div>

      {/* 聊天区域 */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {!llmOk && (
          <div style={{ background:"#FFFBEB", borderBottom:"1px solid #FDE68A", padding:"8px 20px", fontSize:12, color:"#92400E" }}>
            ⚠️ 未配置 API Key，AI 助手不可用。请在 .env 文件中设置 OPENAI_API_KEY。
          </div>
        )}

        {/* 消息列表 */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* 快捷问题 */}
        <div style={{ padding:"0 24px 10px", display:"flex", gap:6, flexWrap:"wrap" }}>
          {QUICK_PROMPTS.slice(0,4).map((p, i) => (
            <button key={i} onClick={() => send(p)} disabled={sending || !llmOk} style={{ padding:"5px 11px", borderRadius:9999, border:"1px solid #E5E7EB", background:"#fff", fontSize:12, color:"#6B7280", cursor:"pointer", fontFamily:"Inter,sans-serif" }}
              onMouseEnter={e => { e.target.style.borderColor="#6366F1"; e.target.style.color="#6366F1"; }}
              onMouseLeave={e => { e.target.style.borderColor="#E5E7EB"; e.target.style.color="#6B7280"; }}>
              {p}
            </button>
          ))}
        </div>

        {/* 输入框 */}
        <div style={{ padding:"0 24px 20px", display:"flex", gap:10, alignItems:"flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder={llmOk ? "输入你的问题... (Enter 发送，Shift+Enter 换行)" : "请先配置 API Key"}
            disabled={!llmOk || sending}
            style={{ flex:1, padding:"10px 14px", border:"1px solid #E5E7EB", borderRadius:10, fontSize:13, fontFamily:"Inter,sans-serif", color:"#111827", outline:"none", resize:"none", minHeight:44, maxHeight:120, lineHeight:1.5 }}
            rows={1}
          />
          <button onClick={() => send()} disabled={!llmOk || sending || !input.trim()} style={{ width:40, height:40, borderRadius:10, background: (!llmOk||sending||!input.trim())?"#E5E7EB":"#6366F1", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 150ms" }}>
            {sending ? <Spinner size={14} /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

Object.assign(window, { AIAssistant });
