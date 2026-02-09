import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { useFundContext } from '../../store/context/FundContext';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/format';
import { AnimatedNumber } from '../common/AnimatedNumber';

function AssetSummary() {
  const { totalProfit, hideAmount, toggleHideAmount } = useFundContext();

  const {
    realtimeTotalAsset = 0,
    totalDailyProfit = 0,
    totalDailyProfitRate = 0,
    totalProfit: totalGain = 0,
    totalProfitRate = 0
  } = totalProfit || {};

  // 格式化函数：如果是隐藏模式，返回对应长度的星号
  const formatValue = (value, formatter) => {
    if (hideAmount) {
      // 简单处理：根据数字大小显示大致长度的星号，或者固定显示 *****
      // 为了美观，这里使用固定长度
      return '****';
    }
    return formatter(value);
  };

  const formatValueWithSign = (value, formatter) => {
    if (hideAmount) return '****';
    const text = formatter(value);
    return value > 0 ? `+${text}` : text;
  };

  return (
    <div className="neu-card p-md mb-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        
        {/* 总资产 */}
        <div className="flex-1">
          <div className="flex items-center gap-sm mb-xs">
            <span className="text-muted text-sm font-medium">总资产</span>
            <button 
              onClick={toggleHideAmount}
              className="text-muted hover:text-primary transition-colors focus:outline-none"
              title={hideAmount ? "显示金额" : "隐藏金额"}
            >
              {hideAmount ? (
                <EyeSlash size={16} weight="bold" />
              ) : (
                <Eye size={16} weight="bold" />
              )}
            </button>
          </div>
          
          <div className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
            {hideAmount ? (
              <span className="font-mono">*****.**</span>
            ) : (
              <AnimatedNumber value={realtimeTotalAsset} formatter={val => formatCurrency(val, false)} />
            )}
          </div>
        </div>

        {/* 收益信息 */}
        <div className="flex gap-xl">
          {/* 当日收益 */}
          <div>
            <div className="text-muted text-xs mb-1">当日收益</div>
            <div className={`text-lg font-bold ${getChangeColor(totalDailyProfit)}`}>
              {hideAmount ? '****' : (
                <>
                  {totalDailyProfit > 0 ? '+' : ''}
                  <AnimatedNumber value={totalDailyProfit} formatter={val => formatCurrency(val, true)} />
                </>
              )}
            </div>
            <div className={`text-xs font-medium ${getChangeColor(totalDailyProfitRate)}`}>
              {hideAmount ? '****' : (
                <>
                  {totalDailyProfitRate > 0 ? '+' : ''}
                  <AnimatedNumber value={totalDailyProfitRate} formatter={val => formatPercent(val)} />
                </>
              )}
            </div>
          </div>

          {/* 累计收益 */}
          <div>
            <div className="text-muted text-xs mb-1">累计收益</div>
            <div className={`text-lg font-bold ${getChangeColor(totalGain)}`}>
              {hideAmount ? '****' : (
                <>
                  {totalGain > 0 ? '+' : ''}
                  <AnimatedNumber value={totalGain} formatter={val => formatCurrency(val, true)} />
                </>
              )}
            </div>
            <div className={`text-xs font-medium ${getChangeColor(totalProfitRate)}`}>
              {hideAmount ? '****' : (
                <>
                  {totalProfitRate > 0 ? '+' : ''}
                  <AnimatedNumber value={totalProfitRate} formatter={val => formatPercent(val)} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AssetSummary);
