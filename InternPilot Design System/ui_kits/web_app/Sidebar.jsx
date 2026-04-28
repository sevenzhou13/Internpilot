// Shared data, components, and Sidebar for InternPilot Web App

const JOBS_DATA = [
  {
    id: 1, company: "小红书", role: "数据分析实习生", location: "上海", match: 88,
    duration: "3–6 个月", salary: "500–700 元/天", status: "待投递",
    tags: ["Python", "SQL", "A/B测试", "数据可视化"],
    reason: "你的小红书数据分析项目与该岗位高度吻合，Python 和 SQL 技能匹配度极高。",
    jd: `岗位职责：
1. 参与平台核心数据指标的监控与分析，输出数据报告和业务洞察
2. 独立完成数据提取、清洗、分析全流程，支持业务决策
3. 建立数据看板，优化现有分析体系
4. 与产品、运营团队协作，推动数据驱动业务增长

任职要求：
1. 统计学、数学、计算机相关专业本科及以上学历
2. 熟练掌握 Python/R，熟悉 SQL 数据查询
3. 了解 A/B 实验设计与统计检验方法
4. 具有数据可视化经验（Tableau/ECharts 等）
5. 有互联网数据分析实习经验优先`,
  },
  {
    id: 2, company: "字节跳动", role: "AI 产品实习生", location: "北京", match: 84,
    duration: "3个月+", salary: "600–800 元/天", status: "已投递",
    tags: ["产品设计", "AIGC", "用户研究", "PRD"],
    reason: "你的 AIGC 审美计算项目和用户研究背景与 AI 产品岗位高度匹配。",
    jd: `岗位职责：
1. 参与 AI 产品的需求调研、方案设计及落地
2. 跟踪 AI 行业前沿动态，输出竞品分析和产品方向建议
3. 协助撰写 PRD，推动功能迭代
4. 与算法、工程团队协作，优化产品体验

任职要求：
1. 对 AI/AIGC 产品有浓厚兴趣，有相关项目经历优先
2. 具备基本的产品思维，能够独立完成产品文档撰写
3. 了解用户研究方法，有实际用户调研经验
4. 逻辑思维能力强，善于发现问题和解决问题`,
  },
  {
    id: 3, company: "腾讯", role: "用户研究实习生", location: "深圳", match: 79,
    duration: "3个月+", salary: "450–600 元/天", status: "面试中",
    tags: ["眼动追踪", "用户访谈", "问卷设计", "定性研究"],
    reason: "你的眼动 AOI 分析和 EEG 审美研究经历非常符合该岗位对研究方法的要求。",
    jd: `岗位职责：
1. 参与用户研究项目，包括用户访谈、问卷调研、可用性测试等
2. 数据分析与报告撰写，提炼用户需求和产品优化建议
3. 协助搭建用户研究方法体系

任职要求：
1. 心理学、传播学、设计学等相关专业
2. 熟悉定性和定量研究方法
3. 有眼动、EEG 等生理指标研究经验优先
4. 具备数据分析能力`,
  },
  {
    id: 4, company: "阿里巴巴", role: "数据产品实习生", location: "杭州", match: 71,
    duration: "6个月", salary: "550–750 元/天", status: "待投递",
    tags: ["数据产品", "SQL", "业务分析"],
    reason: "数据分析背景匹配，但缺少电商数据产品经验。",
    jd: "负责数据产品设计与迭代，支持业务数据化运营。",
  },
  {
    id: 5, company: "网易", role: "用户增长分析实习生", location: "广州", match: 68,
    duration: "3个月", salary: "400–550 元/天", status: "待投递",
    tags: ["增长分析", "Python", "漏斗分析"],
    reason: "Python 技能匹配，游戏行业经验稍有欠缺。",
    jd: "负责用户增长数据分析，支持增长策略制定。",
  },
];

const EXPERIENCES = [
  {
    id: 1, title: "小红书人脸 P 图数据分析",
    category: "数据分析项目", date: "2023.09 – 2024.01",
    desc: "使用 Python + SQL 分析 50 万+用户的美颜功能使用行为，识别高频操作路径，提出优化建议被采纳，DAU 提升 12%。",
    skills: ["Python", "SQL", "数据可视化", "A/B测试"],
    bullets: [
      "基于 50 万+ MAU 数据，构建用户美颜行为漏斗，识别 3 个关键流失节点",
      "设计并执行 A/B 实验，验证 UI 优化方案，推动 DAU 提升 12%",
      "输出自动化日报系统，将报告生产时间从 4h 降至 30min",
    ]
  },
  {
    id: 2, title: "EEG 审美偏好神经计算研究",
    category: "学术研究", date: "2023.03 – 2023.12",
    desc: "作为第一作者，使用 64 通道 EEG 采集 30 名被试的审美判断脑电数据，提取 P300 成分，构建分类模型 AUC=0.87。",
    skills: ["EEG", "MATLAB", "机器学习", "神经科学"],
    bullets: [
      "招募并管理 30 名被试，完成 EEG 范式设计与数据采集全流程",
      "提取 P300 ERP 成分，使用 SVM 构建审美偏好分类模型，AUC=0.87",
      "以第一作者身份撰写研究报告，投稿 CHI 2024",
    ]
  },
  {
    id: 3, title: "眼动 AOI 兴趣区域分析",
    category: "用户研究项目", date: "2023.06 – 2023.09",
    desc: "使用 Tobii 眼动仪对 25 名用户进行电商页面可用性测试，分析注视热力图，为设计团队提供布局优化建议。",
    skills: ["眼动追踪", "Tobii", "用户研究", "可用性测试"],
    bullets: [
      "设计眼动实验方案，独立完成 25 名用户的可用性测试",
      "分析 AOI 注视数据与热力图，发现首屏关键区域注视率低 40%",
      "输出可用性测试报告，建议被产品团队采纳并推动页面重新布局",
    ]
  },
  {
    id: 4, title: "AIGC 图像审美计算项目",
    category: "AI 应用研究", date: "2024.01 – 至今",
    desc: "基于 CLIP 模型构建多维度审美评分系统，对 AIGC 图像进行构图、色彩、风格的自动化评估，准确率达 82%。",
    skills: ["CLIP", "Python", "深度学习", "AIGC"],
    bullets: [
      "基于 CLIP 构建多模态审美评分模型，覆盖构图/色彩/风格三维度",
      "收集并标注 5000 张 AIGC 图像，建立审美评估基准数据集",
      "模型在人工评分对比中准确率达 82%，优于 baseline 17 个百分点",
    ]
  },
];

