# AGENTS.md

## 项目名称：InternPilot

InternPilot 是一个面向个人求职场景的实习岗位推荐、简历适配与面试准备系统。系统帮助用户收集实习岗位、管理个人经历素材库、将岗位 JD 与个人经历进行匹配、生成定制化简历 bullet points、准备面试问题，并支持 AI 求职问答。

本文档是本代码仓库中所有代码代理（例如 Codex）必须遵守的开发规则。

---

## 1. 项目核心定位

InternPilot 应优先被开发成一个**真实可用的个人效率工具**，其次才是一个可以展示在简历和 GitHub 上的软件项目。

核心产品流程为：

```text
收集岗位信息
→ 解析 JD
→ 将岗位与个人偏好、个人经历进行匹配
→ 推荐适合投递的岗位
→ 生成针对岗位的简历 bullet points
→ 生成面试准备材料
→ 支持 AI 求职问答
```

目标岗位方向包括：

- 数据分析实习
- AI 产品 / 产品经理实习
- 用户研究实习

本项目第一使用者是项目 owner 本人。除非用户明确要求，否则不要将项目过度设计成多人 SaaS 平台。

---

## 2. 开发优先级

### P0：必须完成

1. Streamlit Web App 基础框架
2. SQLite 数据库初始化
3. 求职偏好设置
4. 个人经历素材库
5. 岗位库与岗位导入
6. 岗位匹配评分
7. 岗位推荐页面
8. 简历 bullet 生成
9. 面试准备生成

### P1：应当完成

1. 使用 LLM 解析 JD
2. 生成岗位推荐理由
3. AI 求职助手
4. Dashboard 求职控制台
5. 生成内容历史记录
6. 简单 CSV 导入 / 导出

### P2：后续增强

1. Chrome Extension：InternPilot Clipper
2. FastAPI 后端，用于插件直接保存岗位
3. 基于 RAG 的面经知识库
4. Word / PDF 简历导出
5. 多版本简历管理
6. 更高级的语义匹配算法
7. 公司官网定向岗位采集
8. 部署优化与 demo 数据完善

在 P0 功能稳定前，不要主动实现 P2 功能，除非用户明确要求。

---

## 3. 技术栈约定

除非用户明确变更，否则使用以下技术栈：

```text
前端 / Web UI：Streamlit
开发语言：Python
数据库：SQLite
数据处理：pandas
大模型 API：OpenAI API 或兼容 OpenAI 格式的模型服务
Embedding：OpenAI Embeddings 或 sentence-transformers
向量数据库：ChromaDB 或 FAISS，后续版本可选
部署：Hugging Face Spaces 或 Streamlit Community Cloud
版本管理：GitHub
```

MVP 阶段应避免不必要的复杂化。除非用户明确要求，不要引入：

- React
- Next.js
- FastAPI
- PostgreSQL
- Docker
- Celery
- 复杂登录鉴权系统

---

## 4. 推荐项目目录结构

尽量遵循以下目录结构：

```text
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
│   ├── __init__.py
│   ├── db.py
│   ├── job_importer.py
│   ├── jd_parser.py
│   ├── matcher.py
│   ├── resume_generator.py
│   ├── interview_generator.py
│   ├── ai_assistant.py
│   ├── llm_client.py
│   └── utils.py
├── prompts/
│   ├── jd_parser_prompt.txt
│   ├── recommendation_prompt.txt
│   ├── resume_prompt.txt
│   ├── interview_prompt.txt
│   └── assistant_prompt.txt
├── data/
│   ├── internpilot.db
│   ├── sample_jobs.csv
│   ├── sample_experiences.csv
│   └── README.md
├── assets/
│   ├── screenshots/
│   └── architecture.png
├── tests/
│   ├── test_matcher.py
│   └── test_db.py
├── .streamlit/
│   └── secrets.toml
├── requirements.txt
├── README.md
├── AGENTS.md
└── .gitignore
```

如果当前仓库结构与上述结构不同，应谨慎适配，不要进行大规模无关重构。

---

## 5. 数据库规则

MVP 阶段使用 SQLite。

数据库文件路径：

```text
data/internpilot.db
```

核心数据表包括：

1. `profile`：用户求职偏好
2. `experience_blocks`：个人经历素材库
3. `jobs`：岗位信息表
4. `interview_notes`：面经知识库
5. `generated_outputs`：生成结果记录

所有数据库访问逻辑必须集中在：

```text
modules/db.py
```

不要把大量原始 SQL 散落在 Streamlit 页面文件中。页面文件应调用 `modules/db.py` 中封装好的函数。

根据需要，应实现以下数据库函数：

