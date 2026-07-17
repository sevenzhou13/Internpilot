# InternPilot 测试报告

最后更新：2026-07-10

## 第 1 周工程基线

环境：Windows，Python 3.12.13 项目虚拟环境；项目部署基线为 Python 3.11。

执行命令：

```powershell
.\venv\Scripts\python.exe -m pytest --cov=modules --cov=server --cov-report=term-missing
```

结果：

- 7 个测试全部通过。
- 总语句覆盖率：41%。
- `modules/matcher.py` 覆盖率：72%。
- `modules/config.py` 覆盖率：84%。
- `modules/db.py` 覆盖率：46%。

覆盖场景：

- 全新数据库初始化和重复初始化。
- 旧数据库升级前备份及字段迁移。
- 扩展个人偏好字段写入和读取。
- 技能、地点和综合匹配分基本行为。
- FastAPI 健康检查、偏好保存、岗位新增/读取、无 API Key 状态。

真实启动验证：

- 使用 `uvicorn server:app --host 127.0.0.1 --port 8010` 启动测试模式。
- `GET /health` 返回 HTTP 200 和 `{"status":"ok","mode":"test"}`。

未覆盖：

- LLM 在线调用和流式生成。
- 文件上传、插件、JD 解析失败分支。
- 第 2–5 周尚未实现的数据、模型和 RAG 模块。

## 第 2 周数据模型与导入

自动化结果：

- 15 个测试全部通过。
- 总语句覆盖率提升到 50%。
- `modules/job_structurer.py` 覆盖率 87%。
- `modules/job_importer.py` 覆盖率 52%，真实公网 URL 请求不进入自动化测试。

新增覆盖：

- 数据库版本 2 表和字段迁移。
- 标准技能及投递状态事件写入。
- 城市、薪资、学历、岗位大类和技能规则抽取。
- 规范化 URL 去重。
- 多文本分段、TXT 文件解析、非法文件类型和内网 URL 拒绝。
- 文本预览、确认写入、重复跳过、岗位分析和核心字段编辑保留。

前端验证：

- Uvicorn 页面加载和 Dashboard 渲染成功。
- 浏览器日志发现 `JobDetail.jsx` 结构化卡片插入位置错误，已移动并重新加载。
- 之后的浏览器交互被本地浏览器安全策略终止；未继续绕过，前端完整交互回归列入后续手工验收。

## 第 3 周岗位分类闭环

自动化结果：

- 已安装 `scikit-learn`，pytest 共 18 项全部通过。
- `python -m compileall -q modules server.py` 通过。
- `modules/job_classifier.py` 覆盖率为 88%，总覆盖率为 54%。

新增覆盖：

- 人工复核标签覆盖规则分类，并形成仅含人工标签的训练样本。
- 四条、两类别的最小数据集可训练并预测；小样本训练明确不返回独立评估指标。
- API 端到端覆盖人工复核队列、模型训练、单岗位预测、预测历史写入，且验证模型不会覆盖人工标签。

## 文档治理与训练脚本

自动化结果：

- `python -m compileall -q modules server.py scripts` 通过。
- pytest 共 20 项通过，总覆盖率 54%，`modules/job_classifier.py` 覆盖率 95%。
- 标签 CSV 导出/导入脚本已通过子进程回归测试；两个训练辅助脚本的 `--help` 入口可正常运行。

新增覆盖：

- 样本足够时的固定种子分层留出评估，验证输出 Macro-F1。
- CSV 标签导出、人工填写后重新导入数据库的完整回路。

前端说明：

- 岗位详情页已加入类别人工复核和模型预测控件；当前内置浏览器无法连接临时 localhost 服务，未将该页面交互计为浏览器验收。后端 API 已由自动化端到端测试覆盖。

## 第 4 周匹配解释基础

- 新增匹配解释单元测试与 API 冒烟测试，覆盖分项得分、匹配技能、待补技能和测试模式 LLM 隔离。

## 第 4 周本地 RAG 检索 MVP

- pytest 共 23 项通过。
- 覆盖岗位与经历的知识切片、持久化、按问题检索和当前岗位过滤。

## 第 4 周前端呈现

- 岗位详情和 AI 助手已接入匹配解释、检索来源展示。
- 自动化回归 23 项通过；浏览器交互复测保留为本机手工验收项。

