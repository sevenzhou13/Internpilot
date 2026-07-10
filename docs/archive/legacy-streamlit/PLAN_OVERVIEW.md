# InternPilot 开发计划总览

> 最后更新：2026-04-28
> 状态：未开始

---

## 整体里程碑

| 阶段 | 文档 | 预计用时 | 目标 | 状态 |
|---|---|---:|---|---|
| Phase 1 · P0 核心 | [PLAN_P0.md](./PLAN_P0.md) | Day 1–3 | 能导入岗位、算匹配分、生成简历 bullet | ✅ 已完成 |
| Phase 2 · P1 增强 | [PLAN_P1.md](./PLAN_P1.md) | Day 4–5 | LLM 解析 JD、推荐理由、AI 助手、Dashboard | ⬜ 未开始 |
| Phase 3 · Clipper | [PLAN_CLIPPER.md](./PLAN_CLIPPER.md) | Day 6 上午 | Chrome 插件可剪藏、复制 JSON | ⬜ 未开始 |
| Phase 4 · 收尾部署 | [PLAN_DEPLOY.md](./PLAN_DEPLOY.md) | Day 6–7 | 真实数据跑通、README、上线 | ⬜ 未开始 |

---

## 每日里程碑（硬性验收）

```
Day 1 结束：streamlit run app.py 无报错；能录入经历、设置偏好、手动导入 1 个岗位
Day 3 结束：能对岗位算出匹配分；能生成简历 bullet 和面试准备
Day 5 结束：JD 自动解析可用；AI 助手能上下文问答；Dashboard 数据正确
Day 6 结束：Clipper 插件能复制 JSON；Web App 能粘贴导入
Day 7 结束：用真实素材跑完整流程无崩溃；Streamlit Cloud 可访问
```

---

## 技术栈速查

| 用途 | 技术 |
|---|---|
| Web UI | Streamlit |
| 数据库 | SQLite（`data/internpilot.db`） |
| LLM | OpenAI API（`gpt-4o-mini` 默认） |
| 插件 | Chrome Extension Manifest V3 |
| 部署 | Streamlit Community Cloud |

---

## 项目目录结构（目标）

```
internpilot/
├── app.py
├── pages/
│   ├── 1_🏠_Dashboard.py
│   ├── 2_🎯_Profile.py
│   ├── 3_📚_Experience_Library.py
│   ├── 4_💼_Job_Recommendation.py
│   ├── 5_📝_Resume_Generator.py
│   ├── 6_🎤_Interview_Prep.py
│   └── 7_🤖_AI_Assistant.py
├── modules/
│   ├── db.py
│   ├── matcher.py
│   ├── llm_client.py
│   ├── jd_parser.py
│   ├── clip_parser.py
│   ├── resume_generator.py
│   ├── interview_generator.py
│   └── ai_assistant.py
├── prompts/
│   ├── jd_parser_prompt.txt
│   ├── clip_parser_prompt.txt
│   ├── resume_prompt.txt
│   ├── interview_prompt.txt
│   └── assistant_prompt.txt
├── extension/
│   ├── manifest.json
│   ├── popup.html / popup.css / popup.js
│   └── icons/
├── data/
│   ├── internpilot.db
│   └── sample_*.csv
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 全局注意事项

- **API Key 不能写死在代码里**，读 `st.secrets` 或环境变量，缺失时给提示不崩溃
- **所有 SQL 用参数化查询**，不用 f-string 拼接
- **数据库逻辑集中在 `modules/db.py`**，页面文件只调用封装函数
- **LLM 调用集中在 `modules/llm_client.py`**，Prompt 放 `prompts/` 目录
- **每完成一个 checkbox 立即更新对应阶段文档的状态**
- **每天结束前用真实数据跑一遍完整流程**，不要等到最后再测

---

## 状态图例

| 符号 | 含义 |
|---|---|
| ⬜ | 未开始 |
| 🔄 | 进行中 |
| ✅ | 已完成 |
| ❌ | 有问题/阻塞 |
| ⚠️ | 完成但有待优化 |
