"""
日内涨跌幅数据 API 路由
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional

from app.services.intraday_store import (
    save_funds_changes_batch,
    get_fund_intraday,
    get_funds_intraday_batch,
    clear_intraday_data,
)


router = APIRouter()


class IntradayPoint(BaseModel):
    """日内数据点"""

    time: str
    change: float


class SaveIntradayRequest(BaseModel):
    """保存日内数据请求"""

    changes: Dict[str, Optional[float]]  # {code: change, ...}


class SaveIntradayResponse(BaseModel):
    """保存日内数据响应"""

    success: bool


class GetIntradayBatchRequest(BaseModel):
    """批量获取日内数据请求"""

    codes: List[str]


class GetIntradayBatchResponse(BaseModel):
    """批量获取日内数据响应"""

    data: Dict[str, List[IntradayPoint]]


@router.post("/intraday/save", response_model=SaveIntradayResponse)
async def save_intraday_changes(request: SaveIntradayRequest):
    """
    保存日内涨跌幅数据
    每次轮询刷新时调用，记录各基金的涨跌幅
    """
    success = save_funds_changes_batch(request.changes)
    return SaveIntradayResponse(success=success)


@router.get("/intraday/{code}", response_model=List[IntradayPoint])
async def get_intraday(code: str):
    """
    获取单只基金的日内涨跌幅数据
    """
    return get_fund_intraday(code)


@router.post("/intraday/batch", response_model=GetIntradayBatchResponse)
async def get_intraday_batch(request: GetIntradayBatchRequest):
    """
    批量获取多只基金的日内涨跌幅数据
    """
    data = get_funds_intraday_batch(request.codes)
    return GetIntradayBatchResponse(data=data)


@router.post("/intraday/clear", response_model=SaveIntradayResponse)
async def clear_intraday():
    """
    手动清零今日日内数据（一般不需要调用，系统会在每天9点自动清零）
    """
    success = clear_intraday_data()
    return SaveIntradayResponse(success=success)
