# InternPilot 文档更新版：加入浏览器插件 InternPilot Clipper

本文档包含两部分：

1. `docs/PRD.md` 更新版
2. `docs/TECH_SPEC.md` 更新版

本次更新的核心变化是：在原有 Web App 主系统之外，加入浏览器插件 **InternPilot Clipper**。插件不是主系统，而是岗位信息采集入口。主系统仍然负责岗位库、匹配、简历生成、面试准备和 AI 对话。

---

# 第一部分：docs/PRD.md 更新版

# InternPilot 产品需求文档 PRD

## 1. 产品概述

### 1.1 产品名称

**InternPilot：个人化实习推荐与简历适配系统**

英文名称：**InternPilot: Personalized Internship Recommendation and Resume Tailoring System**

配套浏览器插件名称：**InternPilot Clipper**

---

### 1.2 产品定位

InternPilot 是一个面向个人求职场景的实习岗位推荐、简历适配与面试准备系统。系统通过整合公开实习岗位信息、用户个人经历素材库与面试经验知识库，帮助用户完成从“发现岗位”到“判断岗位是否适合自己”，再到“生成针对性简历经历与面试准备内容”的求职流程。

系统由两部分组成：

1. **InternPilot Web App**：主系统，负责岗位库管理、个人经历库、岗位匹配、简历生成、面试准备和 AI 求职问答。
2. **InternPilot Clipper**：浏览器插件，负责在用户浏览 BOSS、公司官网、牛客、学校就业网、GitHub 实习仓库等页面时，一键剪藏岗位信息并导入 InternPilot。

第一版产品主要服务于个人使用，不做多人平台，不做自动投递，不做复杂招聘平台爬虫，重点解决研究生求职过程中的信息筛选、岗位匹配、简历调整和面试准备问题。

---

### 1.3 产品设计原则

InternPilot 的核心不是“大规模爬取岗位”，而是“帮助用户管理自己看到的岗位，并结合个人经历判断是否值得投递”。

因此，本项目遵循以下原则：

1. **Web App 是求职大脑**：负责分析、匹配、生成和管理。
2. **浏览器插件是采集入口**：负责从用户当前浏览页面中快速保存岗位。
3. **用户主动采集，不做批量爬取**：插件只在用户点击按钮后保存当前页面内容，不自动扫描网页、不绕过登录、不处理验证码。
4. **先保存页面文本，再用 AI 解析 JD**：插件不需要为每个招聘网站写复杂规则，第一版优先保存网页标题、URL、选中文本、页面正文片段，再由主系统解析。
5. **截图是备份，不是主要数据源**：第一版可暂不做截图 OCR；后续可将截图作为页面备份功能。

---

### 1.4 目标用户

当前版本的核心用户为：

- 研一或研二学生；
- 正在准备寻找实习；
- 希望同时投递多个方向的岗位；
- 拥有多段科研、数据分析、项目或实践经历，但不知道如何针对不同岗位调整简历；
- 希望用 AI 工具辅助岗位筛选、简历表达和面试准备；
- 经常在多个网站上浏览实习信息，希望能快速保存感兴趣岗位。

当前项目的第一使用者是用户本人，目标实习方向包括：

1. 数据分析实习；
2. AI 产品 / 产品经理实习；
3. 用户研究实习。

---

### 1.5 核心价值

InternPilot 的核心价值不是“收集尽可能多的岗位”，而是帮助用户完成以下判断：

1. 哪些岗位更适合我？
2. 为什么这个岗位适合我？
3. 我的哪些经历可以用于这个岗位？
4. 简历中应该如何针对该岗位表达这些经历？
5. 面试中可能会被问到什么？
6. 我还需要补充哪些知识点？
7. 我在外部网站看到的岗位，如何一键加入自己的求职库？

产品核心逻辑为：

> 岗位信息剪藏 + 岗位信息结构化 + 个人经历结构化 + 语义匹配 + 大模型生成解释与求职材料。

---

## 2. 产品目标

### 2.1 短期目标：MVP 版本

MVP 版本目标是在较短时间内实现一个可用的个人求职助手，支持：

- 导入或手动录入实习岗位信息；
- 通过浏览器插件剪藏当前网页岗位信息；
- 维护个人经历素材库；
- 设置求职偏好；
- 对岗位进行匹配度评分；
- 推荐高适配岗位；
- 根据岗位 JD 和个人经历生成简历 bullet points；
- 生成面试问题和准备清单；
- 支持围绕岗位、简历和面试进行 AI 问答；
- 可通过 Streamlit / Hugging Face Spaces 在线访问；
- 可作为 GitHub 项目展示。

---

### 2.2 中期目标：展示版

展示版在 MVP 基础上增强项目完整度，支持：

- 页面视觉优化；
- 示例数据；
- 项目 README；
- 系统架构图；
- 数据库结构说明；
- Prompt 设计说明；
- 浏览器插件使用说明；
- 插件截图；
- Web App 页面截图；
- 可复现部署说明。

---

### 2.3 长期目标：增强版

增强版可进一步支持：

- 多个岗位来源的自动更新；
- 面经向量知识库；
- 投递进度分析；
- 多版本简历管理；
- 根据投递结果优化推荐策略；
- 导出 Word / PDF 简历；
- 模拟面试功能；
- 更完整的岗位推荐算法；
- 插件与 FastAPI 后端直连，实现一键保存到岗位库；
- 插件截图备份；
- 插件端简要匹配提示。

---

## 3. 产品整体架构

InternPilot 由两个主要部分组成。

```text
外部招聘页面 / 公司官网 / 牛客 / GitHub / 学校就业网
        ↓
InternPilot Clipper 浏览器插件
        ↓
InternPilot Web App 岗位库
        ↓
JD 解析 + 岗位匹配 + 简历生成 + 面试准备 + AI 对话
```

### 3.1 InternPilot Web App

负责：

- Dashboard 求职控制台；
- 求职偏好设置；
- 个人经历素材库；
- 岗位库；
- JD 解析；
- 匹配评分；
- 简历 bullet 生成；
- 面试准备；
- 面经知识库；
- AI 求职助手。

### 3.2 InternPilot Clipper

负责：

- 读取当前网页标题；
- 读取当前网页 URL；
- 读取用户选中的文本；
- 在没有选中文本时读取当前页面正文片段；
- 生成岗位剪藏 JSON；
- 将 JSON 复制到剪贴板；
- 后续版本可直接发送到 FastAPI 后端。

---

## 4. 使用场景

### 4.1 场景一：用户想快速找到适合自己的实习岗位

