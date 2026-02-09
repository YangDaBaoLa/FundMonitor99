/**
 * 基金数据 Context
 * 管理全局基金实时数据状态
 */
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { getFundsRealtimeBatch, getSettings, updateSetting } from '../../services/fundService';
import { usePolling } from '../../hooks/usePolling';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { REFRESH_INTERVAL, STORAGE_KEYS } from '../../utils/constants';

const FundContext = createContext(null);

// 获取本地日期字符串
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function FundProvider({ children }) {
  const [realtimeData, setRealtimeData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  
  // 隐私模式：隐藏金额
  const [hideAmount, setHideAmount] = useLocalStorage(STORAGE_KEYS.HIDE_AMOUNT, false);

  const toggleHideAmount = useCallback(() => {
    setHideAmount(prev => !prev);
  }, [setHideAmount]);

  // 应用设置
  const [appName, setAppName] = useState('FM99');
  const [avatar, setAvatar] = useState({ type: 'preset', value: '1' });

  // 初始化时从后端加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getSettings();
        if (response.settings?.appName) {
          setAppName(response.settings.appName);
        }
        if (response.settings?.avatar) {
          setAvatar(response.settings.avatar);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  // 更新应用名称
  const updateAppName = useCallback(async (newName) => {
    try {
      await updateSetting('appName', newName);
      setAppName(newName);
    } catch (err) {
      console.error('Failed to update app name:', err);
    }
  }, []);

  // 更新头像
  const updateAvatar = useCallback(async (newAvatar) => {
    try {
      await updateSetting('avatar', newAvatar);
      setAvatar(newAvatar);
    } catch (err) {
      console.error('Failed to update avatar:', err);
    }
  }, []);

  const {
    watchlist,
    groups,
    addFund,
    removeFund,
    updateFund,
    moveFundToGroup,
    createGroup,
    deleteGroup,
    renameGroup,
    reorderGroups,
    isFundAdded,
    getFundsByGroup,
    getAllCodes,
    calculateTotalProfit,
    calculateGroupProfit,
  } = useWatchlist();

  // 刷新实时数据
  const refreshRealtimeData = useCallback(async () => {
    if (getAllCodes.length === 0) {
      return;
    }

    const today = getLocalDateString();

    // 检查日期是否变化，如果变化则清除实时数据缓存
    if (lastUpdateDate && lastUpdateDate !== today) {
      console.log('日期变化，清除实时数据缓存');
      setRealtimeData({});
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getFundsRealtimeBatch(getAllCodes);
      
      // 转换为 Map 结构
      const dataMap = {};
      response.funds.forEach((fund) => {
        dataMap[fund.code] = fund;
      });

      setRealtimeData(dataMap);
      setLastUpdateTime(response.update_time);
      setLastUpdateDate(today);
    } catch (err) {
      console.error('Failed to fetch realtime data:', err);
      setError(err.message || '获取实时数据失败');
    } finally {
      setLoading(false);
    }
  }, [getAllCodes, lastUpdateDate]);

  // 轮询
  const { isPolling, countdown, refresh } = usePolling(
    refreshRealtimeData,
    REFRESH_INTERVAL,
    true
  );

  // 计算总收益
  const totalProfit = useMemo(() => {
    return calculateTotalProfit(realtimeData);
  }, [calculateTotalProfit, realtimeData]);

  // 获取分组收益
  const getGroupProfit = useCallback((groupId) => {
    return calculateGroupProfit(groupId, realtimeData);
  }, [calculateGroupProfit, realtimeData]);

  // 获取单只基金的完整数据（合并自选数据和实时数据）
  const getFundFullData = useCallback((fundId) => {
    const fund = watchlist.find((f) => f.id === fundId);
    if (!fund) return null;

    const realtime = realtimeData[fund.code] || {};
    
    // 计算当日收益
    let dailyProfit = 0;
    let dailyProfitRate = 0;
    
    // 只有在有实时估值时才计算当日收益
    // 实时估值从 9:30 开始更新
    if (realtime.nav && realtime.estimate_nav && realtime.estimate_nav > 0) {
      const dailyChange = realtime.estimate_nav - realtime.nav;
      dailyProfit = fund.shares * dailyChange;
      dailyProfitRate = (dailyChange / realtime.nav) * 100;
    }

    // 计算实时持有金额
    const currentAmount = realtime.estimate_nav 
      ? fund.shares * realtime.estimate_nav 
      : fund.amount;

    // 计算实时收益
    const currentProfit = currentAmount - fund.cost;
    const currentProfitRate = fund.cost > 0 
      ? (currentProfit / fund.cost) * 100 
      : 0;

    return {
      ...fund,
      ...realtime,
      currentAmount: Math.round(currentAmount * 100) / 100,
      currentProfit: Math.round(currentProfit * 100) / 100,
      currentProfitRate: Math.round(currentProfitRate * 100) / 100,
      dailyProfit: Math.round(dailyProfit * 100) / 100,
      dailyProfitRate: Math.round(dailyProfitRate * 100) / 100,
    };
  }, [watchlist, realtimeData]);

  const value = {
    // 状态
    watchlist,
    groups,
    realtimeData,
    loading,
    error,
    lastUpdateTime,
    isPolling,
    countdown,
    totalProfit,

    // 操作
    addFund,
    removeFund,
    updateFund,
    moveFundToGroup,
    createGroup,
    deleteGroup,
    renameGroup,
    reorderGroups,
    isFundAdded,
    getFundsByGroup,
    getGroupProfit,
    getFundFullData,
    refresh,
    hideAmount,
    toggleHideAmount,
    appName,
    updateAppName,
    avatar,
    updateAvatar,
  };

  return (
    <FundContext.Provider value={value}>
      {children}
    </FundContext.Provider>
  );
}

export function useFundContext() {
  const context = useContext(FundContext);
  if (!context) {
    throw new Error('useFundContext must be used within a FundProvider');
  }
  return context;
}

export default FundContext;