## 第 5 周岗位分析控制台基础

- pytest 共 24 项通过。
- 覆盖岗位类别、投递漏斗、高频技能与个人技能短板聚合；控制台使用同一分析接口展示结果。

## 第 5 周岗位文本聚类

- pytest 共 25 项通过。
- 覆盖固定种子 K-Means、聚类关键词、代表岗位和 silhouette 指标输出。

## 公开 JD JSONL 导入

- 新增 `scripts/import_public_jds.py` 的子进程回归测试。
- 覆盖采集字段校验、结构化入库、来源审计说明与 URL 去重。

## 公开数据集抽取与外部标签来源

- 新增 Hugging Face 公开接口抽取脚本的离线回归测试，覆盖岗位名称提取、来源审计字段和 JSONL 输出。
- 新增外部数据集类别标签的回归测试，覆盖标签来源追踪和模型预测不覆盖已映射外部标签。
- 完整回归：`compileall` 与 `git diff --check` 通过，pytest 共 28 项通过。

## 批量弱建议复核包

- 新增复核 CSV 建议字段测试，确保模型/规则建议与人工 `category` 列分离。
- 完整回归：`compileall` 与 `git diff --check` 通过，pytest 共 29 项通过。

## 外部类别训练口径与弱监督隔离

- 新增 LLM 映射标签回归覆盖：默认训练样本查询排除 `llm_mapped`，只有显式传入探索性开关才可读取；模型结果不生成可报告的独立评估指标。
- 2026-07-11 完整回归：`python -m compileall -q modules server.py scripts`、`python -m pytest` 和 `git diff --check` 均通过；pytest 共 **31 项通过**（12 条第三方依赖弃用警告）。

## 开放岗位 taxonomy

- 覆盖 LLM 自定义类别优先于八类规则兜底、AI 重新解析不覆盖人工确认，以及 API 对任意非空类别的保存与回显；确认旧模型预测不会覆盖 `category_source=llm` 的 AI 分类。
- 2026-07-11 完整回归：`python -m compileall -q modules server.py scripts`、`python -m pytest` 和 `git diff --check` 均通过；pytest 共 **34 项通过**（12 条第三方依赖弃用警告）。

## 第 6 周 Demo、实验与部署验收

- 覆盖 Demo 独立数据库自动种子化、Demo 强制禁用外部 LLM、候选簇数的 silhouette 选择、实验报告聚合导出和 taxonomy 合并历史。
- `scripts/security_check.py` 通过：未发现被 Git 跟踪的 `.env`、真实数据库、原始数据或模型产物。
- `APP_MODE=demo` 下本地 `/health` 返回 `{"status":"ok","mode":"demo"}`，并成功生成 12 条匿名岗位的实验报告；报告仅含聚合统计、关键词和代表岗位标题。
- 2026-07-11 完整回归：`python -m compileall -q modules server.py scripts`、`python -m pytest` 和 `git diff --check` 均通过；pytest 共 **37 项通过**（12 条第三方依赖弃用警告）。当前内置验收浏览器无法连接此会话的 localhost，因此前端视觉验收仍需在项目所有者本机浏览器完成。

## 匹配交互入口

- API 冒烟测试覆盖单岗位 `POST /api/jobs/{job_id}/match`：在已有偏好和经历时返回四项可解释分数并写回岗位总分。
- 完整回归仍为 pytest **37 项通过**；安全检查和 `git diff --check` 通过。

## 浏览器辅助 URL 导入

- 覆盖公开 URL 与内网目标校验、代理 Fake-IP 兼容、验证中间页识别、后台任务完成、FastAPI 启动/轮询接口和结构化预览返回。
- Playwright 1.61.0 已安装到项目虚拟环境；系统 Chrome 可成功启动并使用专用持久化配置目录。
- 真实 BOSS 链接测试进入浏览器等待阶段，但因系统 DNS 残留 `198.18.0.51` 且代理已关闭而进入 `chrome-error://`；代码现会返回明确的代理/DNS 提示，不将错误页识别为岗位。
- 2026-07-17 浏览器导入提交范围回归：`compileall`、安全检查和 `git diff --check` 通过；pytest 共 **41 项通过**（12 条第三方依赖弃用警告）。本地另有未纳入本提交的匹配改动及测试。