用户进入系统后，设置目标方向为“数据分析、AI 产品、用户研究”，设置目标城市和公司偏好。系统从已有岗位库中筛选并排序，展示推荐岗位列表。

系统输出：

- 岗位名称；
- 公司；
- 地点；
- 岗位方向；
- 匹配度评分；
- 推荐原因；
- 投递链接；
- 当前状态。

---

### 4.2 场景二：用户在 BOSS 或公司官网看到一个岗位，想加入求职库

用户正在浏览 BOSS、公司官网、牛客、学校就业网或 GitHub 实习仓库页面。看到一个感兴趣的岗位后，点击浏览器插件 **InternPilot Clipper**。

插件自动读取：

- 当前页面标题；
- 当前页面 URL；
- 用户选中的 JD 文本；
- 如果没有选中文本，则读取当前页面正文片段；
- 当前来源域名；
- 剪藏时间。

插件生成 JSON，并复制到剪贴板。用户回到 InternPilot Web App 的岗位导入页面，粘贴 JSON，即可导入岗位。

后续增强版中，插件可直接将数据发送到后端，实现真正的一键保存。

---

### 4.3 场景三：用户看到一个岗位后，想判断是否值得投递

用户点击某个岗位，进入岗位详情页。系统自动分析 JD，并结合用户经历生成岗位适配分析。

系统输出：

- JD 摘要；
- 岗位核心要求；
- 关键词提取；
- 与用户匹配的经历；
- 用户缺少的能力；
- 是否建议投递；
- 推荐理由。

---

### 4.4 场景四：用户想为某个岗位调整简历

用户点击“生成简历经历”按钮。系统根据岗位 JD 和用户经历素材库，推荐适合放入简历的经历，并生成针对该岗位的 bullet points。

系统输出：

- 建议优先展示的 2-3 段经历；
- 每段经历的岗位相关性解释；
- 针对该岗位优化后的简历 bullet points；
- 可以补充强化的技能关键词。

---

### 4.5 场景五：用户想准备面试

用户点击“生成面试准备”按钮。系统结合岗位 JD、岗位类型、公司信息和面经知识库，生成面试准备内容。

系统输出：

- 可能被问到的问题；
- 项目经历追问；
- 技术 / 方法知识点；
- 产品 case 或业务分析题；
- 用户研究方法题；
- 建议补充准备的知识点。

---

### 4.6 场景六：用户想和 AI 聊天，询问岗位相关问题

用户在 AI 求职助手页面选择某个岗位作为上下文，然后向系统提问。

示例问题：

- 这个岗位适合我吗？
- 如果面试官问我为什么想做 AI 产品，我怎么回答？
- 这个数据分析岗位会考 SQL 吗？
- 我的 EEG 项目怎么讲成用户研究经历？
- 这个岗位和我的小红书数据项目有什么关系？
- 请帮我模拟一轮产品经理面试。

---

## 5. 功能需求

## 5.1 用户画像与求职偏好模块

### 5.1.1 功能说明

用户可以设置个人求职偏好，系统根据这些偏好筛选岗位并计算匹配度。

### 5.1.2 字段设计

| 字段 | 类型 | 说明 |
|---|---|---|
| target_roles | 多选 | 目标岗位方向，例如数据分析、AI 产品、用户研究 |
| target_locations | 多选 | 目标城市，例如成都、上海、北京、深圳、远程 |
| preferred_industries | 多选 | 偏好行业，例如互联网、AI、社交媒体、咨询、研究机构 |
| excluded_roles | 多选 | 不考虑岗位，例如销售、客服、强开发岗 |
| internship_duration | 文本 | 可接受实习周期，例如 3 个月以上 |
| available_start_date | 日期 | 可开始实习时间 |
| notes | 文本 | 其他补充偏好 |

### 5.1.3 MVP 优先级

高。

---

## 5.2 个人经历素材库模块

### 5.2.1 功能说明

用户可以将自己的项目、科研、实践和技能经历拆分为结构化素材块。系统后续根据岗位 JD 自动匹配相关经历。

### 5.2.2 经历类型

可包括：

- 科研项目；
- 数据分析项目；
- 产品 / AI 应用项目；
- 用户研究经历；
- 编程项目；
- 论文写作经历；
- 竞赛经历；
- 实习经历；
- 技能模块。

### 5.2.3 字段设计

| 字段 | 类型 | 说明 |
|---|---|---|
| id | 整数 | 经历 ID |
| title | 文本 | 经历名称 |
| type | 文本 | 经历类型 |
| background | 长文本 | 项目背景 |
| methods | 长文本 | 方法与过程 |
| tools | 文本 | 使用工具 |
| results | 长文本 | 结果与产出 |
| keywords | 文本 | 关键词 |
| target_roles | 文本 | 适配岗位方向 |
| raw_bullet | 长文本 | 原始简历表述 |
| optimized_bullet | 长文本 | 优化后的通用表述 |
| created_at | 时间 | 创建时间 |
| updated_at | 时间 | 更新时间 |

### 5.2.4 MVP 优先级

高。

---

## 5.3 岗位采集与岗位库模块

### 5.3.1 功能说明

系统从多个来源导入岗位信息，并转化为统一格式。

### 5.3.2 数据来源优先级

MVP 推荐优先级如下：

1. 用户通过 InternPilot Clipper 剪藏当前网页岗位；
2. 手动导入 JD；
3. CSV 导入岗位；
4. GitHub 公开实习信息仓库；
5. 目标公司官网招聘页；
6. 招聘平台链接解析作为后续功能；
7. 大规模招聘平台自动爬取不纳入 MVP。

### 5.3.3 岗位字段设计

| 字段 | 类型 | 说明 |
|---|---|---|
| id | 整数 | 岗位 ID |
| company | 文本 | 公司名称 |
| title | 文本 | 岗位名称 |
| location | 文本 | 地点 |
| role_type | 文本 | 岗位类型，例如数据分析、AI 产品、用户研究 |
| source | 文本 | 来源，例如 clipped、manual、csv、github、company_site |
| jd_text | 长文本 | 完整 JD 或剪藏文本 |
| apply_url | 文本 | 投递链接 |
| publish_date | 日期 | 发布时间 |
| deadline | 日期 | 截止时间 |
| skills | 文本 | 技能关键词 |
| status | 文本 | 未查看、感兴趣、已投递、面试中、拒绝、offer |
| match_score | 数值 | 匹配度评分 |
| recommendation_reason | 长文本 | 推荐理由 |
| raw_clip_text | 长文本 | 插件剪藏的原始页面文本 |
| source_domain | 文本 | 来源域名 |
| clipped_at | 时间 | 剪藏时间 |
| created_at | 时间 | 创建时间 |
| updated_at | 时间 | 更新时间 |

