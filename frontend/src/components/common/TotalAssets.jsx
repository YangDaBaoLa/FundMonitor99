/**
 * 资产总额显示组件
 * 显示用户的总资产，支持显示/隐藏切换
 */
import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatCurrency, getChangeColor } from '../../utils/format';

/**
 * 将数字转换为星号遮盖格式
 * @param {number} value - 金额
 * @returns {string} - 遮盖后的字符串
 */
function maskNumber(value) {
  // 格式化为带两位小数的字符串
  const formatted = value.toFixed(2);
  // 替换数字为星号，保留小数点
  return formatted.replace(/\d/g, '*');
}

function TotalAssets({ totalAmount, totalProfit, totalDailyProfit }) {
  const [isVisible, setIsVisible] = useLocalStorage('fund_assets_visible', true);

  // 计算收益率
  const totalCost = totalAmount - totalProfit;
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const dailyProfitRate = totalAmount > 0 ? (totalDailyProfit / totalAmount) * 100 : 0;

  // 切换显示状态
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="neu-card total-assets-card">
      <div className="total-assets-header">
        <h3 className="text-muted text-sm mb-xs">我的总资产</h3>
        <button 
          className="eye-toggle-btn"
          onClick={toggleVisibility}
          title={isVisible ? '隐藏金额' : '显示金额'}
        >
          {isVisible ? (
            // 睁眼图标
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          ) : (
            // 闭眼图标
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            </svg>
          )}
        </button>
      </div>

      <div className="total-assets-main">
        <motion.div 
          className="total-amount"
          key={isVisible ? 'visible' : 'hidden'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isVisible ? (
            <span className="amount-value">{formatCurrency(totalAmount)}</span>
          ) : (
            <span className="amount-masked">{maskNumber(totalAmount)}</span>
          )}
        </motion.div>
      </div>

      <div className="total-assets-details">
        <div className="detail-item">
          <span className="detail-label">累计收益</span>
          <span className={`detail-value ${getChangeColor(totalProfit)}`}>
            {isVisible ? formatCurrency(totalProfit, true) : maskNumber(Math.abs(totalProfit))}
          </span>
          <span className={`detail-rate ${getChangeColor(profitRate)}`}>
            ({isVisible ? (profitRate >= 0 ? '+' : '') + profitRate.toFixed(2) + '%' : '**.**%'})
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">今日收益</span>
          <span className={`detail-value ${getChangeColor(totalDailyProfit)}`}>
            {isVisible ? formatCurrency(totalDailyProfit, true) : maskNumber(Math.abs(totalDailyProfit))}
          </span>
          <span className={`detail-rate ${getChangeColor(dailyProfitRate)}`}>
            ({isVisible ? (dailyProfitRate >= 0 ? '+' : '') + dailyProfitRate.toFixed(2) + '%' : '**.**%'})
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(TotalAssets);
