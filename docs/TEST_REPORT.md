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
