"""
Fund Monitor - 启动入口
用于 PyInstaller 打包
"""

import sys
import os
from pathlib import Path


# 设置工作目录为用户文档目录（用于存储数据文件）
def setup_data_dir():
    """设置数据目录"""
    if getattr(sys, "frozen", False):
        # 打包后的运行环境
        if sys.platform == "darwin":
            # macOS: ~/Library/Application Support/FundMonitor
            data_dir = Path.home() / "Library" / "Application Support" / "FundMonitor"
        elif sys.platform == "win32":
            # Windows: %APPDATA%/FundMonitor
            data_dir = Path(os.environ.get("APPDATA", Path.home())) / "FundMonitor"
        else:
            # Linux: ~/.config/FundMonitor
            data_dir = Path.home() / ".config" / "FundMonitor"

        data_dir.mkdir(parents=True, exist_ok=True)

        # 设置环境变量，让 data_store.py 使用这个目录
        os.environ["FUND_MONITOR_DATA_DIR"] = str(data_dir)
        print(f"Data directory: {data_dir}")


def main():
    """主入口"""
    setup_data_dir()

    import uvicorn
    from app.config import settings

    print("=" * 50)
    print("  Fund Monitor - 基金实时监控系统")
    print("=" * 50)
    print(f"  访问地址: http://127.0.0.1:{settings.PORT}")
    print("  按 Ctrl+C 退出")
    print("=" * 50)

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=settings.PORT,
        log_level="info",
    )


if __name__ == "__main__":
    main()
