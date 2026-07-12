# 匿名 Demo 运行说明

最后更新：2026-07-11

`demo` 模式用于课程答辩和公开展示：它使用独立的 `data/internpilot_demo.db`，首次启动自动写入匿名岗位、匿名经历和匿名偏好；外部 LLM 调用被强制禁用。因此不会读取本地个人数据库，也不会消耗 API 额度。

## 启动

Windows PowerShell：

```powershell
$env:APP_MODE = "demo"
Remove-Item Env:INTERNPILOT_DB_PATH -ErrorAction SilentlyContinue
.\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8000
```

浏览器打开 <http://127.0.0.1:8000>。侧边栏会显示“匿名 Demo · 外部 AI 已禁用”。

恢复个人本地模式：关闭服务后重新打开 PowerShell，或执行 `$env:APP_MODE = "local"`。本地模式继续使用 `data/internpilot.db`。

## 演示边界

- 可以演示导入、结构化、匹配、技能分析、聚类、RAG 索引和 UI 交互。
- 不演示真实简历、真实 JD、Cookie、API Key 或外部 LLM 输出。
- Demo 的写入仅作用于独立数据库；公开部署不提供持久化承诺。
