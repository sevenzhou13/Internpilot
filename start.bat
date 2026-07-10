@echo off
chcp 65001 >nul
echo === InternPilot 启动脚本 ===

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到 Python，请先安装 Python 3.9+
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 创建虚拟环境
if not exist ".venv" (
    echo ^>^>^> 创建虚拟环境...
    python -m venv .venv
)

:: 激活虚拟环境
call .venv\Scripts\activate.bat

:: 安装依赖
echo ^>^>^> 安装依赖...
pip install -r requirements.txt -q

:: 检查 .env
if not exist ".env" (
    echo.
    echo ⚠️  未找到 .env 文件，AI 生成功能将不可用：
    echo.
    echo   1. 复制 .env.example 为 .env
    echo   2. 用记事本打开 .env，填入你的 DeepSeek API Key
    echo.
    echo 获取 API Key：https://platform.deepseek.com/api_keys
    echo.
    echo   仍会启动本地服务，你可以使用岗位管理、匹配、分类和 RAG 检索。
)

:: 确保 data 目录存在
if not exist "data" mkdir data

:: 启动服务
echo.
echo ^>^>^> 启动 InternPilot...
echo     本地访问：http://localhost:8000
echo     按 Ctrl+C 停止
echo.
uvicorn server:app --reload --host 127.0.0.1 --port 8000
