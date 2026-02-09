"""
用户数据 API
处理自选基金、分组的 CRUD 操作
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from ..services import data_store

router = APIRouter(prefix="/userdata", tags=["userdata"])


# ==================== 数据模型 ====================


class FundItem(BaseModel):
    code: str
    name: str
    amount: float = 0
    profit: float = 0
    shares: float = 0
    cost: float = 0
    costPrice: float = 0
    groupId: str = "default"


class FundUpdate(BaseModel):
    amount: Optional[float] = None
    profit: Optional[float] = None
    shares: Optional[float] = None
    cost: Optional[float] = None
    costPrice: Optional[float] = None
    groupId: Optional[str] = None


class GroupCreate(BaseModel):
    name: str


class GroupRename(BaseModel):
    name: str


class MoveFundRequest(BaseModel):
    groupId: str


class SettingUpdate(BaseModel):
    key: str
    value: Any


# ==================== 自选基金 API ====================


@router.get("/watchlist")
async def get_watchlist():
    """获取自选基金列表"""
    return {"watchlist": data_store.get_watchlist()}


@router.post("/watchlist")
async def add_fund(fund: FundItem):
    """添加自选基金"""
    result = data_store.add_fund(fund.model_dump())
    if result is None:
        raise HTTPException(status_code=400, detail="基金已存在")
    return {"fund": result}


@router.delete("/watchlist/{fund_id}")
async def remove_fund(fund_id: str):
    """删除自选基金"""
    success = data_store.remove_fund(fund_id)
    if not success:
        raise HTTPException(status_code=404, detail="基金不存在")
    return {"success": True}


@router.patch("/watchlist/{fund_id}")
async def update_fund(fund_id: str, updates: FundUpdate):
    """更新自选基金"""
    # 过滤掉 None 值
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    result = data_store.update_fund(fund_id, update_data)
    if result is None:
        raise HTTPException(status_code=404, detail="基金不存在")
    return {"fund": result}


@router.post("/watchlist/{fund_id}/move")
async def move_fund(fund_id: str, request: MoveFundRequest):
    """移动基金到分组"""
    success = data_store.move_fund_to_group(fund_id, request.groupId)
    if not success:
        raise HTTPException(status_code=404, detail="基金不存在")
    return {"success": True}


# ==================== 分组 API ====================


@router.get("/groups")
async def get_groups():
    """获取分组列表"""
    return {"groups": data_store.get_groups()}


@router.post("/groups")
async def create_group(group: GroupCreate):
    """创建分组"""
    result = data_store.create_group(group.name)
    return {"group": result}


@router.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    """删除分组"""
    if group_id == "default":
        raise HTTPException(status_code=400, detail="不能删除默认分组")
    success = data_store.delete_group(group_id)
    if not success:
        raise HTTPException(status_code=404, detail="分组不存在")
    return {"success": True}


@router.patch("/groups/{group_id}")
async def rename_group(group_id: str, request: GroupRename):
    """重命名分组"""
    result = data_store.rename_group(group_id, request.name)
    if result is None:
        raise HTTPException(status_code=404, detail="分组不存在")
    return {"group": result}


# ==================== 设置 API ====================


@router.get("/settings")
async def get_settings():
    """获取设置"""
    return {"settings": data_store.get_settings()}


@router.patch("/settings")
async def update_setting(request: SettingUpdate):
    """更新设置"""
    result = data_store.update_setting(request.key, request.value)
    return {"settings": result}