```python
init_db()
get_connection()
get_profile()
save_profile(data)
add_experience(data)
get_all_experiences()
delete_experience(experience_id)
add_job(data)
get_all_jobs()
update_job_status(job_id, status)
update_job_match_result(job_id, match_score, recommendation_reason=None)
delete_job(job_id)
add_generated_output(job_id, output_type, content)
get_generated_outputs(job_id=None)
```

所有 SQL 查询必须使用参数化查询。不要使用字符串拼接或 f-string 直接拼接用户输入。

---

## 6. Streamlit 页面规则

Streamlit 页面应保持简洁、清晰、实用。

通用 UI 规则：

- 每个页面必须有明确标题。
- 合理使用 `st.columns()`、`st.expander()`、`st.tabs()`、`st.form()`。
- 表单字段不要过长或过密。
- UI 语言以中文为主。
- 可以保留常用英文技术词，例如 JD、Dashboard、AI Assistant、Resume Bullet。
- 不要把过多无关功能堆在同一个页面。
- 用户执行新增、保存、删除、生成等操作后，应提供 success、warning 或 error 提示。

### `app.py`

职责：

- 设置 Streamlit 页面配置。
- 初始化数据库。
- 展示项目简介和使用说明。

### Dashboard / 求职控制台

职责：

- 展示岗位总数。
- 展示高匹配岗位数。
- 展示已投递岗位数。
- 展示面试中岗位数。
- 展示 Top 推荐岗位。
- 展示最近生成内容。

### Profile / 求职偏好

职责：

- 管理目标岗位方向。
- 管理目标城市。
- 管理偏好行业。
- 管理排除岗位。
- 管理实习周期、可开始时间和备注。

### Experience Library / 个人经历库

职责：

- 新增、查看、编辑和删除个人经历素材。
- 个人经历是岗位匹配和简历生成的基础。

### Job Recommendation / 岗位推荐

职责：

- 手动导入岗位。
- CSV 导入岗位。
- 展示岗位列表。
- 按岗位方向、城市、来源、状态筛选。
- 重新计算匹配度。
- 更新岗位投递状态。

### Resume Generator / 简历生成

职责：

- 选择一个岗位。
- 读取岗位 JD 和个人经历。
- 生成针对该岗位的简历 bullet points。
- 保存生成结果。

### Interview Prep / 面试准备

职责：

- 选择一个岗位。
- 生成可能的面试问题、项目追问、知识点缺口和准备建议。

### AI Assistant / AI 求职助手

职责：

- 支持围绕岗位、个人经历和面经的上下文问答。
- 不要设计成普通闲聊机器人，应始终优先使用当前岗位和用户经历作为上下文。

---

## 7. LLM 调用规则

所有大模型调用必须集中在：

```text
modules/llm_client.py
```

所有 Prompt 模板必须存放在：

```text
prompts/
```

不要在页面文件中硬编码长 Prompt。

API key 不能写死在代码中。必须从环境变量或 Streamlit secrets 中读取。

推荐读取顺序：

1. `st.secrets`
2. 环境变量，例如 `OPENAI_API_KEY`
3. 如果 key 缺失，应在 UI 中给出清晰提示，并跳过 LLM 调用

如果没有配置 API key，应用不能崩溃。

推荐 LLM 调用函数：

```python
call_llm(prompt: str, model: str = None, temperature: float = 0.3) -> str
```

LLM 生成结果应被视为草稿。UI 中应暗示用户在正式投递前需要自行检查生成内容。

---

## 8. Prompt 规则

Prompt 必须遵守以下原则：

1. 不编造用户经历。
2. 不编造岗位要求。
3. 只能使用给定 JD 和个人经历素材。
4. 信息不足时要明确说明。
5. 输出要具体、实用、针对岗位。
6. 区分数据分析、AI 产品、用户研究三类方向。
7. 默认使用中文简历表达，除非用户明确要求英文。

Prompt 文件包括：

```text
prompts/jd_parser_prompt.txt
prompts/recommendation_prompt.txt
prompts/resume_prompt.txt
prompts/interview_prompt.txt
prompts/assistant_prompt.txt
```

---

## 9. 匹配算法规则

MVP 阶段的匹配算法必须清晰、可解释。

默认匹配公式：

```text
match_score = role_score * 0.30
            + skill_score * 0.25
            + experience_score * 0.25
            + location_score * 0.10
            + value_score * 0.10
```

匹配算法应实现在：

```text
modules/matcher.py
```

必须或建议包含以下函数：

```python
split_text(text: str) -> list[str]
collect_user_keywords(experiences: list[dict]) -> list[str]
calculate_role_score(job_role: str, target_roles: list[str]) -> float
calculate_location_score(job_location: str, target_locations: list[str]) -> float
calculate_skill_score(job_skills: list[str], user_keywords: list[str]) -> float
calculate_experience_score(jd_text: str, experiences: list[dict]) -> float
calculate_match_score(job: dict, profile: dict, experiences: list[dict]) -> float
```

