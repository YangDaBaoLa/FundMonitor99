/**
 * 基金详情抽屉组件
 * 从右侧滑入，显示基金完整详情
 */
import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { getFundDetail, getFundHoldings, getFundNavHistory } from '../../services/fundService';
import { AnimatedPercent } from '../common/AnimatedNumber';
import { 
  formatNav, formatPercent, formatCurrency, 
  formatScale, formatDate, getChangeColor 
} from '../../utils/format';

function FundDetailDrawer({ fund, realtime, isOpen, onClose, totalAsset = 0 }) {
  const [detail, setDetail] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [navHistory, setNavHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载详情数据
  useEffect(() => {
    if (isOpen && fund?.code) {
      loadData();
    }
  }, [isOpen, fund?.code]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detailRes, holdingsRes, historyRes] = await Promise.all([
        getFundDetail(fund.code),
        getFundHoldings(fund.code),
        getFundNavHistory(fund.code, { per_page: 30 }),
      ]);
      setDetail(detailRes);
      setHoldings(holdingsRes);
      setNavHistory(historyRes.records || []);
    } catch (error) {
      console.error('Failed to load fund detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算用户持仓信息
  const userHoldings = fund ? {
    amount: fund.amount,
    profit: fund.profit,
    shares: fund.shares,
    cost: fund.cost,
    costPrice: fund.costPrice,
    dailyProfit: realtime?.estimate_nav && realtime?.nav
      ? fund.shares * (realtime.estimate_nav - realtime.nav)
      : 0,
    profitRate: fund.cost > 0 
      ? ((fund.amount - fund.cost) / fund.cost) * 100 
      : 0,
  } : null;

  // 计算当前基金实时价值
  const currentFundValue = (realtime?.estimate_nav && fund?.shares) 
    ? fund.shares * realtime.estimate_nav 
    : (userHoldings?.amount || 0);

  // 使用传入的总资产（如果有），否则使用当前基金价值（防止分母为0）
  // 确保 totalAsset 至少包含当前基金价值
  const safeTotalAsset = Math.max(totalAsset, currentFundValue);

  // 计算占比
  const currentFundRatio = safeTotalAsset > 0 ? ((currentFundValue / safeTotalAsset) * 100) : 0;

  // 计算持仓占比饼图数据
  const pieChartData = userHoldings ? [
    {
      name: `${fund?.name || '该基金'}`,
      value: Math.round(currentFundValue * 100) / 100,
      itemStyle: { color: '#6C63FF' },
    },
    {
      name: '其他基金',
      value: Math.max(0, Math.round((safeTotalAsset - currentFundValue) * 100) / 100),
      itemStyle: { color: '#E0E5EC' },
    },
  ] : [];

  // 持仓占比饼图配置
  const pieChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {d}% ({c}元)',
      backgroundColor: '#E0E5EC',
      borderColor: 'transparent',
      textStyle: { color: '#3D4852' },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: pieChartData.map(item => item.name),
      textStyle: {
        fontSize: 11,
        color: '#6B7280',
      },
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold',
          formatter: '{d}%',
        },
      },
      labelLine: {
        show: false,
      },
      data: pieChartData,
    }],
  };

  // 净值走势图配置
  const chartOption = {
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50,
    },
    xAxis: {
      type: 'category',
      data: navHistory.map(item => item.date).reverse(),
      axisLabel: {
        fontSize: 10,
        color: '#6B7280',
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10,
        color: '#6B7280',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(163, 177, 198, 0.3)',
          type: 'dashed',
        },
      },
    },
    series: [{
      type: 'line',
      data: navHistory.map(item => item.nav).reverse(),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2,
        color: '#6C63FF',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(108, 99, 255, 0.3)' },
            { offset: 1, color: 'rgba(108, 99, 255, 0.05)' },
          ],
        },
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#E0E5EC',
      borderColor: 'transparent',
      textStyle: { color: '#3D4852' },
      formatter: (params) => {
        const data = params[0];
        return `${data.name}<br/>净值: ${data.value?.toFixed(4)}`;
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 抽屉面板 */}
          <motion.div
            className="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loading-spinner" />
              </div>
            ) : (
              <div className="flex flex-col gap-lg">
                {/* 基金名称和代码 */}
                <div>
                  <h2 className="font-bold mb-xs">{fund?.name || realtime?.name}</h2>
                  <div className="flex items-center gap-sm">
                    <span className="text-muted">{fund?.code}</span>
                    {realtime?.sector && (
                      <span className="neu-tag">{realtime.sector}</span>
                    )}
                  </div>
                </div>

                {/* 实时数据区 */}
                <div className="neu-card-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-muted text-sm">当日涨幅（估算）</div>
                      <div className={`text-2xl font-bold ${getChangeColor(realtime?.estimate_change)}`}>
                        <AnimatedPercent value={realtime?.estimate_change || 0} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted text-sm">实时估值</div>
                      <div className="text-xl font-semibold">
                        {formatNav(realtime?.estimate_nav)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 用户持仓信息 */}
                {userHoldings && (
                  <div className="neu-inset">
                    <h4 className="font-semibold mb-md">我的持仓</h4>
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <div className="text-muted text-sm">持有金额</div>
                        <div className="font-semibold">{formatCurrency(userHoldings.amount)}</div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">持有份额</div>
                        <div className="font-semibold">{userHoldings.shares?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">累计收益</div>
                        <div className={`font-semibold ${getChangeColor(userHoldings.profit)}`}>
                          {formatCurrency(userHoldings.profit, true)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">收益率</div>
                        <div className={`font-semibold ${getChangeColor(userHoldings.profitRate)}`}>
                          {formatPercent(userHoldings.profitRate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">当日收益（估算）</div>
                        <div className={`font-semibold ${getChangeColor(userHoldings.dailyProfit)}`}>
                          {formatCurrency(userHoldings.dailyProfit, true)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">持仓成本</div>
                        <div className="font-semibold">{formatCurrency(userHoldings.cost)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 持仓占比 */}
                {userHoldings && safeTotalAsset > 0 && (
                  <div className="neu-inset">
                    <h4 className="font-semibold mb-md">持仓占比</h4>
                    <div className="flex flex-col items-center">
                      <div className="text-center mb-sm">
                        <div className="text-muted text-sm">该基金占总资产比例</div>
                        <div className="text-2xl font-bold" style={{ color: '#6C63FF' }}>
                          {currentFundRatio.toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ height: 200, width: '100%' }}>
                        <ReactECharts
                          option={pieChartOption}
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 阶段涨幅 */}
                {detail && (
                  <div className="neu-inset">
                    <h4 className="font-semibold mb-md">阶段涨幅</h4>
                    <div className="grid grid-cols-3 gap-sm">
                      {[
                        { key: '1m', label: '近1月', value: detail.change_1m },
                        { key: '3m', label: '近3月', value: detail.change_3m },
                        { key: '6m', label: '近6月', value: detail.change_6m },
                        { key: '1y', label: '近1年', value: detail.change_1y },
                        { key: '3y', label: '近3年', value: detail.change_3y },
                        { key: 'since', label: '成立来', value: detail.change_since_establish },
                      ].map((item) => (
                        <div key={item.key} className="text-center p-sm">
                          <div className="text-muted text-sm">{item.label}</div>
                          <div className={`font-semibold ${getChangeColor(item.value)}`}>
                            {formatPercent(item.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 净值走势图 */}
                {navHistory.length > 0 && (
                  <div className="neu-inset">
                    <h4 className="font-semibold mb-md">净值走势</h4>
                    <ReactECharts
                      option={chartOption}
                      style={{ height: 200 }}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                )}

                {/* 重仓持股 */}
                {holdings.length > 0 && (
                  <div className="neu-inset">
                    <h4 className="font-semibold mb-md">重仓持股</h4>
                    <div className="holdings-list">
                      {holdings.map((item, index) => (
                        <div key={index} className="holdings-item">
                          <div className="holdings-info">
                            <div className="holdings-name">{item.stock_name}</div>
                            <div className="holdings-code">{item.stock_code}</div>
                          </div>
                          <div className="holdings-ratio">
                            {item.ratio > 0 ? `${item.ratio.toFixed(2)}%` : '--'}
                          </div>
                          <div className={`holdings-change ${item.change >= 0 ? 'text-up' : 'text-down'}`}>
                            {item.change !== null && item.change !== undefined 
                              ? `${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%`
                              : '--'
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(FundDetailDrawer);
