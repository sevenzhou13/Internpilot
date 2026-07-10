# InternPilot 开发协作规则

## 当前项目事实

- 产品：面向个人的 AI 求职管理与岗位分析工具，同时服务数据挖掘课程项目。
- 技术栈：FastAPI + React CDN + SQLite + Chrome Extension Manifest V3。
- 当前入口：`server.py`；不要恢复或新增 Streamlit / `app.py` 路线。
- 当前分类基线：人工复核标签 + TF-IDF + Logistic Regression；规则类别只可作为弱标签。

## 每次任务的最小上下文

按此顺序阅读，不要把整个历史文档或聊天记录塞入上下文：

1. `README.md`
2. `docs/context/PROJECT_MEMORY.md`
3. `docs/context/HANDOFF.md`
4. 与任务相关的 `docs/REQUIREMENTS.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`

`docs/archive/` 仅用于追溯旧方案，不能作为当前实现依据。

## 实施约束

- 保持单用户、本地优先；不实现登录、多租户、商业平台批量爬取或反爬绕过。
- 数据库读写集中在 `modules/db.py`，必须使用参数化 SQL 和可重复迁移。
- LLM 调用集中在 `modules/llm_client.py`；Prompt 放在 `prompts/`。
- 模型训练须固定随机种子，保存数据来源、标签来源、配置、版本和指标；不要把弱标签指标写成真实人工标注效果。
- 不提交 `.env`、数据库、模型产物、真实简历、联系方式、Token 或 Cookie。

## 变更与记忆纪律

一次功能变更必须同时检查：代码/API、测试、`docs/API.md`、数据字典、架构和交接状态是否受影响。

- 需求/范围变化：更新 `docs/REQUIREMENTS.md`。
- 长期技术取舍：新增 `docs/DECISIONS.md` 中的 ADR。
- 已验证进展：追加 `docs/PROJECT_PROGRESS.md` 和 `docs/TEST_REPORT.md`。
- 当前可继续工作的事实：更新 `docs/context/HANDOFF.md`；保持简短。

## 完成前检查

```powershell
.\.venv\Scripts\python.exe -m compileall -q modules server.py scripts
.\.venv\Scripts\python.exe -m pytest
git diff --check
```