UI 中应尽量解释匹配结果。MVP 阶段不要使用完全黑箱的推荐逻辑。

---

## 10. 数据导入规则

MVP 支持以下数据导入方式：

1. 手动新增岗位
2. CSV 导入岗位
3. 可选：GitHub raw 文件导入

MVP 阶段不要实现对 BOSS、拉勾、猎聘、实习僧等商业招聘平台的大规模爬虫。

不要绕过登录页、验证码、反爬机制、付费墙或访问权限限制。

如果用户从网页保存岗位信息，应将项目定位为“个人岗位剪藏与求职管理工具”，而不是“公开招聘平台爬虫系统”。

---

## 11. Chrome 插件规则

浏览器插件属于后续功能，名称为：

```text
InternPilot Clipper
```

只有当主 Web App 基本稳定后，才开始实现插件。

插件第一版应是轻量级岗位剪藏工具。

允许的第一版插件行为：

- 读取当前页面标题。
- 读取当前页面 URL。
- 读取用户选中的文本。
- 如果用户没有选中文本，则读取有限长度的 `document.body.innerText`。
- 生成 JSON。
- 将 JSON 复制到剪贴板。
- 用户手动将 JSON 粘贴到 InternPilot 中导入。

不要实现自动批量抓取网页。

不要绕过平台限制。

不要采集与用户求职无关的私人信息。

建议插件 JSON 格式：

```json
{
  "page_title": "",
  "url": "",
  "selected_text": "",
  "page_text": "",
  "source_domain": "",
  "created_at": ""
}
```

---

## 12. 安全与隐私规则

禁止提交以下内容到 GitHub：

- API keys
- `.env` 文件
- `.streamlit/secrets.toml`
- 包含真实个人数据的本地数据库文件
- 私人简历
- 个人联系方式
- 平台 cookie 或 token

`.gitignore` 应至少包含：

```text
.env
.streamlit/secrets.toml
data/internpilot.db
__pycache__/
*.pyc
.DS_Store
```

如果需要 demo 数据，必须使用匿名化或虚构数据。

不要将用户真实简历、私人面经、私人笔记上传到公开 demo 文件中。

---

## 13. 合规规则

InternPilot 不能被开发成大规模招聘信息爬虫系统。

允许：

- 用户手动导入 JD。
- 用户导入自己整理的 CSV。
- 用户剪藏自己正在浏览的岗位页面。
- 用户收集公开 GitHub 实习信息列表。
- 用户保存公开公司官网招聘页面中的岗位信息用于个人求职管理。

除非用户明确要求并经过额外合规评估，否则不要实现：

- 商业招聘平台的大规模爬取。
- 绕过反爬系统。
- 使用登录 cookie 自动提取信息。
- 收集其他求职者简历或个人数据。
- 公开发布从第三方平台复制的大型岗位数据库。

---

## 14. 代码风格规则

使用清晰、可维护的 Python 代码。

通用规则：

- 优先写小函数，不写超长脚本。
- 页面文件主要负责 UI 逻辑。
- 数据库逻辑放在 `modules/db.py`。
- 匹配逻辑放在 `modules/matcher.py`。
- LLM 调用放在 `modules/llm_client.py`。
- 生成逻辑放在对应 generator 模块中。
- 尽量使用 type hints。
- 对空值和缺失数据做兼容处理。
- 不要因为缺少数据而让应用崩溃。
- 只在必要时添加注释，注释应解释非显而易见的逻辑。

不要过度工程化。MVP 代码应简单、直接、容易调试。

---

## 15. 测试规则

至少应测试以下内容：

1. 数据库初始化
2. 新增和读取个人经历
3. 新增和读取岗位
4. 匹配分数计算
5. API key 缺失时的行为
6. CSV 导入行为

测试文件建议放在：

```text
tests/
```

推荐测试文件：

```text
tests/test_db.py
tests/test_matcher.py
```

如果暂时没有正式测试，至少应手动运行：

```bash
streamlit run app.py
```

并在浏览器中逐页检查功能是否正常。

---

## 16. 错误处理规则

应用应优雅失败，不应直接崩溃。

示例：

- 如果数据库不存在，应自动初始化。
- 如果没有求职偏好，应提示用户先创建。
- 如果没有个人经历，应提示匹配和简历生成需要经历素材。
- 如果没有岗位，应提示用户导入岗位。
- 如果 API key 缺失，应提示用户配置，而不是直接报错。
- 如果 LLM 输出解析失败，应显示原始输出和警告，而不是崩溃。

---

## 17. UI 语言规则

UI 主要使用中文。

推荐页面命名：