### 5.3.4 岗位状态

岗位状态包括：

- 未查看；
- 感兴趣；
- 已投递；
- 笔试；
- 面试中；
- 拒绝；
- offer；
- 不合适。

### 5.3.5 MVP 优先级

高。

---

## 5.4 InternPilot Clipper 浏览器插件模块

### 5.4.1 功能说明

InternPilot Clipper 是浏览器插件，用于在用户浏览招聘页面时快速剪藏岗位信息。它是岗位数据入口，不承担复杂匹配、生成和管理功能。

### 5.4.2 第一版插件功能

第一版插件为“复制型剪藏插件”，不直接连接后端。

功能包括：

1. 点击插件图标后读取当前页面标题；
2. 读取当前页面 URL；
3. 读取用户选中的文本；
4. 如果用户没有选中文本，则读取 `document.body.innerText` 的前 8000 字符；
5. 识别来源域名；
6. 生成 JSON；
7. 将 JSON 复制到剪贴板；
8. 提示用户“已复制，可粘贴到 InternPilot 岗位导入页面”。

### 5.4.3 插件 JSON 格式

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

### 5.4.4 插件页面设计

插件 popup 尺寸建议：

```text
宽度：360px
高度：520px
```

插件界面应显示：

- InternPilot Clipper 标题；
- 当前页面标题；
- 当前页面 URL；
- 检测到的文本长度；
- 来源域名；
- 主要按钮：复制为岗位 JSON；
- 次要按钮：打开 InternPilot；
- 状态提示：已复制 / 未检测到文本 / 复制失败。

### 5.4.5 后续插件增强

后续版本可支持：

1. 直接发送到 FastAPI 后端；
2. 自动写入岗位库；
3. 保存后触发 JD 解析；
4. 保存后触发匹配评分；
5. 插件端显示简要匹配结果；
6. 保存页面截图作为备份。

### 5.4.6 插件非目标

插件不做：

- 自动批量抓取；
- 绕过登录；
- 绕过验证码；
- 平台数据批量导出；
- 他人隐私数据采集；
- 自动投递。

### 5.4.7 MVP 优先级

中高。

建议在 Web App 核心功能跑通后实现插件第一版。

---

## 5.5 JD 解析模块

### 5.5.1 功能说明

系统对岗位 JD 或插件剪藏文本进行结构化解析，提取岗位方向、公司名称、岗位名称、地点、核心职责、任职要求、技能关键词和岗位摘要。

### 5.5.2 输入

来源可能包括：

- 手动输入 JD；
- CSV 导入 JD；
- GitHub 岗位信息；
- 插件剪藏 JSON 中的 selected_text 或 page_text。

### 5.5.3 输出

| 输出项 | 说明 |
|---|---|
| company | 公司名称 |
| title | 岗位名称 |
| location | 工作地点 |
| role_type | 岗位类别 |
| jd_summary | JD 摘要 |
| responsibilities | 核心职责 |
| requirements | 任职要求 |
| skills | 技能关键词 |
| risk_points | 潜在不匹配或需要注意的地方 |

### 5.5.4 实现方式

MVP 可使用大模型 API 完成结构化抽取。后续可加入规则提取与关键词词典。

### 5.5.5 MVP 优先级

高。

---

## 5.6 岗位匹配与推荐模块

### 5.6.1 功能说明

系统根据求职偏好、个人经历素材库和岗位 JD，为岗位计算匹配度，并输出推荐理由。

### 5.6.2 匹配评分维度

| 维度 | 建议权重 | 说明 |
|---|---:|---|
| 岗位方向匹配 | 30% | 是否属于数据分析、AI 产品、用户研究 |
| 技能匹配 | 25% | JD 技能要求与用户技能是否匹配 |
| 经历匹配 | 25% | 用户项目经历是否能支撑岗位要求 |
| 地点匹配 | 10% | 是否符合目标城市 |
| 投递价值 | 10% | 公司质量、岗位成长性、是否适合研一 |

### 5.6.3 推荐等级

| 分数 | 推荐等级 | 含义 |
|---:|---|---|
| 85-100 | 强烈推荐 | 高度适配，应优先投递 |
| 70-84 | 推荐 | 适合投递 |
| 55-69 | 谨慎推荐 | 可投递，但需要补充准备 |
| 0-54 | 暂不优先 | 当前不建议优先投递 |

### 5.6.4 MVP 实现方式

MVP 可采用：

1. 规则打分；
2. 关键词匹配；
3. Embedding 相似度；
4. LLM 生成推荐解释。

### 5.6.5 MVP 优先级

高。

---

## 5.7 简历经历生成模块

### 5.7.1 功能说明

用户选择某个岗位后，系统根据该岗位 JD 和用户经历素材库，推荐最适合放入简历的经历，并生成针对该岗位的简历 bullet points。

### 5.7.2 输出

- 推荐展示的经历；
- 每段经历与岗位的匹配理由；
- 针对岗位优化后的简历 bullet points；
- 建议补充的技能关键词；
- 不建议强调的内容。

### 5.7.3 MVP 优先级

高。

---

## 5.8 面试准备模块

### 5.8.1 功能说明

用户选择岗位后，系统根据 JD、岗位类型、用户经历和面经知识库，生成面试准备内容。

### 5.8.2 输出内容

- 可能面试问题；
- 简历项目追问；
- 技术知识点；
- 业务分析题；
- 产品 case；
- 用户研究方法题；
- 需要补充准备的内容；
- 建议回答思路。

### 5.8.3 MVP 优先级

中高。

---

## 5.9 AI 求职助手模块

### 5.9.1 功能说明

用户可以与 AI 进行岗位、简历和面试相关对话。AI 回答时应优先使用当前岗位 JD、用户经历素材库和面经知识库作为上下文。

### 5.9.2 支持问题类型

- 岗位适配判断；
- 简历经历修改；
- 面试问题预测；
- 面试回答优化；
- 项目经历讲述；
- 模拟面试；
- 知识点补充；
- 岗位方向选择建议。

### 5.9.3 MVP 优先级

中高。

---

## 5.10 投递进度看板模块

### 5.10.1 功能说明

用户可以跟踪每个岗位的投递状态。

### 5.10.2 状态分类

- 未查看；
- 感兴趣；
- 已投递；
- 笔试；
- 一面；
- 二面；
- HR 面；
- 拒绝；
- offer；
- 放弃。

