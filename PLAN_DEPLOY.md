# Phase 4 · 收尾、真实数据验证与部署

> 预计用时：Day 6 下午 – Day 7
> 前置条件：P0 + P1 + Clipper 全部完成
> 目标：用真实数据跑完整流程无崩溃；README 完整；Streamlit Cloud 可访问
> 状态：⬜ 未开始

---

## Day 6 下午 · 真实数据录入与全流程测试

### 7.1 录入个人经历（必须亲自完成，Claude 无法代劳）

- [ ] 录入至少 5 条真实经历，涵盖：
  - 数据分析 / 编程项目（至少 1 条）
  - 科研经历（至少 1 条）
  - 用户研究 / 产品相关（至少 1 条）
  - 技能模块（工具列表）
- [ ] 每条经历填写 `keywords` 和 `tools` 字段（这是匹配算法的核心输入）
- [ ] 填写 `target_roles`（适配哪个方向）

> ⚠️ 经历数据质量直接决定匹配分和 bullet 生成质量，这是最重要的一步

### 7.2 设置求职偏好

- [ ] target_roles：数据分析、AI产品、用户研究（按实际情况）
- [ ] target_locations：目标城市
- [ ] preferred_industries：偏好行业
- [ ] 填写实习周期和可开始时间

### 7.3 导入真实岗位

- [ ] 用 Clipper 从 BOSS 或公司官网剪藏至少 3 个岗位
- [ ] 手动输入至少 2 个岗位
- [ ] 对所有岗位运行 JD 解析（AI 解析 + 手动核查结果）
- [ ] 批量计算匹配分，核查推荐排序是否符合直觉

### 7.4 全流程功能测试

- [ ] **简历生成**：对匹配度最高的岗位生成 bullet，人工判断质量
  - 是否基于真实经历？
  - 是否有编造的指标？
  - 语言是否流畅自然？
- [ ] **面试准备**：生成面试问题，判断是否针对该岗位
- [ ] **AI 助手**：连续提 5 个问题，回答是否有意义

### 7.5 Bug 修复

- [ ] 记录测试中发现的所有 bug（在此文件的"已知问题"区域）
- [ ] 修复会影响核心流程的 bug（P0 级）
- [ ] 不影响核心流程的问题记录为 Known Issues

---

## Day 7 · 示例数据 + README + 部署

### 7.6 准备示例数据

- [ ] 创建 `data/sample_experiences.csv`：3-5 条匿名化示例经历
- [ ] 创建 `data/sample_jobs.csv`：5-10 条示例岗位（可从公开 GitHub 实习仓库取）
- [ ] 创建 `data/sample_clip.json`：一条示例插件 JSON

> ⚠️ 示例数据必须是虚构或匿名化数据，不能包含真实姓名、学校、公司等私人信息

### 7.7 补充 Prompt 文件

确认以下文件都已创建且内容完整：
- [ ] `prompts/jd_parser_prompt.txt`
- [ ] `prompts/clip_parser_prompt.txt`
- [ ] `prompts/resume_prompt.txt`
- [ ] `prompts/interview_prompt.txt`
- [ ] `prompts/assistant_prompt.txt`

### 7.8 写 README.md

- [ ] 项目简介（1-2 段）
- [ ] 核心功能列表
- [ ] 技术栈
- [ ] 系统架构图（可用 Mermaid 文字描述）
- [ ] 项目目录结构
- [ ] 数据库结构概览
- [ ] 本地运行方式
  ```bash
  git clone ...
  cd internpilot
  python -m venv venv && source venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env  # 填写 API Key
  streamlit run app.py
  ```
- [ ] 环境变量配置
- [ ] InternPilot Clipper 插件安装说明
- [ ] Demo 数据说明（如何加载示例数据）
- [ ] Roadmap

### 7.9 配置部署

**Streamlit Community Cloud 部署：**
- [ ] 确认 `requirements.txt` 所有依赖版本正确
- [ ] 确认 `data/internpilot.db` 在 `.gitignore` 中（不上传真实数据库）
- [ ] 确认 `.env` 和 `secrets.toml` 在 `.gitignore` 中
- [ ] 在 Streamlit Cloud 后台配置 `OPENAI_API_KEY` secrets
- [ ] 推送到 GitHub，连接 Streamlit Cloud，部署

**部署验证：**
- [ ] 访问部署 URL，app 能正常加载
- [ ] 加载示例数据后，能看到示例岗位和推荐
- [ ] LLM 功能（用 Streamlit Cloud secrets 配置的 key）能正常调用

### 7.10 项目截图

- [ ] Dashboard 截图（有示例数据）
- [ ] 岗位推荐页面截图
- [ ] 简历生成截图（示例 bullet）
- [ ] Clipper 插件截图（popup 界面）
- [ ] 添加到 README 或 `assets/screenshots/`

---

## 注意事项

### 数据安全
- **部署前最后检查**：`git status` 确认没有 `.env`、`secrets.toml`、真实 `internpilot.db` 被提交
- 示例数据的岗位信息只能用公开信息（公司名可以用，但 JD 内容要脱敏或使用虚构内容）
- 不要把自己真实的简历 bullet 作为示例数据

### 部署相关
- Streamlit Community Cloud 的文件系统是**临时的**，每次重启数据会丢失——这对于演示版本是可以接受的，在 README 中说明
- 如果需要持久化演示数据，考虑把初始化数据写入 `app.py` 的 `init_db()` 中（仅限演示环境）
- 插件仍然指向 `localhost:8501`，部署后需要在插件 `popup.js` 中更新 URL，或者做成可配置的

### Prompt 质量最后检验
- 对每个 Prompt，用 2-3 个不同类型的岗位测试，确保不会出现：
  - 编造经历指标
  - 生成英文（除非明确要求）
  - 输出格式错误（JSON 解析失败）
  - 忽略用户经历，全靠模型"想象"

### 简历项目表述准备
- [ ] 写好简历中的项目描述（参考文档中的中英文模板）
- [ ] 准备 GitHub README 首图（可以用截图）

---

## 已知问题记录

> 在测试过程中发现的问题记录在这里，便于追踪

| 问题描述 | 严重程度 | 是否已修复 | 备注 |
|---|---|---|---|
| （测试时填写） | | | |

---

## Phase 4 完成标志

- [ ] 用真实经历 + 真实岗位跑完整流程，没有崩溃
- [ ] 生成的 bullet 质量：基于真实经历、没有编造数据、语言流畅
- [ ] README 完整，可以给别人看懂怎么跑
- [ ] Streamlit Cloud 链接可以访问（即使是空数据库状态）
- [ ] GitHub 上没有敏感数据
- [ ] Clipper 插件可以加载并正常工作

---

## 项目完成后的 Checklist

- [ ] GitHub repo 整洁，有完整 README
- [ ] 部署链接有效
- [ ] 简历项目描述已更新
- [ ] 能够向别人演示 3 分钟的核心流程
- [ ] 知道下一步想做什么（P2 功能或增强）
