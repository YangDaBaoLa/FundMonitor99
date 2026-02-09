"""
Fund Data Models
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FundBasic(BaseModel):
    """基金基本信息"""

    code: str  # 基金代码
    name: str  # 基金名称
    type: Optional[str] = None  # 基金类型


class FundRealtime(BaseModel):
    """基金实时估值数据"""

    code: str
    name: str
    nav: Optional[float] = None  # 上一交易日净值 (dwjz)
    nav_date: Optional[str] = None  # 净值日期
    estimate_nav: Optional[float] = None  # 估算净值 (gsz)
    estimate_change: Optional[float] = None  # 估算涨跌幅 % (gszzl)
    estimate_time: Optional[str] = None  # 估算时间
    sector: Optional[str] = None  # 所属板块（从重仓行业提取）


class FundDetail(BaseModel):
    """基金详细信息"""

    code: str
    name: str
    type: Optional[str] = None
    risk_level: Optional[str] = None  # 风险等级
    company: Optional[str] = None  # 管理公司
    manager: Optional[str] = None  # 基金经理
    establish_date: Optional[str] = None  # 成立日期
    scale: Optional[float] = None  # 规模（亿元）
    nav: Optional[float] = None  # 单位净值
    acc_nav: Optional[float] = None  # 累计净值

    # 阶段涨幅
    change_1w: Optional[float] = None  # 近1周
    change_1m: Optional[float] = None  # 近1月
    change_3m: Optional[float] = None  # 近3月
    change_6m: Optional[float] = None  # 近6月
    change_ytd: Optional[float] = None  # 今年来
    change_1y: Optional[float] = None  # 近1年
    change_2y: Optional[float] = None  # 近2年
    change_3y: Optional[float] = None  # 近3年
    change_since_establish: Optional[float] = None  # 成立来

    # 排名
    rank_in_category: Optional[str] = None  # 同类排名
    quartile: Optional[str] = None  # 四分位排名


class FundHolding(BaseModel):
    """基金持仓信息"""

    stock_code: str  # 股票代码
    stock_name: str  # 股票名称
    ratio: float  # 持仓占比 %
    change: Optional[float] = None  # 涨跌幅 %
    industry: Optional[str] = None  # 所属行业


class FundNavHistory(BaseModel):
    """历史净值数据"""

    date: str
    nav: float  # 单位净值
    acc_nav: Optional[float] = None  # 累计净值
    change: Optional[float] = None  # 日涨跌幅


class UserFundHolding(BaseModel):
    """用户持仓信息"""

    code: str  # 基金代码
    amount: float  # 持有金额
    profit: float  # 累计收益
    shares: Optional[float] = None  # 持有份额（自动计算）
    cost: Optional[float] = None  # 持仓成本（自动计算）
    cost_price: Optional[float] = None  # 成本价（自动计算）
    added_at: Optional[str] = None  # 添加时间


class BatchRealtimeRequest(BaseModel):
    """批量获取实时数据请求"""

    codes: list[str]


class BatchRealtimeResponse(BaseModel):
    """批量获取实时数据响应"""

    funds: list[FundRealtime]
    update_time: str
