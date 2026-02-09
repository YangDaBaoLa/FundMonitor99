"""
基金数据 API 路由
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime

from app.services.fund_service import fund_service
from app.models.fund import (
    FundRealtime,
    FundDetail,
    FundHolding,
    BatchRealtimeRequest,
    BatchRealtimeResponse,
)

router = APIRouter()


@router.get("/funds/search")
async def search_funds(
    keyword: str = Query(..., description="搜索关键词（代码/名称/简拼）"),
    limit: int = Query(20, ge=1, le=100, description="返回数量限制"),
):
    """
    搜索基金
    支持按代码、名称、简拼搜索
    """
    results = await fund_service.search_funds(keyword, limit)
    return {"funds": results, "count": len(results)}


@router.get("/funds/{code}/realtime", response_model=FundRealtime)
async def get_fund_realtime(code: str):
    """
    获取基金实时估值
    包含：基金名称、代码、上一交易日净值、实时估算净值、估算涨跌幅、所属板块
    """
    result = await fund_service.get_fund_realtime(code)
    if not result:
        raise HTTPException(status_code=404, detail=f"基金 {code} 不存在")
    return result


@router.post("/funds/realtime/batch", response_model=BatchRealtimeResponse)
async def get_funds_realtime_batch(request: BatchRealtimeRequest):
    """
    批量获取基金实时估值
    用于自选基金列表的批量刷新
    """
    if len(request.codes) > 100:
        raise HTTPException(status_code=400, detail="最多支持100只基金")

    funds = await fund_service.get_funds_realtime_batch(request.codes)
    return BatchRealtimeResponse(
        funds=funds, update_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )


@router.get("/funds/{code}/detail", response_model=FundDetail)
async def get_fund_detail(code: str):
    """
    获取基金详细信息
    包含：基金类型、管理公司、基金经理、规模、阶段涨幅等
    """
    result = await fund_service.get_fund_detail(code)
    if not result:
        raise HTTPException(status_code=404, detail=f"基金 {code} 不存在")
    return result


@router.get("/funds/{code}/holdings", response_model=list[FundHolding])
async def get_fund_holdings(code: str):
    """
    获取基金持仓信息（前十大持仓）
    包含：股票代码、名称、持仓占比
    """
    return await fund_service.get_fund_holdings(code)


@router.get("/funds/{code}/nav-history")
async def get_fund_nav_history(
    code: str,
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
):
    """
    获取基金历史净值数据
    用于绘制净值走势图
    """
    return await fund_service.get_fund_nav_history(
        code, page, per_page, start_date, end_date
    )


@router.post("/funds/calculate-holdings")
async def calculate_user_holdings(
    amount: float = Query(..., description="持有金额"),
    profit: float = Query(..., description="累计收益"),
    current_nav: float = Query(..., description="当前净值"),
):
    """
    计算用户持仓信息
    根据持有金额和累计收益，计算持有份额、成本、成本价
    """
    return fund_service.calculate_user_holdings(amount, profit, current_nav)


@router.post("/funds/calculate-daily-profit")
async def calculate_daily_profit(
    shares: float = Query(..., description="持有份额"),
    yesterday_nav: float = Query(..., description="昨日净值"),
    today_estimate_nav: float = Query(..., description="今日估算净值"),
):
    """
    计算当日收益（估算）
    根据持有份额和净值变化计算当日收益
    """
    return fund_service.calculate_daily_profit(
        shares, yesterday_nav, today_estimate_nav
    )
