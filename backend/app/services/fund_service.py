"""
基金数据服务
整合东方财富 API 客户端，提供业务逻辑
"""

from typing import Optional
from datetime import datetime

from app.services.eastmoney_client import eastmoney_client
from app.models.fund import (
    FundRealtime,
    FundDetail,
    FundHolding,
    FundNavHistory,
    UserFundHolding,
)


class FundService:
    """基金数据服务"""

    def __init__(self):
        self.client = eastmoney_client

    async def get_fund_realtime(self, code: str) -> Optional[FundRealtime]:
        """获取基金实时估值"""
        data = await self.client.get_fund_estimate(code)
        if not data:
            return None

        # 获取板块信息
        sector = await self.client.get_fund_sector(code)

        return FundRealtime(
            code=data["code"],
            name=data["name"],
            nav=data.get("nav"),
            nav_date=data.get("nav_date"),
            estimate_nav=data.get("estimate_nav"),
            estimate_change=data.get("estimate_change"),
            estimate_time=data.get("estimate_time"),
            sector=sector,
        )

    async def get_funds_realtime_batch(self, codes: list[str]) -> list[FundRealtime]:
        """批量获取基金实时估值"""
        results = await self.client.get_fund_estimates_batch(codes)

        funds = []
        for data in results:
            sector = await self.client.get_fund_sector(data["code"])
            funds.append(
                FundRealtime(
                    code=data["code"],
                    name=data["name"],
                    nav=data.get("nav"),
                    nav_date=data.get("nav_date"),
                    estimate_nav=data.get("estimate_nav"),
                    estimate_change=data.get("estimate_change"),
                    estimate_time=data.get("estimate_time"),
                    sector=sector,
                )
            )

        return funds

    async def search_funds(self, keyword: str, limit: int = 20) -> list[dict]:
        """搜索基金"""
        return await self.client.search_funds(keyword, limit)

    async def get_fund_detail(self, code: str) -> Optional[FundDetail]:
        """获取基金详情"""
        data = await self.client.get_fund_detail(code)
        if not data:
            return None

        return FundDetail(
            code=data["code"],
            name=data["name"],
            type=data.get("type"),
            company=data.get("company"),
            manager=data.get("manager"),
            scale=data.get("scale"),
            change_1m=data.get("change_1m"),
            change_3m=data.get("change_3m"),
            change_6m=data.get("change_6m"),
            change_1y=data.get("change_1y"),
            change_3y=data.get("change_3y"),
            change_since_establish=data.get("change_since_establish"),
        )

    async def get_fund_holdings(self, code: str) -> list[FundHolding]:
        """获取基金持仓（包含实时涨跌幅）"""
        data = await self.client.get_fund_holdings_with_quotes(code)

        holdings = []
        for item in data:
            holdings.append(
                FundHolding(
                    stock_code=item.get("stock_code", ""),
                    stock_name=item.get("stock_name", ""),
                    ratio=item.get("ratio", 0),
                    change=item.get("change"),
                    industry=item.get("industry"),
                )
            )

        return holdings

    async def get_fund_nav_history(
        self,
        code: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict:
        """获取历史净值"""
        return await self.client.get_fund_nav_history(
            code, page, per_page, start_date, end_date
        )

    def calculate_user_holdings(
        self, amount: float, profit: float, current_nav: float
    ) -> dict:
        """
        计算用户持仓信息

        Args:
            amount: 持有金额
            profit: 累计收益
            current_nav: 当前净值

        Returns:
            包含持有份额、成本、成本价的字典
        """
        cost = amount - profit  # 持仓成本 = 持有金额 - 累计收益
        shares = amount / current_nav if current_nav > 0 else 0  # 持有份额
        cost_price = cost / shares if shares > 0 else 0  # 成本价

        return {
            "shares": round(shares, 2),
            "cost": round(cost, 2),
            "cost_price": round(cost_price, 4),
        }

    def calculate_daily_profit(
        self, shares: float, yesterday_nav: float, today_estimate_nav: float
    ) -> dict:
        """
        计算当日收益（估算）

        Args:
            shares: 持有份额
            yesterday_nav: 昨日净值
            today_estimate_nav: 今日估算净值

        Returns:
            包含当日收益和收益率的字典
        """
        if yesterday_nav <= 0:
            return {"daily_profit": 0, "daily_profit_rate": 0}

        daily_change = today_estimate_nav - yesterday_nav
        daily_profit = shares * daily_change
        daily_profit_rate = (daily_change / yesterday_nav) * 100

        return {
            "daily_profit": round(daily_profit, 2),
            "daily_profit_rate": round(daily_profit_rate, 2),
        }


# 全局服务实例
fund_service = FundService()
