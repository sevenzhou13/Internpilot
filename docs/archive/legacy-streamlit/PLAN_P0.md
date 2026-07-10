# Phase 1 · P0 核心功能

> 预计用时：Day 1–3
> 目标：能导入岗位、算出匹配分、生成简历 bullet 和面试准备
> 状态：⬜ 未开始

---

## Day 1 · 项目骨架 + 数据库 + 经历库 + 偏好

### 任务清单

#### 1.1 初始化项目
- [ ] 创建虚拟环境 `python -m venv venv`
- [ ] 安装依赖，写 `requirements.txt`
- [ ] 创建 `.gitignore`（包含 `.env`、`data/internpilot.db`、`.streamlit/secrets.toml`）
- [ ] 初始化 git 仓库，第一次 commit

**requirements.txt 第一版（最小依赖）：**
```
streamlit
pandas
openai
python-dotenv
```
> 暂时不装 sentence-transformers / chromadb，等 P1 阶段再说

#### 1.2 实现 `modules/db.py`
- [ ] `init_db()`：建 5 张表（profile / experience_blocks / jobs / interview_notes / generated_outputs）
- [ ] `get_connection()`
- [ ] `get_profile()` / `save_profile(data)`
- [ ] `add_experience(data)` / `get_all_experiences()` / `delete_experience(id)`
- [ ] `add_job(data)` / `get_all_jobs()` / `update_job_status()` / `delete_job()`
- [ ] `add_generated_output()` / `get_generated_outputs()`

> ⚠️ jobs 表从一开始就要包含 `raw_clip_text`、`source_domain`、`clipped_at` 字段，避免后面加字段时迁移麻烦

#### 1.3 实现 `app.py`
- [ ] `st.set_page_config(layout="wide")`
- [ ] 调用 `init_db()` 初始化数据库
- [ ] 展示项目简介和使用引导

#### 1.4 实现 Experience Library 页面
- [ ] 文件：`pages/3_📚_Experience_Library.py`
- [ ] 用 `st.form` 实现新增经历表单（title / type / background / methods / tools / results / keywords / target_roles / raw_bullet）
- [ ] 展示已有经历列表（用 `st.expander` 折叠详情）
- [ ] 实现删除按钮（带确认）
- [ ] 新增/删除后 `st.rerun()` 刷新

#### 1.5 实现 Profile 页面
- [ ] 文件：`pages/2_🎯_Profile.py`
- [ ] 读取已有偏好，预填表单
- [ ] 字段：target_roles（multiselect）/ target_locations / preferred_industries / excluded_roles / internship_duration / available_start_date / notes
- [ ] 保存到 `profile` 表（只保留一条，upsert 逻辑）

### Day 1 验收
```bash
streamlit run app.py
```
- [ ] 无报错启动
- [ ] 能录入至少 3 条经历
- [ ] 能保存求职偏好
- [ ] 数据在刷新后仍然存在

---

## Day 2 · 岗位导入 + 匹配算法 + 推荐页

### 2.1 实现 `modules/matcher.py`
- [ ] `split_text(text)` → 按逗号分割关键词列表
- [ ] `collect_user_keywords(experiences)` → 从经历的 keywords + tools 里汇总用户技能词
- [ ] `calculate_role_score(job_role, target_roles)` → 方向匹配 0-100
- [ ] `calculate_location_score(job_location, target_locations)` → 城市匹配 0-100
- [ ] `calculate_skill_score(job_skills, user_keywords)` → 技能关键词重叠率
- [ ] `calculate_experience_score(jd_text, experiences)` → 经历关键词在 JD 中的命中率
- [ ] `calculate_match_score(job, profile, experiences)` → 综合加权分

**加权公式（按文档）：**
```
match_score = role_score * 0.30
            + skill_score * 0.25
            + experience_score * 0.25
            + location_score * 0.10
            + value_score * 0.10   # MVP 固定 70
```

#### 2.2 实现 `modules/db.py` 补充函数
- [ ] `update_job_match_result(job_id, match_score, recommendation_reason=None)`

#### 2.3 实现 Job Recommendation 页面（基础版）
- [ ] 文件：`pages/4_💼_Job_Recommendation.py`
- [ ] **Tab 1：手动新增岗位**（company / title / location / role_type / jd_text / apply_url / skills）
- [ ] **Tab 2：CSV 导入**（上传 CSV，预览，批量保存）
- [ ] **Tab 3：粘贴 Clipper JSON**（文本框粘贴，解析预览，保存）
- [ ] 岗位列表展示（公司 / 岗位 / 地点 / 方向 / 匹配分 / 状态）
- [ ] 筛选：岗位方向 / 城市 / 状态
- [ ] 按匹配分排序
- [ ] 更新投递状态下拉框
- [ ] "重新计算匹配度"按钮

