/**
 * 交易时间相关工具函数
 */

/**
 * 判断给定日期是否为工作日（周一到周五）
 * 注意：这里不考虑中国节假日，只做基础判断
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekday(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/**
 * 判断当前是否在交易时间内
 * 交易时间：工作日 9:30 - 15:00
 * @param {Date} date
 * @returns {boolean}
 */
export function isTradingTime(date = new Date()) {
  if (!isWeekday(date)) {
    return false;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  // 9:30 = 570 分钟, 15:00 = 900 分钟
  return time >= 570 && time <= 900;
}

/**
 * 判断当前是否在开盘前等待时间
 * 开盘前等待：工作日 9:00 - 9:30
 * @param {Date} date
 * @returns {boolean}
 */
export function isPreMarket(date = new Date()) {
  if (!isWeekday(date)) {
    return false;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  // 9:00 = 540 分钟, 9:30 = 570 分钟
  return time >= 540 && time < 570;
}

/**
 * 判断当前是否为新交易日的开始（需要重置数据）
 * 重置时间：工作日 9:00
 * @param {Date} date
 * @returns {boolean}
 */
export function isNewTradingDayStart(date = new Date()) {
  if (!isWeekday(date)) {
    return false;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return hours === 9 && minutes === 0;
}

/**
 * 判断估值时间是否为今日有效估值
 * @param {string} estimateTime - 估值时间字符串，格式如 "2024-01-15 14:30"
 * @param {Date} now - 当前时间
 * @returns {boolean}
 */
export function isEstimateTimeToday(estimateTime, now = new Date()) {
  if (!estimateTime) {
    return false;
  }

  // 解析估值时间
  const estimateDate = new Date(estimateTime.replace(/-/g, '/'));
  
  // 比较日期部分
  return (
    estimateDate.getFullYear() === now.getFullYear() &&
    estimateDate.getMonth() === now.getMonth() &&
    estimateDate.getDate() === now.getDate()
  );
}

/**
 * 判断是否应该显示当日收益
 * 只有在交易时间或收盘后（当天15:00之后），且估值时间是今天时才显示
 * @param {string} estimateTime - 估值时间字符串
 * @param {Date} now - 当前时间
 * @returns {boolean}
 */
export function shouldShowDailyProfit(estimateTime, now = new Date()) {
  // 如果不是工作日，不显示当日收益（显示为0或--）
  if (!isWeekday(now)) {
    return false;
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  // 9:00之前，不显示（等待新交易日开始）
  if (time < 540) {
    return false;
  }

  // 9:00 - 9:30 之间，开盘前等待，不显示
  if (time >= 540 && time < 570) {
    return false;
  }

  // 9:30 之后，检查估值时间是否为今天
  return isEstimateTimeToday(estimateTime, now);
}

/**
 * 获取交易状态描述
 * @param {Date} now
 * @returns {string}
 */
export function getTradingStatus(now = new Date()) {
  if (!isWeekday(now)) {
    return '休市';
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  if (time < 540) {
    return '盘前';
  }

  if (time >= 540 && time < 570) {
    return '待开盘';
  }

  if (time >= 570 && time <= 900) {
    return '交易中';
  }

  return '已收盘';
}

/**
 * 计算当日收益
 * @param {Object} params
 * @param {number} params.shares - 持有份额
 * @param {number} params.nav - 昨日净值
 * @param {number} params.estimateNav - 实时估值
 * @param {string} params.estimateTime - 估值时间
 * @returns {{ value: number|null, display: string }}
 */
export function calculateDailyProfit({ shares, nav, estimateNav, estimateTime }) {
  const now = new Date();

  // 检查是否应该显示当日收益
  if (!shouldShowDailyProfit(estimateTime, now)) {
    // 判断具体状态
    const status = getTradingStatus(now);
    
    if (status === '休市') {
      return { value: null, display: '--', status: '休市' };
    }
    
    if (status === '盘前') {
      return { value: null, display: '--', status: '盘前' };
    }
    
    if (status === '待开盘') {
      return { value: null, display: '待开盘', status: '待开盘' };
    }

    // 其他情况（如估值时间不是今天）
    return { value: null, display: '--', status: '数据更新中' };
  }

  // 正常计算当日收益
  if (!nav || !estimateNav || !shares) {
    return { value: 0, display: '¥0.00', status: '交易中' };
  }

  const change = estimateNav - nav;
  const profit = shares * change;

  return {
    value: Math.round(profit * 100) / 100,
    display: null, // 让组件自己格式化
    status: getTradingStatus(now),
  };
}
