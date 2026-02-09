"""
Fund Monitor - FastAPI Main Application
"""

import os
import sys
import webbrowser
import threading
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.api import funds, health, userdata


def get_static_dir():
    """获取静态文件目录（支持 PyInstaller 打包）"""
    if getattr(sys, "frozen", False):
        # PyInstaller 打包后的路径
        base_path = Path(sys._MEIPASS)
    else:
        # 开发环境
        base_path = Path(__file__).parent.parent.parent

    static_dir = base_path / "static"
    return static_dir if static_dir.exists() else None


def open_browser():
    """延迟打开浏览器"""
    import time

    time.sleep(1.5)  # 等待服务器启动
    webbrowser.open(f"http://127.0.0.1:{settings.PORT}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # 在打包模式下自动打开浏览器
    if getattr(sys, "frozen", False):
        threading.Thread(target=open_browser, daemon=True).start()

    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="基金实时监控系统 API",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(funds.router, prefix="/api", tags=["Funds"])
app.include_router(userdata.router, prefix="/api", tags=["UserData"])

# 静态文件服务（仅在打包后生效）
static_dir = get_static_dir()
if static_dir:
    # 挂载静态资源
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/")
    async def serve_index():
        """Serve frontend index.html"""
        return FileResponse(static_dir / "index.html")

    @app.get("/{path:path}")
    async def serve_static(path: str):
        """Serve static files or fallback to index.html for SPA routing"""
        file_path = static_dir / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # SPA fallback
        return FileResponse(static_dir / "index.html")
else:

    @app.get("/")
    async def root():
        """Root endpoint (development mode)"""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running",
            "mode": "development",
        }