#### 2.4 实现 `modules/clip_parser.py`
- [ ] `parse_clip_json(raw_json)` → 解析插件 JSON 字符串
- [ ] `clip_to_job_data(clip_data)` → 转换为 jobs 表格式

### Day 2 验收
- [ ] 能手动添加 2 个岗位
- [ ] 能对岗位算出匹配分（不同方向分数有区别）
- [ ] 能粘贴一段 Clipper JSON 并保存为岗位

---

## Day 3 · 简历生成 + 面试准备 + LLM 接入基础

#### 3.1 实现 `modules/llm_client.py`
- [ ] 从 `st.secrets` 或环境变量读取 API Key
- [ ] `call_llm(prompt, model="gpt-4o-mini", temperature=0.3) -> str`
- [ ] API Key 缺失时返回提示字符串，不抛异常、不崩溃
- [ ] 捕获网络异常和 API 错误，返回错误信息字符串

> ⚠️ `model` 可配置：OpenAI 格式兼容其他服务（如 DeepSeek、Moonshot）只需改 `base_url`

#### 3.2 实现 `modules/resume_generator.py`
- [ ] 读取 `prompts/resume_prompt.txt`
- [ ] `generate_resume_bullets(job, experiences) -> str`
- [ ] 填充 Prompt 变量（JD 文本、经历列表）
- [ ] 调用 `call_llm()`

#### 3.3 实现 Resume Generator 页面
- [ ] 文件：`pages/5_📝_Resume_Generator.py`
- [ ] 选择目标岗位（下拉）
- [ ] 展示岗位 JD 和已有经历
- [ ] 点击"生成简历 bullet"按钮
- [ ] 展示生成结果（可复制文本框）
- [ ] 保存到 `generated_outputs` 表
- [ ] 展示该岗位历史生成记录

#### 3.4 实现 `modules/interview_generator.py`
- [ ] 读取 `prompts/interview_prompt.txt`
- [ ] `generate_interview_prep(job, experiences) -> str`

#### 3.5 实现 Interview Prep 页面
- [ ] 文件：`pages/6_🎤_Interview_Prep.py`
- [ ] 选择目标岗位
- [ ] 生成面试问题 + 项目追问 + 知识点缺口 + 准备建议
- [ ] 保存结果

#### 3.6 写 Prompt 文件
- [ ] `prompts/resume_prompt.txt`
- [ ] `prompts/interview_prompt.txt`

### Day 3 验收
- [ ] 对一个真实岗位，能生成 3-5 条简历 bullet
- [ ] bullet 内容基于用户真实经历，没有编造数据
- [ ] 能生成该岗位的面试准备清单
- [ ] 没有 API Key 时，显示提示而非崩溃

---

## P0 阶段注意事项

### 数据库
- `profile` 表只保一条记录，save 时先 `DELETE` 再 `INSERT`，或用 `INSERT OR REPLACE`
- `jobs` 表从第一天就加完整字段（含 Clipper 相关），避免后续 `ALTER TABLE`
- 所有时间字段存 ISO 格式字符串：`datetime.now().isoformat(timespec="seconds")`

### Streamlit
- 每次增删改后调 `st.rerun()` 保持页面数据新鲜
- 表单用 `st.form()` 包裹，避免每个控件都触发重绘
- 删除操作加 `st.warning` + 二次确认，防止误删
- 大段 JD 文本用 `st.expander` 折叠，保持页面整洁

### LLM Prompt
- Prompt 里必须明确说"只根据给定信息生成，不要编造"
- JD 文本截断到合理长度（前 3000 字符），避免超 token
- 经历列表格式化为清单传入 Prompt，不要传原始 dict

### 常见坑
- Streamlit 多页面之间共享数据要用 `st.session_state`，不要用全局变量
- SQLite 在 Streamlit 中每次 rerun 都重新建连接，记得 `conn.close()`
- CSV 导入时注意编码（UTF-8 with BOM），用 `pd.read_csv(encoding='utf-8-sig')`

---

## P0 完成标志

- [ ] 7 个页面能全部加载（即使部分功能为空）
- [ ] 完整流程：录入经历 → 设置偏好 → 导入岗位 → 算匹配分 → 生成 bullet → 生成面试准备
- [ ] 任何页面刷新后数据不丢失
- [ ] 没有未捕获的异常会让 app 白屏崩溃
