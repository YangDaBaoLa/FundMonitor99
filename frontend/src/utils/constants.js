/**
 * 常量定义
 */

// API 配置 - 自动检测当前地址
const getApiBaseUrl = () => {
  // 如果是同源部署（打包后），使用相对路径
  if (window.location.port === '8000' || window.location.port === '') {
    return '/api';
  }
  // 开发环境，使用后端地址
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// 刷新间隔（毫秒）
export const REFRESH_INTERVAL = 5000;

// LocalStorage Keys
export const STORAGE_KEYS = {
  WATCHLIST: 'fund_monitor_watchlist',
  GROUPS: 'fund_monitor_groups',
  FUND_GROUPS: 'fund_monitor_fund_groups',
  SETTINGS: 'fund_monitor_settings',
  VERSION: 'fund_monitor_version',
  HIDE_AMOUNT: 'fund_monitor_hide_amount',
};

// 数据版本
export const DATA_VERSION = '1.0.0';

// 基金类型
export const FUND_TYPES = {
  STOCK: '股票型',
  MIXED: '混合型',
  BOND: '债券型',
  INDEX: '指数型',
  QDII: 'QDII',
  MONEY: '货币型',
};

// 板块列表
export const SECTORS = [
  '新能源',
  '科技',
  '医药',
  '消费',
  '金融',
  '制造',
  '军工',
  '农业',
  '综合',
];

// Avatar 预设
export const AVATAR_VARIANTS = [
  'marble',
  'beam',
  'pixel',
  'sunset',
  'ring',
  'bauhaus',
];

// 默认设置
export const DEFAULT_SETTINGS = {
  refreshInterval: REFRESH_INTERVAL,
  avatarVariant: 'beam',
  avatarName: 'Fund Monitor User',
};

// 阶段涨幅时间段
export const PERIOD_LABELS = {
  '1w': '近1周',
  '1m': '近1月',
  '3m': '近3月',
  '6m': '近6月',
  'ytd': '今年来',
  '1y': '近1年',
  '2y': '近2年',
  '3y': '近3年',
  'since': '成立来',
};
