# InternPilot

> 本地优先的 AI 求职管理与岗位分析工具：收集岗位、结构化 JD、管理投递、匹配真实经历，并生成求职材料。

InternPilot 面向个人求职者，尤其适合同时管理多份实习、校招或转行岗位的人。它不是招聘平台爬虫，也不会代替用户投递；核心是把岗位、个人经历、投递进度和 AI 辅助连接成一个可追溯的求职工作流。

本仓库同时服务《数据挖掘》课程项目：岗位类别具备人工复核、可复现训练、预测记录和评估流程；RAG 使用本地资料检索约束 AI 回答。

## 目录

- [功能与边界](#功能与边界)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [配置 AI 模型](#配置-ai-模型)
- [使用流程](#使用流程)
- [岗位分类训练](#岗位分类训练)
- [本地 RAG 检索](#本地-rag-检索)
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
| 岗位分类 | 人工复核类别，训练 `TF-IDF + Logistic Regression`，保存预测、置信度和模型版本。 |
| 本地 RAG | 将岗位、经历和简历切片到 SQLite，使用 TF-IDF 检索，并将带来源的片段注入 AI 助手上下文。 |

### 明确不做

- 不批量爬取 BOSS、拉勾等商业招聘网站，不绕过反爬、验证码或访问限制。
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
   ├─投递事件  ├─分类模型
   └─知识片段  └─本地 RAG 检索
```

- 后端：Python + FastAPI，提供 JSON 与 SSE 流式 API。
- 前端：React CDN，无需 Node 构建步骤。
- 存储：SQLite；数据库通过迁移自动升级并在旧库升级前备份。
- 模型：scikit-learn 分类基线；本地 RAG 当前使用 TF-IDF，后续可升级中文向量检索。

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

匹配分数不是黑箱：接口会给出技能、经历、硬性要求和地点四项证据。岗位详情页可以查看结构化信息、投递事件和分类记录；状态变化会写入历史。

### 5. 生成材料与准备面试

配置 AI 后，可按岗位生成简历 bullet、面试准备和问答草稿。所有生成内容都必须由你核验，不得把模型猜测当作真实经历或业绩。

## 岗位分类训练

分类任务根据岗位标题、技能和 JD 预测岗位大类。类别包括：算法/机器学习、数据分析/BI、用户研究、产品/AI产品、后端开发、前端/客户端、市场/运营、销售/咨询/项目管理。

### 批量人工标注

```powershell
# 导出待复核岗位
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py export --output data\processed\job_category_review.csv

# 在 CSV 中填写 category 与 reviewer_note 后导入
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py import --input data\processed\job_category_review.csv
```

也可以在岗位详情页逐条选择“人工复核类别”。人工标签优先于规则建议和模型预测。

### 训练与评估

```powershell
# 课程报告默认：仅使用人工复核标签
.\.venv\Scripts\python.exe scripts\train_job_category.py --manual-only

# 探索性实验：混入规则弱标签，报告中必须明确说明
.\.venv\Scripts\python.exe scripts\train_job_category.py --include-weak-labels
```

模型保存在 `artifacts/models/`。少于 8 条标签或任一类别少于 2 条时，只能验证训练流程，不会输出可信的独立评估指标。建议每类至少 20 条、总量约 300 条人工标签后再报告 Macro-F1。

完整规范见 [训练指南](docs/training/JOB_CATEGORY_TRAINING.md) 与 [模型卡](docs/training/JOB_CATEGORY_MODEL_CARD.md)。

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
│   ├── rag_retriever.py      # 本地知识切片与 TF-IDF 检索
│   └── llm_client.py         # OpenAI 兼容调用封装
├── scripts/                  # 标签导入导出、训练命令
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
- 本项目只支持用户主动导入或剪藏岗位资料，不绕过平台访问机制。

## 开发路线图

- [x] 工程基线、数据库迁移、自动化测试与交接文档
- [x] 多方式岗位导入、JD 结构化、标准技能、去重与投递事件
- [x] 人工标签、岗位分类基线、训练脚本与模型卡
- [x] 可解释规则匹配与本地 RAG 检索 MVP
- [ ] 中文向量检索、混合语义匹配与检索来源前端展示
- [ ] 技能缺口、聚类、投递漏斗和分析仪表盘
- [ ] 匿名 Demo、部署、安全验收和课程/作品集材料

## 文档与协作

- [文档索引](docs/README.md)：每份文档的权威范围。
- [项目记忆](docs/context/PROJECT_MEMORY.md)：有界上下文与协作更新规范。
- [当前交接](docs/context/HANDOFF.md)：当前基线、已验证结果和下一步。
- [需求基线](docs/REQUIREMENTS.md)、[架构](docs/ARCHITECTURE.md)、[API](docs/API.md)、[数据字典](docs/DATA_DICTIONARY.md)、[决策记录](docs/DECISIONS.md)、[项目进度](docs/PROJECT_PROGRESS.md)。

## License

MIT