### 5.10.3 MVP 优先级

中。

---

## 6. 页面设计

## 6.1 Web App 页面

### 6.1.1 Dashboard 首页

展示：

- 岗位总数；
- 高匹配岗位数；
- 已投递岗位数；
- 面试中岗位数；
- 最近剪藏岗位数；
- 推荐岗位 Top 10；
- 最近生成内容。

---

### 6.1.2 求职偏好设置页

展示：

- 目标岗位方向；
- 目标城市；
- 偏好行业；
- 不考虑岗位；
- 实习周期；
- 可开始时间；
- 其他备注。

---

### 6.1.3 个人经历素材库页

展示：

- 经历列表；
- 新增经历；
- 编辑经历；
- 删除经历；
- 关键词标签；
- 适配岗位方向。

---

### 6.1.4 岗位推荐页

功能：

- 手动新增岗位；
- CSV 导入岗位；
- 粘贴插件 JSON 导入岗位；
- 按岗位方向、城市、来源、状态筛选；
- 按匹配度排序；
- 查看推荐理由；
- 更新岗位状态。

---

### 6.1.5 岗位详情页

展示：

- 岗位基本信息；
- JD 原文；
- 原始剪藏文本；
- 来源 URL；
- JD 摘要；
- 技能关键词；
- 匹配度拆解；
- 匹配经历；
- 缺少能力；
- 推荐投递判断；
- 生成简历经历按钮；
- 生成面试准备按钮。

---

### 6.1.6 简历生成页

展示：

- 当前岗位信息；
- 推荐经历；
- 经历匹配理由；
- 生成后的 bullet points；
- 可复制内容；
- 保存生成结果。

---

### 6.1.7 面试准备页

展示：

- 可能面试问题；
- 项目追问；
- 技术知识点；
- 产品 / 用户研究 case；
- 准备优先级；
- 建议回答思路；
- 保存生成结果。

---

### 6.1.8 AI 求职助手页

展示：

- 选择当前岗位；
- 选择是否使用个人经历库；
- 选择是否使用面经知识库；
- 聊天输入框；
- 对话记录；
- 常用问题快捷按钮。

---

## 6.2 InternPilot Clipper 插件页面

插件 popup 页面包含：

1. 产品标题：InternPilot Clipper；
2. 当前页面标题；
3. 当前页面 URL；
4. 来源域名；
5. 检测到的文本长度；
6. 文本预览区域；
7. 主按钮：复制为岗位 JSON；
8. 次按钮：打开 InternPilot；
9. 状态提示。

---

## 7. 数据库设计

## 7.1 profile 表

```sql
CREATE TABLE profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_roles TEXT,
    target_locations TEXT,
    preferred_industries TEXT,
    excluded_roles TEXT,
    internship_duration TEXT,
    available_start_date TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

---

## 7.2 experience_blocks 表

```sql
CREATE TABLE experience_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT,
    background TEXT,
    methods TEXT,
    tools TEXT,
    results TEXT,
    keywords TEXT,
    target_roles TEXT,
    raw_bullet TEXT,
    optimized_bullet TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

---

## 7.3 jobs 表

```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    title TEXT NOT NULL,
    location TEXT,
    role_type TEXT,
    source TEXT,
    jd_text TEXT,
    raw_clip_text TEXT,
    source_domain TEXT,
    apply_url TEXT,
    publish_date TEXT,
    deadline TEXT,
    skills TEXT,
    status TEXT DEFAULT '未查看',
    match_score REAL,
    recommendation_reason TEXT,
    clipped_at TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

---

## 7.4 interview_notes 表

```sql
CREATE TABLE interview_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    role_type TEXT,
    source TEXT,
    content TEXT,
    summary TEXT,
    questions TEXT,
    skills_tested TEXT,
    created_at TEXT
);
```

---

## 7.5 generated_outputs 表

```sql
CREATE TABLE generated_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    output_type TEXT,
    content TEXT,
    created_at TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

---

## 8. MVP 范围总结

### 8.1 MVP 必做功能

1. 求职偏好设置；
2. 个人经历素材库；
3. 岗位导入与岗位库；
4. 粘贴插件 JSON 导入岗位；
5. JD 解析；
6. 匹配评分；
7. 岗位推荐列表；
8. 推荐理由生成；
9. 简历 bullet 生成；
10. 面试问题生成；
11. 基础 AI 聊天；
12. Streamlit 在线展示；
13. GitHub README；
14. InternPilot Clipper 第一版复制型插件。

---

### 8.2 MVP 暂不做功能

1. 用户注册登录；
2. 多人协作；
3. 自动投递；
4. 大规模招聘平台爬虫；
5. 完整 PDF / Word 简历导出；
6. 复杂推荐模型训练；
7. 多语言支持；
8. 企业端功能；
9. 插件直接后端同步；
10. 插件自动批量抓取。

---

## 9. 项目简历表述建议

### 9.1 完整版

**InternPilot：基于浏览器插件与大模型的个性化实习求职助手**  
基于 Streamlit、SQLite、Chrome Extension 与大模型 API，开发面向个人求职场景的实习推荐与简历适配系统。系统支持用户在浏览招聘官网、BOSS、牛客、GitHub 等页面时通过浏览器插件剪藏岗位信息，并在 Web App 中完成 JD 解析、岗位-个人经历匹配评分、个性化岗位推荐、简历 bullet 自动生成和面试准备问答。通过规则打分、关键词匹配与大模型生成能力，为数据分析、AI 产品、用户研究等岗位提供个性化投递建议和求职材料生成。

---

### 9.2 简洁版

开发 Chrome Extension + Streamlit Web App 形式的个性化求职助手，实现岗位页面剪藏、JD 解析、岗位匹配、简历 bullet 生成和面试准备问答。

---

## 10. 风险与应对

### 10.1 插件采集内容不准确

风险：页面正文包含大量无关信息。

应对：

- 优先使用用户选中文本；
- 如果没有选中文本，仅读取页面正文前 8000 字符；
- 在 Web App 中使用 LLM 进行结构化解析；
- 保留原始剪藏文本，方便用户检查。

---

### 10.2 合规风险

风险：插件被误用为批量爬虫。

应对：

- 插件只在用户点击时采集当前页面；
- 不自动翻页；
- 不批量抓取；
- 不绕过验证码和登录；
- 不采集他人隐私数据；
- 项目定位为个人岗位剪藏工具。

---

### 10.3 开发范围过大

风险：同时开发 Web App、插件和后端导致 MVP 延迟。

