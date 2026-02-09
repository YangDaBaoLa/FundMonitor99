"""
本地数据存储服务
使用 JSON 文件持久化用户数据
"""

import json
import os
from datetime import datetime
from typing import Optional
from pathlib import Path
import threading


def get_data_dir() -> Path:
    """获取数据存储目录（支持打包后的自定义目录）"""
    # 优先使用环境变量指定的目录
    custom_dir = os.environ.get("FUND_MONITOR_DATA_DIR")
    if custom_dir:
        return Path(custom_dir)
    # 默认使用项目下的 data 目录
    return Path(__file__).parent.parent.parent / "data"


# 数据存储目录
DATA_DIR = get_data_dir()

# 确保数据目录存在
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 文件路径
WATCHLIST_FILE = DATA_DIR / "watchlist.json"
GROUPS_FILE = DATA_DIR / "groups.json"
SETTINGS_FILE = DATA_DIR / "settings.json"

# 线程锁，确保文件操作安全
_lock = threading.Lock()


def _read_json(file_path: Path, default=None):
    """读取 JSON 文件"""
    try:
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return default if default is not None else {}


def _write_json(file_path: Path, data):
    """写入 JSON 文件"""
    try:
        with _lock:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False


# ==================== 自选基金 ====================


def get_watchlist() -> list:
    """获取自选基金列表"""
    return _read_json(WATCHLIST_FILE, [])


def save_watchlist(watchlist: list) -> bool:
    """保存自选基金列表"""
    return _write_json(WATCHLIST_FILE, watchlist)


def add_fund(fund_data: dict) -> dict:
    """添加自选基金"""
    watchlist = get_watchlist()

    # 检查是否已存在
    for item in watchlist:
        if item.get("code") == fund_data.get("code"):
            return None  # 已存在

    # 生成 ID
    fund_data["id"] = f"fund_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    fund_data["addedAt"] = datetime.now().isoformat()
    fund_data["groupId"] = fund_data.get("groupId", "default")

    watchlist.append(fund_data)
    save_watchlist(watchlist)

    return fund_data


def remove_fund(fund_id: str) -> bool:
    """删除自选基金"""
    watchlist = get_watchlist()
    new_watchlist = [f for f in watchlist if f.get("id") != fund_id]

    if len(new_watchlist) < len(watchlist):
        return save_watchlist(new_watchlist)
    return False


def update_fund(fund_id: str, updates: dict) -> Optional[dict]:
    """更新自选基金"""
    watchlist = get_watchlist()

    for i, fund in enumerate(watchlist):
        if fund.get("id") == fund_id:
            watchlist[i] = {**fund, **updates}
            save_watchlist(watchlist)
            return watchlist[i]

    return None


def move_fund_to_group(fund_id: str, group_id: str) -> bool:
    """移动基金到分组"""
    return update_fund(fund_id, {"groupId": group_id}) is not None


# ==================== 分组 ====================


def get_groups() -> list:
    """获取分组列表"""
    groups = _read_json(GROUPS_FILE, None)
    if groups is None or not isinstance(groups, list) or len(groups) == 0:
        # 默认分组
        groups = [{"id": "default", "name": "所有基金", "order": 0}]
        save_groups(groups)
    return groups


def save_groups(groups: list) -> bool:
    """保存分组列表"""
    return _write_json(GROUPS_FILE, groups)


def create_group(name: str) -> dict:
    """创建分组"""
    groups = get_groups()

    # 生成 ID
    group_id = f"group_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    max_order = max([g.get("order", 0) for g in groups], default=0)

    new_group = {"id": group_id, "name": name, "order": max_order + 1}

    groups.append(new_group)
    save_groups(groups)

    return new_group


def delete_group(group_id: str) -> bool:
    """删除分组（将基金移回默认分组）"""
    if group_id == "default":
        return False

    # 将该分组的基金移回默认分组
    watchlist = get_watchlist()
    for fund in watchlist:
        if fund.get("groupId") == group_id:
            fund["groupId"] = "default"
    save_watchlist(watchlist)

    # 删除分组
    groups = get_groups()
    new_groups = [g for g in groups if g.get("id") != group_id]

    if len(new_groups) < len(groups):
        return save_groups(new_groups)
    return False


def rename_group(group_id: str, new_name: str) -> Optional[dict]:
    """重命名分组"""
    groups = get_groups()

    for i, group in enumerate(groups):
        if group.get("id") == group_id:
            groups[i]["name"] = new_name
            save_groups(groups)
            return groups[i]

    return None


# ==================== 设置 ====================


def get_settings() -> dict:
    """获取设置"""
    return _read_json(
        SETTINGS_FILE,
        {
            "hideAmount": False,
            "refreshInterval": 5000,
            "appName": "FM99",
            "avatar": {"type": "preset", "value": "�"},  # type: preset | custom, value: preset name or base64
        },
    )


def save_settings(settings: dict) -> bool:
    """保存设置"""
    return _write_json(SETTINGS_FILE, settings)


def update_setting(key: str, value) -> dict:
    """更新单个设置"""
    settings = get_settings()
    settings[key] = value
    save_settings(settings)
    return settings
