@echo off
chcp 65001 >nul
title 基金监控应用 - 环境安装

echo ========================================
echo     基金监控应用 - 环境安装
echo ========================================
echo.

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 检查 Python
echo [检查] Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version

:: 检查 Node.js
echo [检查] Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
node --version

echo.
echo ========================================
echo     安装后端依赖
echo ========================================
echo.

cd /d "%SCRIPT_DIR%backend"

:: 创建虚拟环境
if not exist "venv" (
    echo 创建 Python 虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境并安装依赖
echo 安装 Python 依赖...
call venv\Scripts\activate
pip install -r requirements.txt

echo.
echo ========================================
echo     安装前端依赖
echo ========================================
echo.

cd /d "%SCRIPT_DIR%frontend"
echo 安装 npm 依赖...
call npm install

echo.
echo ========================================
echo     安装完成!
echo ========================================
echo.
echo 现在可以双击 start.bat 启动应用
echo.
pause
