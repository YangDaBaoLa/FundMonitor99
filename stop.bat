@echo off
chcp 65001 >nul
title 停止基金监控服务

echo ========================================
echo        停止基金监控服务
echo ========================================
echo.

:: 停止后端服务 (uvicorn)
echo 正在停止后端服务...
taskkill /F /IM uvicorn.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq Fund Monitor Backend*" 2>nul

:: 停止前端服务 (node)
echo 正在停止前端服务...
taskkill /F /FI "WINDOWTITLE eq Fund Monitor Frontend*" 2>nul

:: 也尝试通过端口停止
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do taskkill /F /PID %%a 2>nul

echo.
echo 服务已停止!
echo.
pause
