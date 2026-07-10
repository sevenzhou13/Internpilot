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
