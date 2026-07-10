#!/bin/bash
set -e

echo "=== InternPilot 启动脚本 ==="

# 检查 Python 版本
python3 --version >/dev/null 2>&1 || { echo "错误：未找到 python3，请先安装 Python 3.9+"; exit 1; }

# 创建虚拟环境（如果不存在）
if [ ! -d ".venv" ]; then
  echo ">>> 创建虚拟环境..."
  python3 -m venv .venv
fi

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
echo ">>> 安装依赖..."
pip install -r requirements.txt -q

# 检查 .env 文件
if [ ! -f ".env" ]; then
  echo ""
  echo "⚠️  未找到 .env 文件，请根据 .env.example 创建："
  echo ""
  echo "  cp .env.example .env"
  echo "  然后填入你的 DeepSeek API Key"
  echo ""
  echo "获取 API Key：https://platform.deepseek.com/api_keys"
  echo ""
  read -p "是否继续启动（AI 功能将不可用）？[y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    exit 0
  fi
fi

# 确保 data 目录存在
mkdir -p data

# 启动服务
echo ""
echo ">>> 启动 InternPilot..."
echo "    本地访问：http://localhost:8000"
echo "    按 Ctrl+C 停止"
echo ""
uvicorn server:app --reload --host 0.0.0.0 --port 8000