// ─── Shared UI components ────────────────────────────────────────────────────

function Badge({ variant = "neutral", children }) {
  const colors = {
    primary: { bg: "#EEF2FF", color: "#4338CA" },
    success: { bg: "#ECFDF5", color: "#047857" },
    warning: { bg: "#FFFBEB", color: "#D97706" },
    danger:  { bg: "#FEF2F2", color: "#DC2626" },
    info:    { bg: "#EFF6FF", color: "#2563EB" },
    neutral: { bg: "#F3F4F6", color: "#4B5563" },
  };
  const c = colors[variant] || colors.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 9999, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function MatchPill({ score }) {
  const color = score >= 80 ? "#047857" : score >= 70 ? "#D97706" : "#DC2626";
  const bg    = score >= 80 ? "#ECFDF5" : score >= 70 ? "#FFFBEB" : "#FEF2F2";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
      borderRadius: 9999, fontSize: 12, fontWeight: 700, background: bg, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }}></span>
      {score}%
    </span>
  );
}

function StatusTag({ status }) {
  const map = {
    "待投递": { bg: "#F3F4F6", color: "#6B7280" },
    "已投递": { bg: "#EFF6FF", color: "#2563EB" },
    "面试中": { bg: "#FFFBEB", color: "#D97706" },
    "已录用": { bg: "#ECFDF5", color: "#059669" },
    "已淘汰": { bg: "#FEF2F2", color: "#DC2626" },
  };
  const s = map[status] || map["待投递"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 6, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color,
    }}>{status}</span>
  );
}

function Btn({ variant = "primary", size = "md", onClick, children, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "none",
    borderRadius: 8, fontFamily: "Inter, sans-serif", cursor: "pointer",
    fontWeight: 500, transition: "all 150ms", whiteSpace: "nowrap",
  };
  const sizes = { sm: { padding: "5px 11px", fontSize: 12 }, md: { padding: "7px 14px", fontSize: 13 }, lg: { padding: "9px 18px", fontSize: 14 } };
  const variants = {
    primary:   { background: "#6366F1", color: "#fff" },
    secondary: { background: "#F3F4F6", color: "#374151" },
    outline:   { background: "transparent", border: "1px solid #E5E7EB", color: "#6B7280" },
    ghost:     { background: "transparent", color: "#6B7280" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function MatchBar({ value, color }) {
  const c = value >= 80 ? "#10B981" : value >= 70 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ height: 4, background: "#F3F4F6", borderRadius: 9999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color || c, borderRadius: 9999 }}></div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",   label: "Dashboard",   icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { id: "jobs",        label: "岗位推荐",      icon: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z", badge: 8 },
  { id: "experiences", label: "经历素材库",    icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
  { id: "resume",      label: "简历生成",      icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  { id: "interview",   label: "面试准备",      icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { id: "ai",          label: "AI 助手",       icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
];

function Icon({ d, size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.split("M").filter(Boolean).map((seg, i) => (
        <path key={i} d={"M" + seg} />
      ))}
    </svg>
  );
}

function Sidebar({ active, onNav }) {
  return (
    <div style={{
      width: 240, minHeight: "100vh", background: "#fff",
      borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, background: "#6366F1", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: -0.3 }}>
            Intern<span style={{ color: "#6366F1" }}>Pilot</span>
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ padding: "8px 8px", flex: 1 }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <div key={item.id} onClick={() => onNav(item.id)} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "7px 9px", borderRadius: 8, cursor: "pointer", marginBottom: 1,
              background: isActive ? "#EEF2FF" : "transparent",
              color: isActive ? "#4338CA" : "#6B7280",
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: isActive ? 600 : 500,
              transition: "all 120ms",
            }}>
              <Icon d={item.icon} size={14} color={isActive ? "#6366F1" : "#9CA3AF"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: "#EEF2FF", color: "#4338CA", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999 }}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* User */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", background: "#EEF2FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#4F46E5",
        }}>李</div>
        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#111827" }}>李同学</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9CA3AF" }}>传播学研究生</div>
        </div>
      </div>
    </div>
  );
}

// Export to global scope
Object.assign(window, { Sidebar, Badge, MatchPill, StatusTag, Btn, MatchBar, Icon, JOBS_DATA, EXPERIENCES });
