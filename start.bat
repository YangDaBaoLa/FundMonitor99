@echo off
chcp 65001 >nul
title 基金监控应用

echo ========================================
echo        基金监控应用启动器
echo ========================================
echo.

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 检查 Python 虚拟环境
if not exist "backend\venv\Scripts\activate.bat" (
    echo [错误] 未找到 Python 虚拟环境
    echo 请先运行: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

:: 检查 node_modules
if not exist "frontend\node_modules" (
    echo [错误] 未找到前端依赖
    echo 请先运行: cd frontend ^&^& npm install
    pause
    exit /b 1
)

echo [1/2] 启动后端服务 (port 8000)...
start "Fund Monitor Backend" cmd /c "cd /d "%SCRIPT_DIR%backend" && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

:: 等待后端启动
timeout /t 3 /nobreak >nul

echo [2/2] 启动前端服务 (port 5173)...
start "Fund Monitor Frontend" cmd /c "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

echo.
echo ========================================
echo   服务已启动!
echo   后端: http://localhost:8000
echo   前端: http://localhost:5173
echo ========================================
echo.
echo 关闭此窗口不会停止服务
echo 要停止服务，请关闭 "Fund Monitor Backend" 和 "Fund Monitor Frontend" 窗口
echo.

:: 等待几秒后自动打开浏览器
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
