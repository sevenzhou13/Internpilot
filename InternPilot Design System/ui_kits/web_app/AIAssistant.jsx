// AI Assistant Screen

const QUICK_PROMPTS = [
  "这个岗位我最大的竞争优势是什么？",
  "帮我优化简历第 2 条 bullet point",
  "如何回答「你最大的缺点」？",
  "这个 JD 有哪些隐藏要求？",
  "帮我准备一个 60 秒自我介绍",
];

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content: "你好！我是你的 AI 求职助手。我已经读取了你的经历素材库和目标岗位信息。\n\n目前你有 **3 个高匹配岗位**，我可以帮你分析岗位要求、优化简历、准备面试问答，或者回答任何求职相关问题。有什么我可以帮你的？",
    time: "09:15",
  },
  {
    role: "user",
    content: "帮我分析一下小红书数据分析实习这个岗位，我的优势和劣势分别是什么？",
    time: "09:16",
  },
  {
    role: "assistant",
    content: "根据你的经历和小红书岗位 JD，我的分析如下：\n\n**优势 ✅**\n• 小红书数据分析项目直接命中岗位需求，有真实的业务背景\n• Python + SQL + A/B 测试技能完整，且有量化结果（DAU +12%）\n• EEG + 眼动研究背景展现出较强的研究方法论能力\n• 研究生学历满足岗位要求\n\n**劣势 / 待补充 ⚠️**\n• 缺少 Tableau 或其他 BI 工具经验（JD 中提到）\n• 电商 / 内容平台大规模数据经验相对有限\n• 可以补充一个「数据驱动产品决策」的完整案例\n\n**建议**：在简历中重点突出 A/B 实验的样本量和统计方法，这是很多候选人忽略的差异化亮点。",
    time: "09:16",
  },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
        </div>
      )}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "10px 14px", borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          background: isUser ? "#6366F1" : "#fff",
          border: isUser ? "none" : "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          fontSize: 13.5, color: isUser ? "#fff" : "#111827", lineHeight: 1.65,
        }}>
          {msg.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <div key={i} style={{ fontWeight: 700, marginTop: i > 0 ? 8 : 0 }}>{line.replace(/\*\*/g, '')}</div>;
            }
            if (line.startsWith('• ')) {
              return <div key={i} style={{ paddingLeft: 8 }}>• {line.slice(2)}</div>;
            }
            if (line === '') return <div key={i} style={{ height: 4 }}></div>;
            return <div key={i}>{line}</div>;
          })}
        </div>
        <span style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>{msg.time}</span>
      </div>
    </div>
  );
}

function AIAssistant() {
  const [messages, setMessages] = React.useState(INITIAL_MESSAGES);
  const [input, setInput] = React.useState("");
  const [selectedJob, setSelectedJob] = React.useState(0);

  const send = (text) => {
    const txt = text || input;
    if (!txt.trim()) return;
    setMessages(m => [...m, { role: "user", content: txt, time: "现在" }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { role: "assistant", content: "我正在分析你的问题，请稍候…（这是演示模式，实际版本将连接 AI 模型）", time: "现在" }]);
    }, 600);
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "#F8F9FB" }}>
      {/* Left panel */}
      <div style={{ width: 260, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid #E5E7EB" }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>AI 求职助手</h2>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>当前岗位</div>
          {JOBS_DATA.slice(0, 3).map((job, i) => (
            <div key={i} onClick={() => setSelectedJob(i)} style={{
              padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
              background: selectedJob === i ? "#EEF2FF" : "transparent",
              border: selectedJob === i ? "1.5px solid #C7D2FE" : "1px solid transparent",
              transition: "all 120ms",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: selectedJob === i ? "#4338CA" : "#111827" }}>{job.company}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{job.role}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>上下文</div>
          {[{ label: "经历素材库", count: `${EXPERIENCES.length} 条经历`, on: true },
            { label: "岗位 JD", count: "已加载", on: true },
            { label: "匹配分析", count: "88% 匹配", on: true },
            { label: "历史对话", count: "本轮对话", on: false },
          ].map((ctx, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ctx.on ? "#10B981" : "#D1D5DB", flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{ctx.label}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>{ctx.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </div>

        {/* Quick prompts */}
        <div style={{ padding: "0 24px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
            <button key={i} onClick={() => send(p)} style={{
              padding: "5px 11px", borderRadius: 9999, border: "1px solid #E5E7EB",
              background: "#fff", fontSize: 12, color: "#6B7280", cursor: "pointer",
              fontFamily: "Inter, sans-serif", transition: "all 120ms",
            }}
            onMouseEnter={e => { e.target.style.borderColor = "#6366F1"; e.target.style.color = "#6366F1"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.color = "#6B7280"; }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
            style={{
              flex: 1, padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 10,
              fontSize: 13, fontFamily: "Inter, sans-serif", color: "#111827", outline: "none",
              resize: "none", minHeight: 44, maxHeight: 120, lineHeight: 1.5,
            }}
            rows={1}
          />
          <button onClick={() => send()} style={{
            width: 40, height: 40, borderRadius: 10, background: "#6366F1", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AIAssistant });