应对：

- 先完成 Web App 主系统；
- 再完成复制型插件；
- 最后再考虑 FastAPI 后端直连。

---

# 第二部分：docs/TECH_SPEC.md 更新版

# InternPilot 技术开发文档

## 1. 文档目标

本文档用于将 InternPilot 的产品需求转化为可执行的开发方案。本版本加入浏览器插件 **InternPilot Clipper**，用于在用户浏览招聘页面时快速剪藏岗位信息。

本文档重点包括：

1. 技术架构；
2. 项目目录结构；
3. 数据库设计与初始化；
4. 核心模块拆分；
5. Streamlit 页面设计；
6. Chrome Extension 插件设计；
7. 大模型 Prompt 模板；
8. 推荐匹配算法；
9. MVP 开发顺序；
10. GitHub 项目展示规范。

本项目第一版以“个人使用 + 可作为简历项目展示”为目标，不追求复杂平台化功能。

---

## 2. 技术架构总览

### 2.1 MVP 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| Web App | Streamlit | 快速搭建可交互 Web 页面 |
| 浏览器插件 | Chrome Extension Manifest V3 | 实现网页岗位剪藏 |
| 后端逻辑 | Python | 数据处理、匹配算法、LLM 调用 |
| 数据库 | SQLite | 轻量级本地数据库，适合个人项目 |
| 数据处理 | pandas | 岗位数据清洗、表格展示、统计分析 |
| 网页解析 | 插件读取 DOM 文本 | 读取用户当前浏览页面文本 |
| 大模型 | OpenAI API / 其他 LLM API | JD 解析、推荐理由、简历生成、面试准备 |
| Embedding | OpenAI Embedding / sentence-transformers | 用于 JD 与经历的语义相似度匹配 |
| 向量库 | ChromaDB / FAISS | MVP 可后置，展示版再接入 |
| 部署 | Hugging Face Spaces / Streamlit Community Cloud | 在线展示 Web App |
| 版本管理 | GitHub | 项目托管与展示 |

---

### 2.2 系统整体流程

```text
用户设置求职偏好
        ↓
用户录入个人经历素材库
        ↓
用户通过手动输入 / CSV / 浏览器插件导入岗位
        ↓
系统解析 JD 或剪藏文本
        ↓
系统计算岗位匹配度
        ↓
展示推荐岗位列表
        ↓
用户选择感兴趣岗位
        ↓
生成简历 bullet / 面试准备 / AI 问答
```

---

### 2.3 插件与 Web App 的关系

第一版采用“复制型插件”方案：

```text
招聘页面
  ↓
InternPilot Clipper 读取页面信息
  ↓
生成 JSON 并复制到剪贴板
  ↓
用户打开 InternPilot Web App
  ↓
在岗位导入页面粘贴 JSON
  ↓
系统解析并保存到 jobs 表
```

后续增强版可升级为：

```text
招聘页面
  ↓
InternPilot Clipper
  ↓
POST /api/jobs/clip
  ↓
FastAPI Backend
  ↓
SQLite / PostgreSQL
  ↓
InternPilot Web App
```

MVP 阶段优先实现第一种方案，不强制引入 FastAPI。

---

## 3. 项目目录结构

建议项目目录如下：

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
│   ├── clip_parser.py
│   ├── jd_parser.py
│   ├── matcher.py
│   ├── resume_generator.py
│   ├── interview_generator.py
│   ├── ai_assistant.py
│   ├── llm_client.py
│   └── utils.py
├── prompts/
│   ├── jd_parser_prompt.txt
│   ├── clip_parser_prompt.txt
│   ├── recommendation_prompt.txt
│   ├── resume_prompt.txt
│   ├── interview_prompt.txt
│   └── assistant_prompt.txt
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── content.js
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── data/
│   ├── internpilot.db
│   ├── sample_jobs.csv
│   ├── sample_experiences.csv
│   ├── sample_clip.json
│   └── README.md
├── assets/
│   ├── screenshots/
│   └── architecture.png
├── tests/
│   ├── test_matcher.py
│   ├── test_db.py
│   └── test_clip_parser.py
├── .streamlit/
│   └── secrets.toml
├── requirements.txt
├── README.md
├── AGENTS.md
└── .gitignore
```

---

## 4. 环境配置

### 4.1 requirements.txt

第一版建议依赖：

```txt
streamlit
pandas
numpy
requests
beautifulsoup4
python-dotenv
openai
scikit-learn
sentence-transformers
chromadb
plotly
```

如果暂时不做向量库，可以先不安装：

```txt
sentence-transformers
chromadb
```

浏览器插件不需要 Python 依赖。

---

### 4.2 API Key 管理

本地开发可使用 `.env`：

```text
OPENAI_API_KEY=your_api_key_here
```

Streamlit Cloud / Hugging Face Spaces 部署时使用 secrets，不要把 API key 上传到 GitHub。

`.gitignore` 中应包含：

```text
.env
.streamlit/secrets.toml
data/internpilot.db
__pycache__/
*.pyc
.DS_Store
```

---

## 5. 数据库设计与初始化

### 5.1 数据库文件

数据库路径：

```text
data/internpilot.db
```

---

### 5.2 核心数据表

项目第一版使用 5 张核心表：

1. `profile`：用户求职偏好；
2. `experience_blocks`：个人经历素材库；
3. `jobs`：岗位信息表；
4. `interview_notes`：面经知识库；
5. `generated_outputs`：生成内容记录。

---

### 5.3 jobs 表新增字段

为了支持插件剪藏，`jobs` 表需要新增：

```text
raw_clip_text
source_domain
clipped_at
```

完整 jobs 表：

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    title TEXT NOT NULL,
    location TEXT,
    role_type TEXT,
    source TEXT,
    jd_text TEXT,
    raw_clip_text TEXT,
    source_domain TEXT,
    apply_url TEXT,
    publish_date TEXT,
    deadline TEXT,
    skills TEXT,
    status TEXT DEFAULT '未查看',
    match_score REAL,
    recommendation_reason TEXT,
    clipped_at TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

---

### 5.4 modules/db.py 新增函数

除原有函数外，建议新增：

```python
def add_job_from_clip(clip_data: dict, parsed_data: dict | None = None):
    """从插件剪藏 JSON 新增岗位。"""
    pass


def update_job_parsed_fields(job_id: int, parsed_data: dict):
    """更新从剪藏文本中解析出的结构化字段。"""
    pass
