# Phase 2 · P1 增强功能

> 预计用时：Day 4–5
> 前置条件：P0 全部完成，`streamlit run app.py` 无崩溃
> 目标：LLM 解析 JD、生成推荐理由、AI 助手上线、Dashboard 数据可用
> 状态：⬜ 未开始

---

## Day 4 · JD 解析 + 推荐理由 + 匹配增强

### 4.1 实现 `modules/jd_parser.py`

- [ ] 读取 `prompts/jd_parser_prompt.txt`
- [ ] `parse_jd(jd_text, page_title=None, apply_url=None, source_domain=None) -> dict`
- [ ] 输出标准字段：`company / title / location / role_type / summary / responsibilities / requirements / skills / risk_points`
- [ ] 解析结果中 `skills` 字段写回 `jobs` 表的 `skills` 列（逗号拼接）
- [ ] JSON 解析失败时返回原始文本 + 警告，不崩溃

**注意 Prompt 设计：**
- `role_type` 只能从：`数据分析 / AI产品 / 产品经理 / 用户研究 / 其他` 选
- 告知模型文本可能包含页面噪声（导航栏、广告等），优先提取核心岗位信息
- 输出严格 JSON，不加 markdown 代码块

#### 4.2 实现 `prompts/jd_parser_prompt.txt`
- [ ] 包含：角色设定、输入变量（page_title / url / source_domain / clip_text）、输出 JSON 格式
- [ ] 明确禁止编造

#### 4.3 更新 Job Recommendation 页面

**新增"解析 JD"按钮：**
- [ ] 在岗位详情旁边加"用 AI 解析 JD"按钮
- [ ] 调用 `parse_jd()`，解析后更新 `company / title / location / role_type / skills` 字段
- [ ] 展示解析结果预览，用户可手动修正后保存

**新增"生成推荐理由"按钮：**
- [ ] 调用 LLM，根据岗位 JD + 用户经历 + 偏好，生成 100-200 字推荐理由
- [ ] 保存到 `jobs.recommendation_reason`
- [ ] 在岗位列表中展示推荐理由（折叠）

#### 4.4 批量计算匹配分增强
- [ ] "批量重新计算"时，如果岗位已有解析后的 `skills` 字段，优先用解析结果
- [ ] 计算后展示分数分布（多少个强烈推荐 / 推荐 / 谨慎推荐）

### Day 4 验收
- [ ] 对 3 个不同来源岗位（手动 / CSV / Clipper JSON）用 AI 解析 JD，结果合理
- [ ] 解析后 role_type 和 skills 字段自动更新，匹配分有变化
- [ ] 能生成推荐理由，内容具体（不是"这个岗位很适合你"这种废话）

---

## Day 5 · AI 助手 + Dashboard + 生成历史

### 5.1 实现 `modules/ai_assistant.py`

- [ ] 读取 `prompts/assistant_prompt.txt`
- [ ] `build_context(job=None, experiences=None) -> str`：把当前岗位 JD + 用户经历拼成上下文
- [ ] `chat(messages, job=None, experiences=None) -> str`：带上下文的多轮对话
- [ ] 上下文截断：单次 Prompt 总长度控制在 4000 token 内

**System Prompt 设计要点（`prompts/assistant_prompt.txt`）：**
- 明确角色：求职助手，不是通用闲聊机器人
- 优先基于提供的 JD 和经历回答，不要凭空发挥
- 支持：岗位适配判断 / 简历经历讲述 / 面试预测 / 模拟面试 / 知识点解释

#### 5.2 实现 AI Assistant 页面

- [ ] 文件：`pages/7_🤖_AI_Assistant.py`
- [ ] 顶部选择器：选择当前岗位（可不选）
- [ ] 勾选框：是否带入个人经历库作为上下文
- [ ] 聊天记录用 `st.session_state.messages` 维护
- [ ] 用 `st.chat_message` + `st.chat_input` 实现对话 UI
- [ ] 快捷问题按钮（3-5 个常用问题，点击直接发送）：
  - "这个岗位适合我吗？"
  - "帮我准备一个项目经历的自我介绍"
  - "这个岗位面试会考什么？"
  - "我的经历和 JD 有哪些 gap？"

#### 5.3 实现 Dashboard 页面

- [ ] 文件：`pages/1_🏠_Dashboard.py`
- [ ] 数据卡片（用 `st.metric`）：
  - 岗位总数
  - 强烈推荐岗位数（match_score >= 85）
  - 已投递岗位数
  - 面试中岗位数
  - 最近 7 天剪藏数
- [ ] Top 推荐岗位列表（按 match_score 排序，展示前 5 条）
- [ ] 最近生成记录（最近 5 条 generated_outputs）

#### 5.4 生成内容历史记录

- [ ] `get_generated_outputs(job_id=None)` 已在 P0 实现，这里在 Resume Generator 和 Interview Prep 页面完善展示
- [ ] 展示格式：时间 / 类型 / 关联岗位 / 内容摘要（前 100 字）
- [ ] 支持查看历史完整内容

#### 5.5 简单 CSV 导出

- [ ] 在 Job Recommendation 页面加"导出岗位库 CSV"按钮
- [ ] 用 `st.download_button` 提供下载
- [ ] 导出字段：company / title / location / role_type / match_score / status / apply_url

### Day 5 验收
- [ ] AI 助手：选一个岗位，问"这个岗位适合我吗"，回答有具体分析（不是废话）
- [ ] Dashboard：数字正确，Top 5 推荐岗位显示
- [ ] 历史记录能查到之前生成的 bullet

---

## P1 阶段注意事项

### LLM 调用
- **每次 LLM 调用前要有 Loading 提示**：`with st.spinner("AI 分析中..."):`
- **结果展示前加声明**：「以下内容由 AI 生成，请在投递前人工核查」
- **JD 文本过长时截断**：超过 3000 字符只取前 3000，避免 token 超限
- **推荐理由 Prompt 要有具体指引**：告诉模型要说明哪些经历匹配、哪些 gap 存在，不允许生成泛泛而谈的理由

### AI 助手上下文管理
- `st.session_state.messages` 是会话级别的，刷新会清空——这是预期行为，不需要持久化
- 上下文长度随对话增加，超过限制时截断旧消息（保留最近 10 轮）
- 切换岗位时主动清空消息记录，避免上下文混乱

### Dashboard 数据
- Dashboard 数据从数据库实时查询，不要在 session_state 缓存（保证最新）
- 如果岗位表为空，Dashboard 显示引导提示，不显示 0 或报错

### 常见坑
- `st.chat_input` 和 `st.form` 不能嵌套使用
- 多轮对话时，messages 列表要包含完整的 `role` 和 `content` 字段才能正确传给 OpenAI API
- `st.metric` 的 `delta` 参数不要滥用，没有对比数据时不传

---

## P1 完成标志

- [ ] 岗位列表有推荐理由（具体，非通用）
- [ ] JD 解析后 `role_type` 和 `skills` 字段自动填充
- [ ] AI 助手能进行 3 轮以上有意义的对话
- [ ] Dashboard 显示正确的统计数字
- [ ] 全程无 API 报错导致的崩溃
