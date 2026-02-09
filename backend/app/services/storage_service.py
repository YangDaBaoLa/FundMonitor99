"""
用户数据存储服务
将用户的自选基金、分组等数据保存到本地 JSON 文件
"""

import json
import os
from pathlib import Path
from typing import Optional
from datetime import datetime

# 数据存储目录
DATA_DIR = Path(__file__).parent.parent.parent / "data"
USER_DATA_FILE = DATA_DIR / "user_data.json"

# 默认数据结构
DEFAULT_USER_DATA = {
    "version": "1.0.0",
    "watchlist": [],
    "groups": [{"id": "default", "name": "所有基金", "order": 0}],
    "settings": {
        "hideAmount": False,
    },
    "updatedAt": None,
}


def ensure_data_dir():
    """确保数据目录存在"""
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True)
        print(f"[Storage] Created data directory: {DATA_DIR}")


def load_user_data() -> dict:
    """
    从本地文件加载用户数据
    如果文件不存在，返回默认数据
    """
    ensure_data_dir()

    if not USER_DATA_FILE.exists():
        print(f"[Storage] No user data file found, using defaults")
        return DEFAULT_USER_DATA.copy()

    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(
                f"[Storage] Loaded user data: {len(data.get('watchlist', []))} funds, {len(data.get('groups', []))} groups"
            )
            return data
    except json.JSONDecodeError as e:
        print(f"[Storage] Error parsing user data file: {e}")
        return DEFAULT_USER_DATA.copy()
    except Exception as e:
        print(f"[Storage] Error loading user data: {e}")
        return DEFAULT_USER_DATA.copy()


def save_user_data(data: dict) -> bool:
    """
    保存用户数据到本地文件
    """
    ensure_data_dir()

    try:
        # 添加更新时间
        data["updatedAt"] = datetime.now().isoformat()

        with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(
            f"[Storage] Saved user data: {len(data.get('watchlist', []))} funds, {len(data.get('groups', []))} groups"
        )
        return True
    except Exception as e:
        print(f"[Storage] Error saving user data: {e}")
        return False


def get_watchlist() -> list:
    """获取自选基金列表"""
    data = load_user_data()
    return data.get("watchlist", [])


def save_watchlist(watchlist: list) -> bool:
    """保存自选基金列表"""
    data = load_user_data()
    data["watchlist"] = watchlist
    return save_user_data(data)


def get_groups() -> list:
    """获取分组列表"""
    data = load_user_data()
    return data.get("groups", DEFAULT_USER_DATA["groups"])


def save_groups(groups: list) -> bool:
    """保存分组列表"""
    data = load_user_data()
    data["groups"] = groups
    return save_user_data(data)


def get_settings() -> dict:
    """获取用户设置"""
    data = load_user_data()
    return data.get("settings", DEFAULT_USER_DATA["settings"])


def save_settings(settings: dict) -> bool:
    """保存用户设置"""
    data = load_user_data()
    data["settings"] = settings
    return save_user_data(data)
