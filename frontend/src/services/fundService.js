/**
 * API 服务 - 基金数据
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

/**
 * 搜索基金
 * @param {string} keyword - 搜索关键词
 * @param {number} limit - 返回数量限制
 * @returns {Promise<{funds: Array, count: number}>}
 */
export async function searchFunds(keyword, limit = 20) {
  return api.get('/funds/search', {
    params: { keyword, limit },
  });
}

/**
 * 获取单只基金实时估值
 * @param {string} code - 基金代码
 * @returns {Promise<Object>}
 */
export async function getFundRealtime(code) {
  return api.get(`/funds/${code}/realtime`);
}

/**
 * 批量获取基金实时估值
 * @param {string[]} codes - 基金代码列表
 * @returns {Promise<{funds: Array, update_time: string}>}
 */
export async function getFundsRealtimeBatch(codes) {
  return api.post('/funds/realtime/batch', { codes });
}

/**
 * 获取基金详情
 * @param {string} code - 基金代码
 * @returns {Promise<Object>}
 */
export async function getFundDetail(code) {
  return api.get(`/funds/${code}/detail`);
}

/**
 * 获取基金持仓
 * @param {string} code - 基金代码
 * @returns {Promise<Array>}
 */
export async function getFundHoldings(code) {
  return api.get(`/funds/${code}/holdings`);
}

/**
 * 获取基金历史净值
 * @param {string} code - 基金代码
 * @param {Object} params - 查询参数
 * @returns {Promise<{total: number, page: number, per_page: number, records: Array}>}
 */
export async function getFundNavHistory(code, params = {}) {
  return api.get(`/funds/${code}/nav-history`, { params });
}

/**
 * 计算用户持仓信息
 * @param {number} amount - 持有金额
 * @param {number} profit - 累计收益
 * @param {number} currentNav - 当前净值
 * @returns {Promise<{shares: number, cost: number, cost_price: number}>}
 */
export async function calculateUserHoldings(amount, profit, currentNav) {
  return api.post('/funds/calculate-holdings', null, {
    params: { amount, profit, current_nav: currentNav },
  });
}

/**
 * 计算当日收益
 * @param {number} shares - 持有份额
 * @param {number} yesterdayNav - 昨日净值
 * @param {number} todayEstimateNav - 今日估算净值
 * @returns {Promise<{daily_profit: number, daily_profit_rate: number}>}
 */
export async function calculateDailyProfit(shares, yesterdayNav, todayEstimateNav) {
  return api.post('/funds/calculate-daily-profit', null, {
    params: {
      shares,
      yesterday_nav: yesterdayNav,
      today_estimate_nav: todayEstimateNav,
    },
  });
}

// ==================== 用户数据 API ====================

/**
 * 获取自选基金列表
 * @returns {Promise<{watchlist: Array}>}
 */
export async function getWatchlist() {
  return api.get('/userdata/watchlist');
}

/**
 * 添加自选基金
 * @param {Object} fund - 基金数据
 * @returns {Promise<{fund: Object}>}
 */
export async function addWatchlistFund(fund) {
  return api.post('/userdata/watchlist', fund);
}

/**
 * 删除自选基金
 * @param {string} fundId - 基金ID
 * @returns {Promise<{success: boolean}>}
 */
export async function removeWatchlistFund(fundId) {
  return api.delete(`/userdata/watchlist/${fundId}`);
}

/**
 * 更新自选基金
 * @param {string} fundId - 基金ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<{fund: Object}>}
 */
export async function updateWatchlistFund(fundId, updates) {
  return api.patch(`/userdata/watchlist/${fundId}`, updates);
}

/**
 * 移动基金到分组
 * @param {string} fundId - 基金ID
 * @param {string} groupId - 分组ID
 * @returns {Promise<{success: boolean}>}
 */
export async function moveFundToGroup(fundId, groupId) {
  return api.post(`/userdata/watchlist/${fundId}/move`, { groupId });
}

/**
 * 获取分组列表
 * @returns {Promise<{groups: Array}>}
 */
export async function getGroups() {
  return api.get('/userdata/groups');
}

/**
 * 创建分组
 * @param {string} name - 分组名称
 * @returns {Promise<{group: Object}>}
 */
export async function createGroup(name) {
  return api.post('/userdata/groups', { name });
}

/**
 * 删除分组
 * @param {string} groupId - 分组ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteGroup(groupId) {
  return api.delete(`/userdata/groups/${groupId}`);
}

/**
 * 重命名分组
 * @param {string} groupId - 分组ID
 * @param {string} name - 新名称
 * @returns {Promise<{group: Object}>}
 */
export async function renameGroup(groupId, name) {
  return api.patch(`/userdata/groups/${groupId}`, { name });
}

/**
 * 获取设置
 * @returns {Promise<{settings: Object}>}
 */
export async function getSettings() {
  return api.get('/userdata/settings');
}

/**
 * 更新设置
 * @param {string} key - 设置键
 * @param {any} value - 设置值
 * @returns {Promise<{settings: Object}>}
 */
export async function updateSetting(key, value) {
  return api.patch('/userdata/settings', { key, value });
}

// ==================== 日内涨跌幅 API ====================

/**
 * 保存日内涨跌幅数据
 * @param {Object} changes - {code: change, ...}
 * @returns {Promise<{success: boolean}>}
 */
export async function saveIntradayChanges(changes) {
  return api.post('/intraday/save', { changes });
}

/**
 * 获取单只基金的日内涨跌幅数据
 * @param {string} code - 基金代码
 * @returns {Promise<Array<{time: string, change: number}>>}
 */
export async function getIntradayData(code) {
  return api.get(`/intraday/${code}`);
}

/**
 * 批量获取多只基金的日内涨跌幅数据
 * @param {string[]} codes - 基金代码列表
 * @returns {Promise<{data: Object}>}
 */
export async function getIntradayDataBatch(codes) {
  return api.post('/intraday/batch', { codes });
}

export default api;
