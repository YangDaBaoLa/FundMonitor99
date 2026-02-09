#!/bin/bash

# 基金监控应用启动脚本

echo "🚀 启动基金监控应用..."

# 启动后端
echo "📡 启动后端服务 (port 8000)..."
cd ~/Desktop/fund-monitor/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务 (port 5173)..."
cd ~/Desktop/fund-monitor/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务已启动!"
echo "   后端: http://localhost:8000"
echo "   前端: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '服务已停止'; exit" SIGINT SIGTERM

# 保持脚本运行
wait
