/**
 * 格式化工具函数
 */

/**
 * 格式化数字为货币格式
 * @param {number} value - 数值
 * @param {boolean} showSign - 是否显示正负号
 * @returns {string}
 */
export function formatCurrency(value, showSign = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  const formatted = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (showSign) {
    return value >= 0 ? `+¥${formatted}` : `-¥${formatted}`;
  }
  
  return `¥${formatted}`;
}

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @param {boolean} showSign - 是否显示正负号
 * @returns {string}
 */
export function formatPercent(value, showSign = true) {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  const formatted = Math.abs(value).toFixed(2);
  
  if (showSign) {
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  }
  
  return `${formatted}%`;
}

/**
 * 格式化净值
 * @param {number} value - 净值
 * @returns {string}
 */
export function formatNav(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  return value.toFixed(4);
}

/**
 * 格式化份额
 * @param {number} value - 份额
 * @returns {string}
 */
export function formatShares(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 格式化规模（亿元）
 * @param {number} value - 规模
 * @returns {string}
 */
export function formatScale(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  return `${value.toFixed(2)}亿`;
}

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '--';
  
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化时间
 * @param {string} timeStr - 时间字符串
 * @returns {string}
 */
export function formatTime(timeStr) {
  if (!timeStr) return '--';
  
  // 如果是 HH:MM 格式
  if (timeStr.match(/^\d{2}:\d{2}$/)) {
    return timeStr;
  }
  
  // 如果是完整日期时间
  const date = new Date(timeStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 获取涨跌颜色类名
 * @param {number} value - 数值
 * @returns {string}
 */
export function getChangeColor(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  return value >= 0 ? 'text-up' : 'text-down';
}

/**
 * 获取涨跌背景色
 * @param {number} value - 数值
 * @returns {string}
 */
export function getChangeBgColor(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'transparent';
  }
  
  return value >= 0 
    ? 'rgba(229, 62, 62, 0.1)' 
    : 'rgba(56, 161, 105, 0.1)';
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 防抖函数
 * @param {Function} fn - 函数
 * @param {number} delay - 延迟时间
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 函数
 * @param {number} limit - 限制时间
 * @returns {Function}
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
