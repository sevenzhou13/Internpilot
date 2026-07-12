# 部署与安全验收

最后更新：2026-07-11

## Render Demo

仓库根目录的 `render.yaml` 已配置为匿名 Demo：Render 创建 Web Service 后自动安装 `requirements.txt`，以 `APP_MODE=demo` 启动 `uvicorn`，并使用 `/health` 作为健康检查。该模式自动生成匿名种子数据且禁用外部 LLM，不需要配置任何密钥。

部署需要项目所有者在 Render 账户中授权 GitHub 仓库；这是外部账户操作，无法由本仓库自动完成。

## 本地部署前检查

```powershell
.\.venv\Scripts\python.exe scripts\security_check.py
.\.venv\Scripts\python.exe -m compileall -q modules server.py scripts
.\.venv\Scripts\python.exe -m pytest
git diff --check
```

验收点：

1. `/health` 返回 `status=ok` 且模式正确；
2. Demo 展示匿名数据，侧边栏提示外部 AI 已禁用；
3. `.env`、数据库、原始 JD、模型和真实简历没有被 Git 跟踪；
4. URL 导入继续阻止本机、内网和保留地址；
5. 真实个人数据只在 `APP_MODE=local` 的本地数据库中处理。
