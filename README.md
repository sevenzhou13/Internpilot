# InternPilot

**AI 驱动的个人实习求职助手** — 岗位管理、智能匹配、简历生成、面试准备一体化。

---

## 功能概览

| 模块 | 说明 |
|------|------|
| **岗位管理** | 手动添加、智能识别（粘贴 JD 原文自动解析）、看板视图跟踪投递进度 |
| **智能匹配** | 根据个人经历和教育背景，为每个岗位计算匹配分并生成推荐理由 |
| **简历生成** | 选择目标岗位和相关经历，AI 生成针对该岗位的简历 Bullet Points |
| **面试准备** | AI 生成可能的面试问题、项目追问和知识点准备清单 |
| **AI 助手** | 流式对话，结合岗位 JD 和个人经历上下文问答 |
| **浏览器插件** | 在招聘页面一键保存岗位到 InternPilot，无需手动复制粘贴 |

---

## 技术栈

- **后端**：Python + FastAPI
- **前端**：React（CDN，无需构建）
- **数据库**：SQLite
- **AI**：DeepSeek API（兼容 OpenAI 格式，可替换其他模型）
- **浏览器插件**：Chrome Extension Manifest V3

---

## 本地运行

### 1. 克隆项目

```bash
git clone https://gitee.com/你的用户名/internpilot.git
cd internpilot
```

### 2. 配置 API Key

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 DeepSeek API Key：

```
OPENAI_API_KEY=sk-你的key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-flash
```

获取 API Key：[platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

### 3. 启动

```bash
bash start.sh
```

浏览器访问 **http://localhost:8000**

> 也可以手动启动：
> ```bash
> python3 -m venv venv && source venv/bin/activate
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

**使用方式**：在任意招聘页面点击插件图标，自动识别岗位信息，确认后一键保存。

> 插件需要本地服务正在运行（`http://localhost:8000`）

---

## 使用流程

```
1. 个人背景库  →  录入教育背景和项目经历
2. 求职偏好    →  设置目标岗位方向、城市
3. 岗位推荐    →  导入岗位（智能识别 / 插件）
4. 计算匹配度  →  AI 分析匹配度和推荐理由
5. 简历生成    →  选择岗位和经历，生成 Bullet Points
6. 面试准备    →  生成面试题和准备清单
7. 看板视图    →  跟踪各岗位投递进度
```

---

## 目录结构

```
internpilot/
├── server.py              # FastAPI 主服务
├── start.sh               # 一键启动脚本
├── requirements.txt
├── .env.example           # 环境变量模板
├── modules/
│   ├── db.py              # 数据库操作
│   ├── matcher.py         # 匹配算法
│   ├── llm_client.py      # LLM 调用封装
│   ├── resume_generator.py
│   ├── interview_generator.py
│   └── jd_parser.py
├── static/                # React 前端页面
│   ├── index.html
│   ├── Jobs.jsx
│   ├── ResumeGenerator.jsx
│   └── ...
├── prompts/               # Prompt 模板
├── clipper/               # Chrome 插件
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
└── data/                  # 运行时生成，不上传
    └── internpilot.db
```

---

## 注意事项

- 本项目为**个人工具**，不支持多用户，数据存储在本地 SQLite
- API Key 存放在 `.env` 文件，**不要上传到代码仓库**
- AI 生成的简历内容仅供参考，投递前请人工核查，不要提交包含虚假信息的简历
- 项目数据库文件（`data/internpilot.db`）已加入 `.gitignore`，个人数据不会上传

---

## License

MIT