```

`add_job_from_clip` 应将插件原始数据保存到：

- `raw_clip_text`
- `source_domain`
- `apply_url`
- `clipped_at`
- `source = "clipped"`

如果尚未解析出公司和岗位名称，可临时使用：

```text
title = page_title
company = 待解析
role_type = 待解析
```

---

## 6. Streamlit 页面开发设计

## 6.1 app.py

`app.py` 作为首页入口，负责初始化数据库和展示项目介绍。

```python
import streamlit as st
from modules.db import init_db

st.set_page_config(
    page_title="InternPilot",
    page_icon="🚀",
    layout="wide"
)

init_db()

st.title("🚀 InternPilot")
st.subheader("个人化实习推荐与简历适配系统")

st.markdown("""
InternPilot 用于整合实习岗位信息、个人经历素材库和面试经验，帮助你完成：

- 岗位剪藏与导入
- 岗位推荐
- JD 解析
- 简历 bullet 生成
- 面试准备
- AI 求职问答
""")

st.info("请从左侧页面开始使用：先设置求职偏好，再录入个人经历，然后导入岗位并生成推荐。")
```

---

## 6.2 Job Recommendation 页面新增：插件 JSON 导入

页面文件：

```text
pages/4_💼_Job_Recommendation.py
```

新增功能：

1. 粘贴 InternPilot Clipper 复制的 JSON；
2. 校验 JSON 格式；
3. 展示解析预览；
4. 保存为岗位；
5. 可选调用 LLM 解析结构化 JD；
6. 保存后进入岗位库。

### 页面交互示例

```text
[粘贴 InternPilot Clipper JSON]

文本框：
{
  "page_title": "小红书 - 数据分析实习生",
  "url": "https://...",
  "selected_text": "岗位职责...",
  "page_text": "...",
  "source_domain": "boss.com",
  "created_at": "2026-04-27T10:00:00"
}

按钮：
[保存到岗位库]
[保存并解析 JD]
```

---

## 7. 插件剪藏解析模块

文件：

```text
modules/clip_parser.py
```

### 7.1 功能说明

负责解析插件生成的 JSON，并转换为岗位数据。

### 7.2 基础函数设计

```python
import json
from datetime import datetime
from urllib.parse import urlparse


def parse_clip_json(raw_json: str) -> dict:
    """解析插件复制的 JSON 字符串。"""
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise ValueError("剪藏 JSON 格式不正确") from exc

    required_keys = ["page_title", "url", "source_domain", "created_at"]
    for key in required_keys:
        if key not in data:
            raise ValueError(f"剪藏 JSON 缺少字段: {key}")

    return data


def clip_to_job_data(clip_data: dict) -> dict:
    """将剪藏数据转换为 jobs 表可保存的数据。"""
    selected_text = clip_data.get("selected_text") or ""
    page_text = clip_data.get("page_text") or ""
    raw_clip_text = selected_text.strip() or page_text.strip()

    return {
        "company": "待解析",
        "title": clip_data.get("page_title") or "待解析岗位",
        "location": "待解析",
        "role_type": "待解析",
        "source": "clipped",
        "jd_text": raw_clip_text,
        "raw_clip_text": raw_clip_text,
        "source_domain": clip_data.get("source_domain"),
        "apply_url": clip_data.get("url"),
        "publish_date": None,
        "deadline": None,
        "skills": None,
        "status": "未查看",
        "clipped_at": clip_data.get("created_at") or datetime.now().isoformat(timespec="seconds"),
    }
```

---

## 8. JD 解析模块更新

文件：

```text
modules/jd_parser.py
```

JD 解析模块需要支持两类输入：

1. 标准 JD 文本；
2. 插件剪藏的页面文本。

### 8.1 输入

```python
{
    "company": "待解析",
    "title": "页面标题",
    "jd_text": "插件剪藏文本或手动输入 JD",
    "apply_url": "https://...",
    "source_domain": "boss.com"
}
```

### 8.2 输出

```python
{
    "company": "小红书",
    "title": "数据分析实习生",
    "location": "上海",
    "role_type": "数据分析",
    "summary": "该岗位主要负责用户行为数据分析...",
    "responsibilities": ["分析用户行为数据", "搭建指标体系"],
    "requirements": ["熟悉 SQL", "具备 Python 数据分析能力"],
    "skills": ["SQL", "Python", "数据分析", "指标体系"],
    "risk_points": ["可能需要较强 SQL 能力"]
}
```

---

## 9. 新增 Prompt：clip_parser_prompt.txt

文件：

```text
prompts/clip_parser_prompt.txt
```

内容建议：

```text
你是一个招聘岗位信息解析助手。以下文本来自用户通过浏览器插件剪藏的招聘网页，可能包含导航栏、广告、推荐岗位、页面噪声等无关信息。

请从中提取最可能的岗位信息，并输出结构化 JSON。

要求：
1. 只能根据给定文本提取信息，不要编造。
2. 如果某个字段无法判断，请填写“待确认”。
3. role_type 只能从以下类别选择：数据分析、AI产品、产品经理、用户研究、其他。
4. skills 应提取岗位中明确或隐含需要的能力。
5. 如果文本中包含多个岗位，请优先解析页面标题或选中文本最相关的岗位。

页面标题：{page_title}
页面 URL：{url}
来源域名：{source_domain}
剪藏文本：
{clip_text}

请输出 JSON：
{
  "company": "",
  "title": "",
  "location": "",
  "role_type": "",
  "summary": "",
  "responsibilities": [],
  "requirements": [],
  "skills": [],
  "risk_points": []
}
```

---

## 10. Chrome Extension 技术设计

目录：

```text
extension/
```

### 10.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "InternPilot Clipper",
  "version": "0.1.0",
  "description": "Clip internship job postings into InternPilot.",
  "permissions": ["activeTab", "scripting", "clipboardWrite", "tabs"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "InternPilot Clipper"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

### 10.2 popup.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>InternPilot Clipper</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div class="container">
    <h1>🚀 InternPilot Clipper</h1>
    <p class="subtitle">将当前岗位页面加入求职库</p>

    <div class="info-card">
      <label>页面标题</label>
      <div id="pageTitle" class="text-preview">读取中...</div>
    </div>

    <div class="info-card">
      <label>当前 URL</label>
      <div id="pageUrl" class="url-preview">读取中...</div>
    </div>

    <div class="info-card">
      <label>检测文本</label>
      <div id="textLength">读取中...</div>
    </div>

    <button id="copyJsonBtn">复制为岗位 JSON</button>
    <button id="openAppBtn" class="secondary">打开 InternPilot</button>

    <div id="status" class="status"></div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

---

### 10.3 popup.css

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f7f8fa;
  color: #1f2937;
  width: 360px;
}

.container {
  padding: 16px;
}

h1 {
  font-size: 18px;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.info-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
}

label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.text-preview,
.url-preview {
  font-size: 13px;
  line-height: 1.4;
  max-height: 56px;
  overflow: hidden;
  word-break: break-all;
}

button {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  margin-top: 8px;
}

button.secondary {
  background: #eef2ff;
  color: #4338ca;
}

.status {
  margin-top: 12px;
  font-size: 13px;
  color: #059669;
}
```

