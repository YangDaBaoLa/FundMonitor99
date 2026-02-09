# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Fund Monitor
"""

import sys
from pathlib import Path

block_cipher = None

# 获取项目路径
project_root = Path(SPECPATH).parent
backend_dir = project_root / 'backend'
frontend_dist = project_root / 'frontend' / 'dist'

# 收集数据文件
datas = []

# 添加前端构建文件（如果存在）
if frontend_dist.exists():
    datas.append((str(frontend_dist), 'static'))

# 添加后端数据目录模板（空目录结构）
datas.append((str(backend_dir / 'data'), 'data'))

a = Analysis(
    [str(backend_dir / 'run.py')],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'httptools',
        'uvloop',
        'watchfiles',
        'websockets',
        'pydantic',
        'pydantic_settings',
        'httpx',
        'cachetools',
        'anyio',
        'anyio._backends._asyncio',
        'starlette',
        'starlette.responses',
        'starlette.staticfiles',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='FundMonitor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Windows 下显示控制台，方便查看日志
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # 可以添加图标: 'path/to/icon.ico'
)

# macOS 专用：创建 .app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='FundMonitor.app',
        icon=None,  # 可以添加图标: 'path/to/icon.icns'
        bundle_identifier='com.fundmonitor.app',
        info_plist={
            'CFBundleName': 'Fund Monitor',
            'CFBundleDisplayName': 'Fund Monitor',
            'CFBundleVersion': '1.0.0',
            'CFBundleShortVersionString': '1.0.0',
            'NSHighResolutionCapable': True,
        },
    )
