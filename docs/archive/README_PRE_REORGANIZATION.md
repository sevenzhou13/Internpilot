# InternPilot

**AI 驱动的个人实习求职助手** — 岗位管理、智能匹配、简历生成、面试准备一体化。

---

## 功能概览

| 模块 | 说明 |
|------|------|
| **求职控制台** | 岗位总览、高匹配岗位、投递进度统计 |
| **岗位管理** | 智能识别（粘贴 JD 自动解析）、手动导入、岗位编辑、看板视图跟踪投递进度、详情页前后翻页 |
| **智能匹配** | 基于个人经历双向关键词匹配，计算分数并由 AI 生成推荐理由，添加经历后自动重算 |
| **个人背景** | 教育背景多段录入、经历分类管理（自定义分类）、一键导入简历、AI 提取关键词、求职类型设置 |
| **简历生成** | 流式输出（切页不中断）、经历按匹配度排序、生成背景描述 + Bullet Points、历史版本记录 |
| **面试准备** | AI 生成面试题 + 知识点，内嵌 AI 问答助手（按岗位隔离对话），笔记编辑器（Markdown），历史版本 |
| **AI 助手** | 流式对话、结合岗位 JD 和个人经历上下文、切页后台继续输出 |
| **浏览器插件** | 在招聘页面一键剪藏，后台 service worker 持续识别，切换窗口不中断 |

---

## 技术栈

- **后端**：Python + FastAPI，流式 SSE 输出
- **前端**：React（CDN，无需构建步骤）
- **数据库**：SQLite
- **AI**：DeepSeek API（兼容 OpenAI 格式，可替换其他模型）
- **浏览器插件**：Chrome Extension Manifest V3（含 background service worker）

---

## 本地运行

### 1. 克隆项目

```bash
git clone https://gitee.com/seven-circles/internpilot.git
cd internpilot
```

### 2. 配置 API Key

获取 DeepSeek API Key：[platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

**macOS / Linux：**
```bash
cp .env.example .env
# 用文本编辑器打开 .env，填入你的 Key
```

**Windows：**
```bat
copy .env.example .env
rem 用记事本打开 .env，填入你的 Key
```

`.env` 内容：

```
OPENAI_API_KEY=sk-你的key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-flash
```

### 3. 启动

**macOS / Linux：**
```bash
bash start.sh
```

**Windows：**
```bat
start.bat
```

浏览器访问 **http://localhost:8000**

> 手动启动：
> ```bash
> # macOS/Linux
> python3 -m venv venv && source venv/bin/activate
> pip install -r requirements.txt
> uvicorn server:app --reload
>
> # Windows
> python -m venv venv && venv\Scripts\activate
> pip install -r requirements.txt
> uvicorn server:app --reload
> ```

---

## 浏览器插件安装

1. 打开 Chrome，访问 `chrome://extensions/`
2. 右上角开启「**开发者模式**」
3. 点击「**加载已解压的扩展程序**」
4. 选择项目中的 `clipper/` 文件夹
5. 工具栏出现插件图标即安装成功

**使用方式：**
- 在招聘页面点击插件图标，自动读取页面内容并在后台识别
- 识别过程中可以切换到其他窗口，**不会中断**
- 重新点击图标可查看识别进度或已完成的结果
- 确认信息后一键保存到 InternPilot

> 插件需要本地服务正在运行（`http://localhost:8000`）

---

## 使用流程

```
1. 求职偏好    →  设置目标方向、城市、求职类型（应届/日常实习）
2. 个人背景    →  录入教育背景和项目/实习/科研经历（支持导入简历一键解析）
3. 岗位管理    →  导入岗位（智能识别粘贴 / 浏览器插件）
4. 计算匹配    →  AI 分析匹配度并生成推荐理由
5. 简历生成    →  选择岗位和经历，生成针对性 Bullet Points
6. 面试准备    →  生成面试题清单，记录笔记，随时向 AI 提问
7. 跟踪进度    →  看板视图管理各岗位投递状态
```

---

## 目录结构

```
internpilot/
├── server.py              # FastAPI 主服务
├── start.sh               # 启动脚本（macOS/Linux）
├── start.bat              # 启动脚本（Windows）
├── requirements.txt
├── .env.example
├── modules/
│   ├── db.py              # 数据库操作
│   ├── matcher.py         # 双向关键词匹配算法
│   ├── llm_client.py      # LLM 调用封装（流式/同步）
│   ├── resume_generator.py
│   ├── interview_generator.py
│   └── jd_parser.py
├── static/                # React 前端（无构建步骤）
│   ├── index.html
│   ├── Sidebar.jsx        # 全局状态 AppContext
│   ├── Jobs.jsx           # 岗位管理 + 看板
│   ├── JobDetail.jsx      # 岗位详情（可编辑）
│   ├── ExperienceLibrary.jsx  # 个人背景库
│   ├── ResumeGenerator.jsx    # 简历生成（流式）
│   ├── InterviewPrep.jsx      # 面试准备 + AI 问答 + 笔记
│   ├── AIAssistant.jsx        # AI 助手（流式）
│   └── Profile.jsx            # 求职偏好
├── prompts/               # LLM Prompt 模板
├── clipper/               # Chrome 插件
│   ├── manifest.json
│   ├── background.js      # Service worker（后台持续运行）
│   ├── popup.html
│   └── popup.js
└── data/                  # 运行时生成，不上传
    └── internpilot.db
```

---

## 注意事项

- 本项目为**个人工具**，数据存储在本地 SQLite，不支持多用户
- API Key 存放在 `.env` 文件，**不要上传到代码仓库**（已加入 `.gitignore`）
- AI 生成的简历内容仅供参考，投递前请人工核查，不要提交包含虚假信息的简历
- 数据库文件（`data/internpilot.db`）已加入 `.gitignore`，个人数据不会上传

---

## License

MIT