---

### 10.4 popup.js

```javascript
let clipData = null;

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function collectPageData() {
  const tab = await getCurrentTab();

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selectedText = window.getSelection().toString();
      const pageText = document.body ? document.body.innerText.slice(0, 8000) : "";
      return {
        page_title: document.title || "",
        url: window.location.href,
        selected_text: selectedText || "",
        page_text: selectedText ? "" : pageText,
        source_domain: window.location.hostname,
        created_at: new Date().toISOString()
      };
    }
  });

  clipData = results[0].result;
  renderClipData(clipData);
}

function renderClipData(data) {
  document.getElementById("pageTitle").textContent = data.page_title || "未检测到标题";
  document.getElementById("pageUrl").textContent = data.url || "未检测到 URL";

  const text = data.selected_text || data.page_text || "";
  document.getElementById("textLength").textContent = `${text.length} 字符`;
}

async function copyJsonToClipboard() {
  if (!clipData) {
    document.getElementById("status").textContent = "未检测到页面内容";
    return;
  }

  const jsonText = JSON.stringify(clipData, null, 2);
  await navigator.clipboard.writeText(jsonText);
  document.getElementById("status").textContent = "已复制，可粘贴到 InternPilot 岗位导入页面";
}

function openInternPilot() {
  chrome.tabs.create({ url: "http://localhost:8501" });
}

document.addEventListener("DOMContentLoaded", () => {
  collectPageData();
  document.getElementById("copyJsonBtn").addEventListener("click", copyJsonToClipboard);
  document.getElementById("openAppBtn").addEventListener("click", openInternPilot);
});
```

---

## 11. 岗位导入模块更新

文件：

```text
modules/job_importer.py
```

新增函数：

```python
from modules.clip_parser import parse_clip_json, clip_to_job_data


def import_job_from_clip_json(raw_json: str) -> dict:
    """从插件 JSON 导入岗位数据。"""
    clip_data = parse_clip_json(raw_json)
    job_data = clip_to_job_data(clip_data)
    return job_data
```

在岗位推荐页面中调用：

```python
raw_json = st.text_area("粘贴 InternPilot Clipper JSON")

if st.button("保存剪藏岗位"):
    try:
        job_data = import_job_from_clip_json(raw_json)
        add_job(job_data)
        st.success("已保存到岗位库")
    except ValueError as e:
        st.error(str(e))
```

---

## 12. LLM Client 设计

文件：

```text
modules/llm_client.py
```

基础接口：

```python
import os
from openai import OpenAI


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def call_llm(prompt: str, model: str = "gpt-4o-mini", temperature: float = 0.3) -> str:
    client = get_openai_client()
    if client is None:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "你是一个严谨的求职助手，擅长岗位分析、简历优化和面试准备。"},
            {"role": "user", "content": prompt}
        ],
        temperature=temperature
    )
    return response.choices[0].message.content
```

页面中调用时必须捕获异常，不能让应用崩溃。

---

## 13. 匹配算法设计

文件：

```text
modules/matcher.py
```

总体公式：

```text
match_score = role_score * 0.30
            + skill_score * 0.25
            + experience_score * 0.25
            + location_score * 0.10
            + value_score * 0.10
```

核心函数：

```python
def split_text(text: str) -> list[str]:
    if not text:
        return []
    return [x.strip() for x in text.replace("，", ",").split(",") if x.strip()]


def collect_user_keywords(experiences: list[dict]) -> list[str]:
    keywords = []
    for exp in experiences:
        keywords.extend(split_text(exp.get("keywords", "")))
        keywords.extend(split_text(exp.get("tools", "")))
    return list(set(keywords))


def calculate_role_score(job_role: str, target_roles: list[str]) -> float:
    if not job_role or not target_roles:
        return 0
    if job_role in target_roles:
        return 100
    if job_role == "产品经理" and "AI产品" in target_roles:
        return 80
    if job_role == "AI产品" and "产品经理" in target_roles:
        return 80
    return 30


def calculate_location_score(job_location: str, target_locations: list[str]) -> float:
    if not job_location:
        return 50
    if "不限" in job_location or "远程" in job_location:
        return 80
    for loc in target_locations:
        if loc in job_location:
            return 100
    return 20


def calculate_skill_score(job_skills: list[str], user_keywords: list[str]) -> float:
    if not job_skills:
        return 50
    if not user_keywords:
        return 0

    matched = 0
    for skill in job_skills:
        for keyword in user_keywords:
            if skill.lower() in keyword.lower() or keyword.lower() in skill.lower():
                matched += 1
                break

    return min(100, matched / len(job_skills) * 100)


def calculate_experience_score(jd_text: str, experiences: list[dict]) -> float:
    if not jd_text or not experiences:
        return 0

    jd_lower = jd_text.lower()
    scores = []

    for exp in experiences:
        keywords = exp.get("keywords", "")
        keyword_list = split_text(keywords)
        if not keyword_list:
            continue
        matched = sum(1 for k in keyword_list if k.lower() in jd_lower)
        scores.append(matched / len(keyword_list) * 100)

    if not scores:
        return 0

    return max(scores)


def calculate_match_score(job: dict, profile: dict, experiences: list[dict]) -> float:
    target_roles = split_text(profile.get("target_roles", ""))
    target_locations = split_text(profile.get("target_locations", ""))
    user_keywords = collect_user_keywords(experiences)
    job_skills = split_text(job.get("skills", ""))

    role_score = calculate_role_score(job.get("role_type"), target_roles)
    skill_score = calculate_skill_score(job_skills, user_keywords)
    experience_score = calculate_experience_score(job.get("jd_text", ""), experiences)
    location_score = calculate_location_score(job.get("location", ""), target_locations)
    value_score = 70

    final_score = (
        role_score * 0.30
        + skill_score * 0.25
        + experience_score * 0.25
        + location_score * 0.10
        + value_score * 0.10
    )

    return round(final_score, 2)
```

---

## 14. MVP 开发顺序更新

