"""
日内涨跌幅数据存储服务
存储每次刷新时的涨跌幅数据，用于绘制日内走势图
每天早上9点清零
"""

import json
from datetime import datetime, time
from typing import Optional
from pathlib import Path
import threading

from app.services.data_store import get_data_dir

# 数据存储目录
DATA_DIR = get_data_dir()
INTRADAY_DIR = DATA_DIR / "intraday"

# 确保目录存在
INTRADAY_DIR.mkdir(parents=True, exist_ok=True)

# 线程锁
_lock = threading.Lock()

# 开盘和收盘时间
MARKET_OPEN = time(9, 30)
MARKET_CLOSE = time(15, 0)
CLEAR_TIME = time(9, 0)  # 每天9点清零


def _get_today_file() -> Path:
    """获取今日数据文件路径"""
    today = datetime.now().strftime("%Y-%m-%d")
    return INTRADAY_DIR / f"{today}.json"


def _read_intraday_data() -> dict:
    """读取今日日内数据"""
    file_path = _get_today_file()
    try:
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # 检查是否需要清零（9点清零）
                if _should_clear_data(data):
                    return {"date": datetime.now().strftime("%Y-%m-%d"), "funds": {}}
                return data
    except Exception as e:
        print(f"Error reading intraday data: {e}")
    return {"date": datetime.now().strftime("%Y-%m-%d"), "funds": {}}


def _should_clear_data(data: dict) -> bool:
    """检查是否需要清零数据（每天9点清零）"""
    if not data.get("last_update"):
        return False

    try:
        last_update = datetime.fromisoformat(data["last_update"])
        now = datetime.now()

        # 如果上次更新是昨天或更早，清零
        if last_update.date() < now.date():
            return True

        # 如果今天已经过了9点，但上次更新是9点之前，清零
        clear_datetime = datetime.combine(now.date(), CLEAR_TIME)
        if now >= clear_datetime and last_update < clear_datetime:
            return True

    except Exception:
        pass

    return False


def _write_intraday_data(data: dict) -> bool:
    """写入日内数据"""
    file_path = _get_today_file()
    try:
        with _lock:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error writing intraday data: {e}")
        return False


def _is_trading_time() -> bool:
    """检查当前是否在交易时间内（9:30-15:00）"""
    now = datetime.now().time()
    return MARKET_OPEN <= now <= MARKET_CLOSE


def _time_to_minutes(t: time) -> int:
    """将时间转换为分钟数（从0:00开始）"""
    return t.hour * 60 + t.minute


def save_fund_change(code: str, change: float, timestamp: str = None) -> bool:
    """
    保存单只基金的涨跌幅数据

    Args:
        code: 基金代码
        change: 涨跌幅（百分比）
        timestamp: 时间戳（HH:MM:SS格式），默认为当前时间

    Returns:
        是否保存成功
    """
    if not _is_trading_time():
        return False

    if timestamp is None:
        timestamp = datetime.now().strftime("%H:%M:%S")

    data = _read_intraday_data()
    data["last_update"] = datetime.now().isoformat()

    if "funds" not in data:
        data["funds"] = {}

    if code not in data["funds"]:
        data["funds"][code] = []

    # 添加新的数据点
    data["funds"][code].append({"time": timestamp, "change": change})

    return _write_intraday_data(data)


def save_funds_changes_batch(changes: dict) -> bool:
    """
    批量保存多只基金的涨跌幅数据

    Args:
        changes: {code: change, ...} 格式的字典

    Returns:
        是否保存成功
    """
    if not _is_trading_time():
        return False

    timestamp = datetime.now().strftime("%H:%M:%S")
    data = _read_intraday_data()
    data["last_update"] = datetime.now().isoformat()

    if "funds" not in data:
        data["funds"] = {}

    for code, change in changes.items():
        if change is None:
            continue

        if code not in data["funds"]:
            data["funds"][code] = []

        data["funds"][code].append({"time": timestamp, "change": change})

    return _write_intraday_data(data)


def get_fund_intraday(code: str) -> list:
    """
    获取单只基金的日内涨跌幅数据

    Args:
        code: 基金代码

    Returns:
        [{time: "HH:MM:SS", change: float}, ...]
    """
    data = _read_intraday_data()
    return data.get("funds", {}).get(code, [])


def get_funds_intraday_batch(codes: list) -> dict:
    """
    批量获取多只基金的日内涨跌幅数据

    Args:
        codes: 基金代码列表

    Returns:
        {code: [{time: "HH:MM:SS", change: float}, ...], ...}
    """
    data = _read_intraday_data()
    funds_data = data.get("funds", {})

    result = {}
    for code in codes:
        result[code] = funds_data.get(code, [])

    return result


def clear_intraday_data() -> bool:
    """手动清零今日数据"""
    data = {"date": datetime.now().strftime("%Y-%m-%d"), "funds": {}}
    return _write_intraday_data(data)


def cleanup_old_files(keep_days: int = 7) -> int:
    """
    清理旧的日内数据文件

    Args:
        keep_days: 保留最近几天的数据

    Returns:
        删除的文件数量
    """
    deleted = 0
    today = datetime.now().date()

    try:
        for file_path in INTRADAY_DIR.glob("*.json"):
            try:
                # 从文件名解析日期
                date_str = file_path.stem  # 2024-01-01
                file_date = datetime.strptime(date_str, "%Y-%m-%d").date()

                # 计算天数差
                days_diff = (today - file_date).days

                if days_diff > keep_days:
                    file_path.unlink()
                    deleted += 1
            except Exception:
                continue
    except Exception as e:
        print(f"Error cleaning up old intraday files: {e}")

    return deleted
