# InternPilot

> 本地优先的 AI 求职管理与岗位分析工具：收集岗位、结构化 JD、管理投递、匹配真实经历，并生成求职材料。

InternPilot 面向个人求职者，尤其适合同时管理多份实习、校招或转行岗位的人。它不是招聘平台爬虫，也不会代替用户投递；核心是把岗位、个人经历、投递进度和 AI 辅助连接成一个可追溯的求职工作流。

本仓库同时服务《数据挖掘》课程项目：以 JD 清洗、技能分析、文本聚类、可解释匹配和本地检索为主线；RAG 使用本地资料检索约束 AI 回答。

## 目录

- [功能与边界](#功能与边界)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [配置 AI 模型](#配置-ai-模型)
- [使用流程](#使用流程)
- [AI 岗位类别](#ai-岗位类别)
- [本地 RAG 检索](#本地-rag-检索)
- [匿名 Demo 与部署](#匿名-demo-与部署)
- [课程交付](#课程交付)
- [浏览器插件](#浏览器插件)
- [测试与质量](#测试与质量)
- [项目结构](#项目结构)
- [数据安全与合规](#数据安全与合规)
- [开发路线图](#开发路线图)

## 功能与边界

### 已实现

| 模块 | 能力 |
|---|---|
| 岗位导入 | 手动填写、粘贴 JD、TXT/PDF/DOCX、公开 URL 预览、Chrome Clipper；保存前结构化和去重。 |
| JD 结构化 | 提取城市、薪资、学历、经验、标准技能、岗位类别、来源平台和原始链接。 |
| 求职资料 | 本地管理个人偏好、教育经历、项目/实习素材、简历和生成记录。 |
| 匹配 | 输出总分及技能、经历、硬性要求、地点四项可解释证据，并标记已匹配/待补技能。 |
| AI 辅助 | 可选生成推荐理由、简历 bullet、面试准备和流式问答；没有 API Key 时基础功能仍可用。 |
| 岗位类别 | AI 根据岗位名称和 JD 给出开放类别及 taxonomy 建议；当前八类仅作初始示例，可新增、合并或拆分。 |
| 本地 RAG | 将岗位、经历和简历切片到 SQLite，使用 TF-IDF 检索，并将带来源的片段注入 AI 助手上下文。 |
| 分析控制台 | 汇总岗位类别、来源、投递漏斗、高频技能与个人技能短板。 |
| 岗位聚类 | 使用 TF-IDF + K-Means 识别岗位池中的需求簇，并展示关键词与 silhouette 指标。 |

### 明确不做

- 在用户授权下可低频采集公开可访问的岗位 JD，用于课程训练数据；不绕过反爬、验证码、登录或访问限制。
- 不收集 Cookie、登录态、其他求职者资料，也不自动投递。
- 不做多用户账号、支付或企业招聘后台；这是单用户、本地优先工具。

动态渲染的招聘页面通常无法由服务端 URL 导入直接读取，请使用 Clipper 或复制 JD 文本。

## 系统架构

```text
Chrome Clipper / 文本 / 文件 / URL
                │
                ▼
       FastAPI + React CDN
                │
   ┌────────────┼─────────────┐
   ▼            ▼             ▼
SQLite     规则匹配      OpenAI 兼容 LLM
   │            │             │
   ├─岗位/经历  ├─分项解释     └─简历、面试、问答
   ├─投递事件  ├─开放 taxonomy / 兼容实验
   └─知识片段  └─本地 RAG 检索
```

- 后端：Python + FastAPI，提供 JSON 与 SSE 流式 API。
- 前端：React CDN，无需 Node 构建步骤。
- 存储：SQLite；数据库通过迁移自动升级并在旧库升级前备份。
- 模型：岗位需求分析使用固定随机种子的 `TF-IDF + K-Means`；旧分类器仅作兼容实验；本地 RAG 使用 TF-IDF。

更多细节见 [架构文档](docs/ARCHITECTURE.md) 和 [API 文档](docs/API.md)。

## 快速开始

### 环境要求

- Python 3.11+（当前已在 Python 3.12 验证）
- Windows PowerShell、macOS 或 Linux
- 可选：Chrome，用于 Clipper 插件

### Windows（推荐）

```powershell
cd D:\AI_Projects\InternPilot
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn server:app --reload
```

打开 <http://127.0.0.1:8000>。`--reload` 会在修改 Python 文件后自动重启服务。

也可执行 `start.bat`；它会创建 `.venv`、安装运行依赖并启动服务。

### macOS / Linux

```bash
cd InternPilot
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt -r requirements-dev.txt
.venv/bin/python -m uvicorn server:app --reload
```

也可执行：

```bash
bash start.sh
```

### 首次启动时会发生什么

应用会自动创建 `data/internpilot.db`，并执行尚未应用的数据库迁移。已有数据库首次跨版本升级前会在 `data/backups/` 创建备份。数据库、备份、模型产物和本地个人资料均已被 Git 忽略。

## 配置 AI 模型

岗位管理、规则匹配、分类和本地检索不需要 API Key。只有 AI 生成、AI 问答和 LLM JD 解析需要配置。

复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

编辑 `.env`：

```env
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-flash

APP_MODE=local
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

`OPENAI_BASE_URL` 与 `OPENAI_MODEL` 可替换为任意 OpenAI 兼容服务。请勿提交 `.env` 或把 Key 贴到 Issue、聊天记录或仓库中。修改 `.env` 后重启服务。

## 使用流程

### 1. 设置求职偏好

在“求职偏好”填写目标岗位方向、城市、行业和求职类型。这些信息用于地点匹配和推荐排序。

### 2. 建立个人经历库

在“个人背景”录入项目、实习、科研等真实经历，尽量填写工具、关键词、方法和结果。匹配、RAG、简历与面试生成都会引用这些资料。

### 3. 导入岗位

可选方式：

1. 手动新增或粘贴 JD；
2. 上传 TXT、可提取文字的 PDF 或 DOCX；
3. 粘贴服务端可直接读取的公开 URL；
4. 在 Chrome 使用 Clipper 剪藏动态渲染招聘页。

导入会先显示预览，自动识别结构化字段；确认后才保存。存在 URL 时按规范化 URL 去重，否则按公司、岗位、城市等字段去重。

### 4. 查看匹配和投递状态

匹配分数不是黑箱：在岗位卡片点击“匹配详情”，或进入岗位详情后点击“计算此岗位匹配”，即可得到技能、经历、硬性要求和地点四项证据。岗位详情同时列出每份已上传简历与当前岗位的匹配分；未上传简历时可直接进入“管理简历”。岗位详情还可查看结构化信息、投递事件和分类记录；状态变化会写入历史。

### 5. 生成材料与准备面试

配置 AI 后，可按岗位生成简历 bullet、面试准备和问答草稿。所有生成内容都必须由你核验，不得把模型猜测当作真实经历或业绩。

### 6. 查看岗位分析

控制台会根据本地岗位和经历展示类别、投递状态、高频技能和技能短板。技能短板只是“岗位高频要求中尚未在经历关键词中找到”的提示，不能等同于能力缺失。

## AI 岗位类别

AI 解析 JD 时会同时给出岗位类别、分类依据和可选的 taxonomy 优化建议。当前八类仅用于无 AI 时的规则兜底和输入提示，并不限制新类别；类别可以按产品发展新增、合并或拆分。

你可在岗位详情页确认 AI 分类，也可直接输入自定义类别。人工确认不会被后续 AI 或旧模型覆盖；分析控制台会按实际保存的类别聚合。

### 兼容的旧分类实验

`TF-IDF + Logistic Regression` 训练管线仍作为历史兼容和独立实验保留，但不再是产品主流程或课程主线。若运行该实验，类别体系必须固定并记录版本；不得将弱标签指标误写为人工标签效果。

```powershell
# 导出待复核岗位
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py export --output data\processed\job_category_review.csv

# 在 CSV 中填写 category 与 reviewer_note 后导入
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py import --input data\processed\job_category_review.csv
```

也可以在岗位详情页逐条确认或输入类别。人工标签优先于 AI 与规则结果。

### 训练与评估

```powershell
# 旧分类实验：仅使用人工复核标签
.\.venv\Scripts\python.exe scripts\train_job_category.py --manual-only

# 旧分类实验：使用人工标签和已映射的原生外部类别标签
.\.venv\Scripts\python.exe scripts\train_job_category.py

# 探索性实验：混入规则弱标签，报告中必须明确说明
.\.venv\Scripts\python.exe scripts\train_job_category.py --include-weak-labels
```

模型保存在 `artifacts/models/`。少于 8 条标签或任一类别少于 2 条时，只能验证训练流程，不会输出可信的独立评估指标。人工标签可报告“人工复核标签评估”；已映射的原生外部类别只能报告“外部数据集标签评估”。

完整规范见 [训练指南](docs/training/JOB_CATEGORY_TRAINING.md) 与 [模型卡](docs/training/JOB_CATEGORY_MODEL_CARD.md)。

经授权采集的公开 JD 请按 [公开 JD 课程数据采集规范](docs/training/PUBLIC_JD_COLLECTION.md) 保存为本地 JSONL 后导入：

```powershell
.\.venv\Scripts\python.exe scripts\import_public_jds.py --input data\raw\boss_public_jds_20260711.jsonl
```

也可从许可明确的 Hugging Face 中文岗位描述集抽取 300 条候选 JD（Apache-2.0；该集提供学历标签而非岗位类别，不能直接作为本项目类别真值）：

```powershell
.\.venv\Scripts\python.exe scripts\download_hf_public_jds.py --count 300
.\.venv\Scripts\python.exe scripts\import_public_jds.py --input data\raw\hf_job_education_300.jsonl
```

如需运行旧分类实验，才需要带原始类别的外部数据及固定类别映射。产品和课程主线不依赖该训练集；分析数据可使用匿名样例或用户授权的公开 JD，并保留来源和采集条件。

## 本地 RAG 检索

首次导入岗位、经历或简历后，建立本地索引：

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/knowledge/rebuild
```

索引会将岗位、个人经历与简历切片存入 SQLite。AI 助手收到问题后检索相关片段，并在上下文中附上来源标识。当前检索使用 TF-IDF 基线，不发送这些资料到第三方；只有你主动使用 AI 功能时，选中的上下文才会随模型请求发出。

可直接检查检索结果：

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/knowledge/search?query=Python%20数据分析&top_k=5"
```

## 浏览器插件

1. 在 Chrome 打开 `chrome://extensions/`；
2. 开启“开发者模式”；
3. 点击“加载已解压的扩展程序”；
4. 选择项目中的 `clipper/` 文件夹；
5. 保持 InternPilot 服务运行，在岗位页面点击插件图标，确认预览后保存。

Clipper 适合处理腾讯招聘等依赖 JavaScript 渲染、服务端 URL 导入无法取得正文的页面。它不采集登录 Cookie，也不批量抓取网页。

## 匿名 Demo 与部署

设置 `APP_MODE=demo` 后，应用会使用独立数据库并自动生成匿名种子数据；外部 LLM 被强制禁用，适合公开展示。完整启动步骤见 [Demo 说明](docs/DEMO.md)。

仓库提供 [Render 配置](render.yaml) 和 [部署/安全验收清单](docs/DEPLOYMENT.md)。部署账号授权属于项目所有者操作；公开部署只能使用 Demo 模式，不能连接个人本地数据库或配置真实 API Key。

## 课程交付

运行下列命令可导出不含原始 JD 的聚合实验报告：

```powershell
.\.venv\Scripts\python.exe scripts\run_mining_experiment.py --max-clusters 5
```

结果写入 Git 忽略的 `data/processed/mining_experiment/`。课程课题表述、实验方法、限制和三分钟答辩流程见 [课程交付材料](docs/COURSE_DELIVERY.md)。

## 测试与质量

运行全部自动化测试：

```powershell
.\.venv\Scripts\python.exe -m compileall -q modules server.py scripts
.\.venv\Scripts\python.exe -m pytest
```

如需覆盖率：

```powershell
.\.venv\Scripts\python.exe -m pytest --cov=modules --cov=server --cov-report=term-missing
```

测试使用 `APP_MODE=test`，会强制禁用 LLM，避免读取或调用你 `.env` 中的真实 Key。已验证的测试范围与结果见 [测试报告](docs/TEST_REPORT.md)。

## 项目结构

```text
InternPilot/
├── server.py                 # FastAPI 服务、API 与 SSE 入口
├── static/                   # React CDN 前端页面
├── modules/
│   ├── db.py                 # SQLite 与数据库迁移
│   ├── job_importer.py       # 文件、文本、URL 预览导入
│   ├── job_structurer.py     # JD 规则结构化与去重
│   ├── matcher.py            # 可解释规则匹配
│   ├── job_classifier.py     # 岗位分类训练与预测
│   ├── demo_seed.py          # 匿名 Demo 种子数据
│   ├── experiment_report.py  # 聚合实验报告
│   ├── rag_retriever.py      # 本地知识切片与 TF-IDF 检索
│   └── llm_client.py         # OpenAI 兼容调用封装
├── scripts/                  # 导入、兼容训练、实验导出与安全检查
├── prompts/                  # LLM Prompt 模板
├── clipper/                  # Chrome Manifest V3 插件
├── tests/                    # pytest 自动化测试
├── docs/                     # 需求、架构、决策、进度、训练与交接
├── data/                     # 本地数据库与个人数据（忽略）
└── artifacts/models/         # 本地模型产物（忽略）
```

## 数据安全与合规

- `.env`、SQLite 数据库、模型产物、真实简历、联系方式、Cookie 和 Token 不得提交。
- 公开 Demo 只能使用虚构或匿名数据；真实岗位和经历仅保存在本地。
- URL 导入阻止本机、内网和保留地址，并限制跳转、超时和页面大小。
- 本项目支持用户主动导入、剪藏，以及用户授权下的低频公开 JD 采集；不绕过平台访问机制。

## 开发路线图

- [x] 工程基线、数据库迁移、自动化测试与交接文档
- [x] 多方式岗位导入、JD 结构化、标准技能、去重与投递事件
- [x] AI 开放岗位类别、历史分类实验兼容脚本与模型卡
- [x] 可解释规则匹配与本地 RAG 检索 MVP
- [x] 岗位类别、投递漏斗、技能频次与技能短板分析
- [x] 岗位文本聚类与需求簇可视化基础
- [x] 岗位需求簇的候选簇数评估、技能分析与课程答辩材料
- [x] 匿名 Demo、部署配置、安全验收与课程/作品集材料
- [ ] 中文向量检索与混合语义匹配增强（后续增强，不属于六周验收）

## 文档与协作

- [文档索引](docs/README.md)：每份文档的权威范围。
- [项目记忆](docs/context/PROJECT_MEMORY.md)：有界上下文与协作更新规范。
- [当前交接](docs/context/HANDOFF.md)：当前基线、已验证结果和下一步。
- [需求基线](docs/REQUIREMENTS.md)、[架构](docs/ARCHITECTURE.md)、[API](docs/API.md)、[数据字典](docs/DATA_DICTIONARY.md)、[决策记录](docs/DECISIONS.md)、[项目进度](docs/PROJECT_PROGRESS.md)、[Demo](docs/DEMO.md)、[部署](docs/DEPLOYMENT.md)、[课程交付](docs/COURSE_DELIVERY.md)。

## License

MIT