### 第 1 步：搭建 Web App 项目骨架

任务：

1. 创建项目目录；
2. 创建虚拟环境；
3. 安装依赖；
4. 创建 `app.py`；
5. 创建 `modules/db.py`；
6. 初始化数据库。

---

### 第 2 步：实现个人经历素材库

任务：

1. 创建 Experience Library 页面；
2. 实现新增经历表单；
3. 实现经历列表展示；
4. 实现基础删除功能；
5. 录入 5 条真实经历。

---

### 第 3 步：实现求职偏好设置

任务：

1. 创建 Profile 页面；
2. 实现目标岗位、城市、行业偏好录入；
3. 保存到数据库；
4. 支持读取已有偏好。

---

### 第 4 步：实现岗位导入

任务：

1. 创建岗位推荐页面；
2. 实现手动新增岗位；
3. 实现 CSV 导入；
4. 实现插件 JSON 粘贴导入；
5. 展示岗位列表。

---

### 第 5 步：实现匹配评分

任务：

1. 编写 `matcher.py`；
2. 实现岗位方向匹配；
3. 实现地点匹配；
4. 实现技能关键词匹配；
5. 实现经历关键词匹配；
6. 计算并保存 match_score。

---

### 第 6 步：接入大模型生成推荐理由和 JD 解析

任务：

1. 编写 `llm_client.py`；
2. 编写 `jd_parser_prompt.txt`；
3. 编写 `clip_parser_prompt.txt`；
4. 对手动 JD 和剪藏文本进行解析；
5. 对高匹配岗位生成推荐理由。

---

### 第 7 步：实现简历 bullet 生成

任务：

1. 创建 Resume Generator 页面；
2. 选择岗位；
3. 读取个人经历；
4. 调用 LLM 生成 bullet；
5. 支持复制和保存。

---

### 第 8 步：实现面试准备生成

任务：

1. 创建 Interview Prep 页面；
2. 选择岗位；
3. 调用 LLM 生成面试问题；
4. 输出补充知识点；
5. 保存生成结果。

---

### 第 9 步：实现 AI Assistant

任务：

1. 创建聊天页面；
2. 支持选择当前岗位；
3. 支持读取个人经历；
4. 支持连续对话；
5. 输出求职相关回答。

---

### 第 10 步：实现 InternPilot Clipper 复制型插件

任务：

1. 创建 `extension/` 目录；
2. 创建 `manifest.json`；
3. 创建 `popup.html`、`popup.css`、`popup.js`；
4. 插件读取当前页面标题、URL、选中文本和页面正文片段；
5. 生成 JSON；
6. 复制到剪贴板；
7. 插件提示用户粘贴到 InternPilot。

---

### 第 11 步：部署和项目展示

任务：

1. 写 README；
2. 添加 Web App 截图；
3. 添加插件截图；
4. 添加示例数据；
5. 配置部署；
6. 在线运行测试；
7. 整理简历项目描述。

---

## 15. README 更新要求

README 应新增插件说明：

```markdown
## InternPilot Clipper

InternPilot Clipper is a lightweight Chrome Extension that helps users clip job postings from external websites into InternPilot.

### Features

- Read current page title and URL
- Read selected text or page text
- Generate structured JSON
- Copy JSON to clipboard
- Import clipped job into InternPilot Web App

### How to use

1. Open Chrome Extension page: chrome://extensions/
2. Enable Developer Mode
3. Load unpacked extension from `extension/`
4. Open a job posting page
5. Click InternPilot Clipper
6. Copy JSON
7. Paste it into InternPilot Job Recommendation page
```

---

## 16. 给 Codex 的新增任务提示词

### 16.1 实现插件 JSON 导入

```text
请在现有 InternPilot 项目中实现插件 JSON 导入功能。

要求：
1. 新建 modules/clip_parser.py。
2. 实现 parse_clip_json(raw_json) 和 clip_to_job_data(clip_data)。
3. 修改 modules/db.py，使 jobs 表支持 raw_clip_text、source_domain、clipped_at 字段。
4. 在岗位推荐页面增加“粘贴 InternPilot Clipper JSON 导入”区域。
5. 用户粘贴插件 JSON 后，可以保存为岗位。
6. 如果 JSON 格式错误，应显示错误提示，不要让应用崩溃。
7. source 字段应保存为 clipped。
8. apply_url 应来自插件 JSON 的 url 字段。
```

---

### 16.2 实现 Chrome 插件第一版

```text
请为 InternPilot 实现第一版 Chrome Extension，命名为 InternPilot Clipper。

要求：
1. 在项目根目录创建 extension/ 目录。
2. 使用 Manifest V3。
3. 创建 manifest.json、popup.html、popup.css、popup.js。
4. 插件点击后读取当前页面：
   - document.title
   - window.location.href
   - window.getSelection().toString()
   - 如果没有选中文本，则读取 document.body.innerText 的前 8000 字符
   - window.location.hostname
   - new Date().toISOString()
5. 生成 JSON：
   {
     "page_title": "",
     "url": "",
     "selected_text": "",
     "page_text": "",
     "source_domain": "",
     "created_at": ""
   }
6. 点击按钮后将 JSON 复制到剪贴板。
7. popup 页面应显示当前页面标题、URL、文本长度和复制状态。
8. 不要实现自动批量抓取。
9. 不要实现后端同步。
10. 完成后说明如何在 Chrome 中加载 unpacked extension。
```

---

## 17. 更新后的简历项目表述

### 中文版

**InternPilot：基于浏览器插件与大模型的个性化实习求职助手**  
基于 Streamlit、SQLite、Chrome Extension 与大模型 API，开发面向个人求职场景的实习推荐与简历适配系统。系统支持用户在浏览招聘官网、BOSS、牛客、GitHub 等页面时通过浏览器插件剪藏岗位信息，并在 Web App 中完成 JD 解析、岗位-个人经历匹配评分、个性化岗位推荐、简历 bullet 自动生成和面试准备问答。通过规则打分、关键词匹配与大模型生成能力，为数据分析、AI 产品、用户研究等岗位提供个性化投递建议和求职材料生成。

### 英文版

**InternPilot: Personalized Internship Recommendation and Resume Tailoring System with Chrome Extension**  
Developed a Streamlit-based AI career assistant with a Chrome Extension clipper to collect internship postings from external job pages. The system integrates clipped job descriptions, personal experience blocks, and LLM-powered analysis to support JD parsing, job-experience matching, tailored resume bullet generation, and role-specific interview preparation for data analysis, AI product, and user research internships.

