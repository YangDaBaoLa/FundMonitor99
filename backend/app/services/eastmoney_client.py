"""
东方财富网 API 客户端
负责从东方财富网获取基金数据
"""

import httpx
import json
import re
from typing import Optional
from datetime import datetime
from cachetools import TTLCache
import asyncio

from app.config import settings


class EastMoneyClient:
    """东方财富网 API 客户端"""

    # API 端点
    FUND_ESTIMATE_URL = "https://fundgz.1234567.com.cn/js/{code}.js"
    FUND_LIST_URL = "https://fund.eastmoney.com/js/fundcode_search.js"
    FUND_DETAIL_URL = "https://fundf10.eastmoney.com/jbgk_{code}.html"
    FUND_NAV_HISTORY_URL = "https://api.fund.eastmoney.com/f10/lsjz"
    FUND_HOLDINGS_URL = "https://fundf10.eastmoney.com/FundArchivesDatas.aspx"
    # 股票实时行情 API
    STOCK_QUOTE_URL = "https://push2.eastmoney.com/api/qt/ulist.np/get"

    # 请求头
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://fund.eastmoney.com/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        # 内存缓存
        self._realtime_cache = TTLCache(maxsize=500, ttl=settings.CACHE_TTL_REALTIME)
        self._detail_cache = TTLCache(maxsize=200, ttl=settings.CACHE_TTL_DETAIL)
        self._list_cache = TTLCache(maxsize=1, ttl=settings.CACHE_TTL_LIST)
        self._history_cache = TTLCache(maxsize=100, ttl=settings.CACHE_TTL_HISTORY)

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.HEADERS,
                timeout=settings.REQUEST_TIMEOUT,
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        """关闭客户端"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def get_fund_estimate(self, code: str) -> Optional[dict]:
        """
        获取基金实时估值
        返回: {code, name, nav, nav_date, estimate_nav, estimate_change, estimate_time}
        """
        # 检查缓存
        cache_key = f"estimate_{code}"
        if cache_key in self._realtime_cache:
            return self._realtime_cache[cache_key]

        try:
            url = self.FUND_ESTIMATE_URL.format(code=code)
            response = await self.client.get(url)

            if response.status_code == 200:
                # 解析 JSONP 响应: jsonpgz({...});
                text = response.text
                match = re.search(r"jsonpgz\((.*?)\);?$", text)
                if match:
                    data = json.loads(match.group(1))
                    result = {
                        "code": data.get("fundcode", code),
                        "name": data.get("name", ""),
                        "nav": float(data.get("dwjz", 0)) if data.get("dwjz") else None,
                        "nav_date": data.get("jzrq", ""),
                        "estimate_nav": float(data.get("gsz", 0))
                        if data.get("gsz")
                        else None,
                        "estimate_change": float(data.get("gszzl", 0))
                        if data.get("gszzl")
                        else None,
                        "estimate_time": data.get("gztime", ""),
                    }
                    # 缓存结果
                    self._realtime_cache[cache_key] = result
                    return result
        except Exception as e:
            print(f"Error fetching estimate for {code}: {e}")

        return None

    async def get_fund_estimates_batch(self, codes: list[str]) -> list[dict]:
        """
        批量获取基金实时估值
        """
        tasks = [self.get_fund_estimate(code) for code in codes]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        valid_results = []
        for result in results:
            if isinstance(result, dict):
                valid_results.append(result)

        return valid_results

    async def get_fund_list(self) -> list[dict]:
        """
        获取所有基金列表
        返回: [{code, name, type}, ...]
        """
        cache_key = "fund_list"
        if cache_key in self._list_cache:
            return self._list_cache[cache_key]

        try:
            response = await self.client.get(self.FUND_LIST_URL)
            if response.status_code == 200:
                # 解析 JS 数据: var r = [[...], [...], ...];
                text = response.text
                match = re.search(r"var r = (\[.*?\]);", text, re.DOTALL)
                if match:
                    data = json.loads(match.group(1))
                    result = []
                    for item in data:
                        if len(item) >= 3:
                            result.append(
                                {
                                    "code": item[0],
                                    "abbr": item[1],  # 简拼
                                    "name": item[2],
                                    "type": item[3] if len(item) > 3 else "",
                                }
                            )
                    self._list_cache[cache_key] = result
                    return result
        except Exception as e:
            print(f"Error fetching fund list: {e}")

        return []

    async def search_funds(self, keyword: str, limit: int = 20) -> list[dict]:
        """
        搜索基金
        支持按代码、名称、简拼搜索
        """
        all_funds = await self.get_fund_list()
        keyword_lower = keyword.lower()

        matched = []
        for fund in all_funds:
            if (
                keyword_lower in fund["code"].lower()
                or keyword_lower in fund["name"].lower()
                or keyword_lower in fund.get("abbr", "").lower()
            ):
                matched.append(fund)
                if len(matched) >= limit:
                    break

        return matched

    async def get_fund_detail(self, code: str) -> Optional[dict]:
        """
        获取基金详细信息
        """
        cache_key = f"detail_{code}"
        if cache_key in self._detail_cache:
            return self._detail_cache[cache_key]

        try:
            # 获取基金详情页
            url = f"https://fund.eastmoney.com/{code}.html"
            response = await self.client.get(url)

            if response.status_code == 200:
                html = response.text

                # 解析基金名称
                name_match = re.search(
                    r'<div class="fundDetail-tit">\s*<div.*?>(.*?)</div>', html
                )
                name = name_match.group(1) if name_match else ""

                # 解析基金类型
                type_match = re.search(r"类型：\s*<a[^>]*>(.*?)</a>", html)
                fund_type = type_match.group(1) if type_match else ""

                # 解析规模
                scale_match = re.search(r"规模.*?(\d+\.?\d*)\s*亿元", html)
                scale = float(scale_match.group(1)) if scale_match else None

                # 解析基金经理
                manager_match = re.search(r"基金经理.*?<a[^>]*>(.*?)</a>", html)
                manager = manager_match.group(1) if manager_match else ""

                # 解析管理公司
                company_match = re.search(r"管 理 人.*?<a[^>]*>(.*?)</a>", html)
                company = company_match.group(1) if company_match else ""

                # 解析阶段涨幅
                changes = {}
                change_patterns = [
                    (r"近1月：</span><span[^>]*>([-\d.]+)%", "change_1m"),
                    (r"近3月：</span><span[^>]*>([-\d.]+)%", "change_3m"),
                    (r"近6月：</span><span[^>]*>([-\d.]+)%", "change_6m"),
                    (r"近1年：</span><span[^>]*>([-\d.]+)%", "change_1y"),
                    (r"近3年：</span><span[^>]*>([-\d.]+)%", "change_3y"),
                    (r"成立来：</span><span[^>]*>([-\d.]+)%", "change_since_establish"),
                ]

                for pattern, key in change_patterns:
                    match = re.search(pattern, html)
                    if match:
                        changes[key] = float(match.group(1))

                result = {
                    "code": code,
                    "name": name,
                    "type": fund_type,
                    "company": company,
                    "manager": manager,
                    "scale": scale,
                    **changes,
                }

                self._detail_cache[cache_key] = result
                return result

        except Exception as e:
            print(f"Error fetching detail for {code}: {e}")

        return None

    async def get_fund_holdings(self, code: str) -> list[dict]:
        """
        获取基金持仓信息（前十大持仓）
        """
        try:
            url = self.FUND_HOLDINGS_URL
            params = {
                "type": "jjcc",
                "code": code,
                "topline": 10,
            }
            response = await self.client.get(url, params=params)

            if response.status_code == 200:
                text = response.text
                holdings = []

                # 解析 HTML 表格数据
                # 匹配 tbody 中的行
                tbody_match = re.search(r"<tbody>(.*?)</tbody>", text, re.DOTALL)
                if tbody_match:
                    tbody = tbody_match.group(1)
                    rows = re.findall(r"<tr>(.*?)</tr>", tbody, re.DOTALL)

                    for row in rows:
                        # 提取股票名称 - 在 td class='tol' 中的 a 标签
                        name_match = re.search(
                            r"<td class='tol'><a[^>]*>([^<]+)</a></td>", row
                        )
                        if not name_match:
                            continue
                        stock_name = name_match.group(1).strip()

                        # 提取股票代码 - 第二个 td 中的 a 标签
                        code_match = re.search(r"<td><a[^>]*>(\d+)</a></td>", row)
                        stock_code = code_match.group(1) if code_match else ""

                        # 提取占净值比例 - td class='tor' 中包含百分比的
                        ratio_matches = re.findall(
                            r"<td class='tor'>([^<]*%?)</td>", row
                        )
                        ratio = 0
                        for match in ratio_matches:
                            if "%" in match:
                                try:
                                    ratio = float(match.replace("%", ""))
                                    break
                                except:
                                    pass

                        if stock_name:
                            holdings.append(
                                {
                                    "stock_name": stock_name,
                                    "stock_code": stock_code,
                                    "ratio": ratio,
                                }
                            )

                return holdings[:10]  # 只返回前10个

        except Exception as e:
            print(f"Error fetching holdings for {code}: {e}")

        return []

    async def get_fund_nav_history(
        self,
        code: str,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict:
        """
        获取基金历史净值
        """
        cache_key = f"history_{code}_{page}_{per_page}_{start_date}_{end_date}"
        if cache_key in self._history_cache:
            return self._history_cache[cache_key]

        try:
            url = self.FUND_NAV_HISTORY_URL
            params = {
                "fundCode": code,
                "pageIndex": page,
                "pageSize": per_page,
                "startDate": start_date or "",
                "endDate": end_date or "",
            }

            headers = {
                **self.HEADERS,
                "Referer": f"https://fundf10.eastmoney.com/jjjz_{code}.html",
            }

            response = await self.client.get(url, params=params, headers=headers)

            if response.status_code == 200:
                data = response.json()
                if data.get("ErrCode") == 0:
                    result = {
                        "total": data.get("TotalCount", 0),
                        "page": page,
                        "per_page": per_page,
                        "records": [],
                    }

                    for item in data.get("Data", {}).get("LSJZList", []):
                        result["records"].append(
                            {
                                "date": item.get("FSRQ", ""),
                                "nav": float(item.get("DWJZ", 0))
                                if item.get("DWJZ")
                                else None,
                                "acc_nav": float(item.get("LJJZ", 0))
                                if item.get("LJJZ")
                                else None,
                                "change": float(item.get("JZZZL", 0))
                                if item.get("JZZZL")
                                else None,
                            }
                        )

                    self._history_cache[cache_key] = result
                    return result

        except Exception as e:
            print(f"Error fetching NAV history for {code}: {e}")

        return {"total": 0, "page": page, "per_page": per_page, "records": []}

    async def get_stock_quotes(self, stock_codes: list[str]) -> dict[str, float]:
        """
        批量获取股票实时涨跌幅
        stock_codes: 股票代码列表，如 ['600519', '000858']
        返回: {stock_code: change_percent, ...}
        """
        if not stock_codes:
            return {}

        try:
            # 构建股票代码列表，需要加上市场前缀
            # 上海: 1.代码, 深圳: 0.代码
            secids = []
            for code in stock_codes:
                if code.startswith(("6", "5", "9")):  # 上海
                    secids.append(f"1.{code}")
                else:  # 深圳
                    secids.append(f"0.{code}")

            params = {
                "fltt": 2,
                "invt": 2,
                "fields": "f2,f3,f12,f14",  # f2:现价, f3:涨跌幅, f12:代码, f14:名称
                "secids": ",".join(secids),
            }

            response = await self.client.get(self.STOCK_QUOTE_URL, params=params)

            if response.status_code == 200:
                data = response.json()
                result = {}

                if data.get("data") and data["data"].get("diff"):
                    for item in data["data"]["diff"]:
                        code = item.get("f12", "")
                        change = item.get("f3")  # 涨跌幅
                        if code and change is not None:
                            result[code] = float(change)

                return result

        except Exception as e:
            print(f"Error fetching stock quotes: {e}")

        return {}

    async def get_fund_holdings_with_quotes(self, code: str) -> list[dict]:
        """
        获取基金持仓信息，包含股票实时涨跌幅
        """
        # 先获取持仓信息
        holdings = await self.get_fund_holdings(code)

        if not holdings:
            return []

        # 提取所有股票代码
        stock_codes = [h["stock_code"] for h in holdings if h.get("stock_code")]

        # 批量获取股票行情
        quotes = await self.get_stock_quotes(stock_codes)

        # 合并数据
        for holding in holdings:
            stock_code = holding.get("stock_code", "")
            holding["change"] = quotes.get(stock_code)

        return holdings

    async def get_fund_sector(self, code: str) -> Optional[str]:
        """
        获取基金所属板块（从基金名称关键词推断）
        """
        # 从基金名称推断板块
        detail = await self.get_fund_detail(code)
        if detail:
            name = detail.get("name", "")

            # 板块关键词映射（按优先级排序，更具体的关键词放前面）
            # 格式: (板块名称, [关键词列表])
            sector_keywords = [
                # 新能源细分
                ("光伏", ["光伏", "太阳能"]),
                ("锂电", ["锂电", "锂电池", "动力电池", "电池"]),
                ("储能", ["储能"]),
                (
                    "新能源车",
                    ["新能源车", "新能源汽车", "智能汽车", "智能驾驶", "电动车"],
                ),
                ("新能源", ["新能源", "清洁能源", "绿色能源", "碳中和"]),
                # 科技细分
                ("半导体", ["半导体", "芯片", "集成电路"]),
                ("人工智能", ["人工智能", "AI", "机器人", "智能制造"]),
                ("云计算", ["云计算", "大数据", "数据中心"]),
                ("软件", ["软件", "计算机", "信息技术"]),
                ("通信", ["通信", "5G", "物联网"]),
                ("互联网", ["互联网", "数字经济", "电子商务"]),
                ("电子", ["电子", "消费电子"]),
                ("科技", ["科技", "科创", "创新"]),
                # 医药细分
                ("创新药", ["创新药", "生物医药", "生物制药"]),
                ("医疗器械", ["医疗器械", "医疗设备"]),
                ("中药", ["中药", "中医"]),
                ("医疗服务", ["医疗服务", "医疗健康"]),
                ("医药", ["医药", "医疗", "生物", "健康", "养老"]),
                # 消费细分
                ("白酒", ["白酒", "酒"]),
                ("食品饮料", ["食品", "饮料", "乳业", "调味品"]),
                ("家电", ["家电", "家居"]),
                ("汽车", ["汽车", "整车"]),
                ("零售", ["零售", "商贸", "电商"]),
                ("旅游", ["旅游", "酒店", "餐饮", "免税"]),
                ("品牌消费", ["品牌", "奢侈品", "纺织服装"]),
                ("消费", ["消费", "内需"]),
                # 金融细分
                ("银行", ["银行"]),
                ("证券", ["证券", "券商", "非银"]),
                ("保险", ["保险"]),
                ("地产", ["地产", "房地产", "基建"]),
                ("金融", ["金融"]),
                # 制造细分
                ("高端制造", ["高端制造", "先进制造", "装备制造"]),
                ("机械", ["机械", "工程机械"]),
                ("化工", ["化工", "材料", "新材料", "稀土"]),
                ("钢铁", ["钢铁", "有色", "煤炭"]),
                ("制造", ["制造", "工业"]),
                # 军工细分
                ("航空航天", ["航空", "航天", "商业航天", "卫星"]),
                ("军工装备", ["军工装备", "国防装备"]),
                ("船舶", ["船舶", "海洋", "海工"]),
                ("军工", ["军工", "国防"]),
                # 农业细分
                ("养殖", ["养殖", "畜牧", "猪", "鸡"]),
                ("种植", ["种植", "种业", "粮食"]),
                ("农业", ["农业", "农产品"]),
                # 资源能源
                ("煤炭", ["煤炭"]),
                ("石油", ["石油", "油气", "天然气"]),
                ("电力", ["电力", "公用事业", "水电", "火电", "核电"]),
                ("资源", ["资源", "能源"]),
                # 其他主题
                ("港股", ["港股", "恒生", "H股"]),
                ("美股", ["美股", "纳斯达克", "标普"]),
                ("QDII", ["QDII", "海外", "全球"]),
                ("红利", ["红利", "高股息", "分红"]),
                ("价值", ["价值", "蓝筹", "龙头"]),
                ("成长", ["成长"]),
                ("量化", ["量化"]),
                ("指数", ["指数", "ETF", "LOF"]),
                ("债券", ["债券", "纯债", "信用债", "利率债", "可转债"]),
                ("货币", ["货币", "现金"]),
            ]

            # 按顺序匹配，返回第一个匹配的板块
            for sector, keywords in sector_keywords:
                for kw in keywords:
                    if kw in name:
                        return sector

        return "综合"


# 全局客户端实例
eastmoney_client = EastMoneyClient()