```text
Dashboard / 求职控制台
Profile / 求职偏好
Experience Library / 个人经历库
Jobs / 岗位推荐
Resume Generator / 简历生成
Interview Prep / 面试准备
AI Assistant / AI 求职助手
```

简历 bullet 默认生成中文，除非用户明确要求英文。

---

## 18. 简历生成内容规则

生成的简历 bullet points 必须基于用户真实提供的经历素材。

不得编造：

- 公司名称
- 实习岗位
- 指标提升
- 数据规模
- 使用工具
- 奖项
- 论文发表情况
- 研究结果
- 用户研究样本量
- 产品上线结果

如果用户没有提供明确结果，应使用更保守的表达。

合适表达示例：

```text
使用 Python 和 pandas 对社交媒体图文数据进行清洗与特征整理，围绕互动指标构建分析数据集，为后续统计建模提供基础。
```

不合适表达示例：

```text
将用户互动率提升 35%，推动平台推荐策略上线。
```

除非用户明确提供了该结果，否则不要生成类似内容。

---

## 19. 岗位推荐解释规则

每个推荐岗位最好包含简短解释。

解释应包括：

1. JD 中哪些要求匹配用户技能。
2. 用户哪些经历与岗位相关。
3. 仍然存在什么能力缺口。
4. 是否建议优先投递。

避免笼统解释，例如：

```text
这个岗位与你的背景比较匹配。
```

优先生成具体解释，例如：

```text
该岗位强调用户行为分析、Python 和内容平台理解，与你的小红书数据采集与互动建模项目高度相关；但 JD 中也提到 SQL，因此建议补充准备 SQL 查询和指标体系问题。
```

---

## 20. README 要求

仓库 README 应包括：

1. 项目简介
2. 核心功能
3. 技术栈
4. 系统架构
5. 项目目录结构
6. 数据库结构概览
7. 本地运行方式
8. 环境变量配置方式
9. 项目截图
10. Demo 数据说明
11. Roadmap
12. 安全与合规说明

不要夸大项目的生产可用性。该项目是个人 MVP 与作品集项目。

---

## 21. 部署规则

MVP 部署目标：

- Streamlit Community Cloud，或
- Hugging Face Spaces

MVP 阶段不要依赖付费云服务。

部署 demo 不能包含真实私人数据。

在线 demo 应使用虚构或匿名化的示例岗位和示例经历。

---

## 22. 代码代理任务执行规则

每次执行开发任务时，代码代理应遵循以下流程：

1. 先阅读 `README.md`、`AGENTS.md` 和 `docs/` 中相关文档。
2. 判断本次任务需要修改的最小文件集合。
3. 只实现用户本次要求的功能。
4. 避免无关重构。
5. 运行或说明相关测试。
6. 如果涉及 Streamlit，应确认 `streamlit run app.py` 可以启动。
7. 总结修改文件和行为变化。

每次任务完成后，回答格式应为：

```text
Summary:
- ...

Changed files:
- ...

How to run:
- ...

How to test:
- ...

Notes / limitations:
- ...
```

---

## 23. 推荐开发顺序

除非用户改变优先级，否则按以下顺序开发：

```text
1. 创建项目骨架
2. 初始化 SQLite 数据库
3. 实现个人经历库
4. 实现求职偏好页面
5. 实现岗位库与手动 / CSV 导入
6. 实现匹配算法
7. 实现岗位推荐 UI
8. 添加 LLM client 与 Prompt 模板
9. 实现简历 bullet 生成
10. 实现面试准备生成
11. 实现 AI Assistant
12. 添加 Dashboard 指标
13. 添加 sample data
14. 编写 README
15. 添加项目截图
16. 部署 demo
17. 开发 InternPilot Clipper 浏览器插件
```

---

## 24. MVP 非目标

MVP 阶段不要实现以下功能，除非用户明确要求：

- 用户注册和登录
- 多用户权限系统
- 付费系统
- 管理员后台
- 企业端功能
- 自动投递岗位
- 完整招聘平台爬虫
- Word / PDF 简历导出
- 移动端 App
- 带后端同步的浏览器插件
- 复杂机器学习排序模型

---

## 25. 项目对外表述

描述本项目时，应使用以下定位：

> InternPilot 是一个 AI 驱动的个人实习求职助手，它将实习岗位、个人经历素材库和面试准备材料连接起来，支持岗位匹配、定制化简历生成和岗位相关面试准备。

避免将项目描述为：

> 一个用于爬取招聘平台的爬虫系统。

本项目的核心价值是**个性化匹配、求职材料生成和面试准备**，而不是大规模抓取数据。

---

## 26. 最终原则

当存在取舍时，优先遵循：

```text
可用性 > 功能完整性
个人实际价值 > 平台化野心
可解释性 > 黑箱自动化
MVP 稳定性 > 功能数量
合规安全 > 激进数据采集
```

