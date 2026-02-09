/**
 * 自选基金 Hook
 * 管理用户的自选基金列表 - 使用后端 API 持久化
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  getWatchlist,
  addWatchlistFund,
  removeWatchlistFund,
  updateWatchlistFund,
  moveFundToGroup as apiMoveFundToGroup,
  getGroups,
  createGroup as apiCreateGroup,
  deleteGroup as apiDeleteGroup,
  renameGroup as apiRenameGroup,
} from '../services/fundService';
import { shouldShowDailyProfit } from '../utils/trading';

/**
 * 自选基金 Hook
 * @returns {Object}
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [groups, setGroups] = useState([{ id: 'default', name: '所有基金', order: 0 }]);
  const [loading, setLoading] = useState(true);

  // 初始化：从后端加载数据
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [watchlistRes, groupsRes] = await Promise.all([
          getWatchlist(),
          getGroups(),
        ]);
        setWatchlist(watchlistRes.watchlist || []);
        setGroups(groupsRes.groups || [{ id: 'default', name: '所有基金', order: 0 }]);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /**
   * 添加自选基金
   */
  const addFund = useCallback(async (fund, amount, profit, currentNav) => {
    const cost = amount - profit;
    const shares = currentNav > 0 ? amount / currentNav : 0;
    const costPrice = shares > 0 ? cost / shares : 0;

    const fundData = {
      code: fund.code,
      name: fund.name,
      amount,
      profit,
      shares: Math.round(shares * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      costPrice: Math.round(costPrice * 10000) / 10000,
      groupId: 'default',
    };

    try {
      const result = await addWatchlistFund(fundData);
      if (result.fund) {
        setWatchlist((prev) => [...prev, result.fund]);
        return result.fund;
      }
    } catch (error) {
      console.error('Failed to add fund:', error);
    }
    return null;
  }, []);

  /**
   * 删除自选基金
   */
  const removeFund = useCallback(async (id) => {
    try {
      await removeWatchlistFund(id);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove fund:', error);
    }
  }, []);

  /**
   * 更新基金信息
   */
  const updateFund = useCallback(async (id, updates) => {
    try {
      const result = await updateWatchlistFund(id, updates);
      if (result.fund) {
        setWatchlist((prev) =>
          prev.map((item) => (item.id === id ? result.fund : item))
        );
      }
    } catch (error) {
      console.error('Failed to update fund:', error);
    }
  }, []);

  /**
   * 移动基金到分组
   */
  const moveFundToGroup = useCallback(async (fundId, groupId) => {
    try {
      await apiMoveFundToGroup(fundId, groupId);
      setWatchlist((prev) =>
        prev.map((item) =>
          item.id === fundId ? { ...item, groupId } : item
        )
      );
    } catch (error) {
      console.error('Failed to move fund:', error);
    }
  }, []);

  /**
   * 创建分组
   */
  const createGroup = useCallback(async (name) => {
    try {
      const result = await apiCreateGroup(name);
      if (result.group) {
        setGroups((prev) => [...prev, result.group]);
        return result.group;
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
    return null;
  }, []);

  /**
   * 删除分组
   */
  const deleteGroup = useCallback(async (groupId) => {
    if (groupId === 'default') return;

    try {
      await apiDeleteGroup(groupId);
      // 将该分组的基金移回默认分组
      setWatchlist((prev) =>
        prev.map((item) =>
          item.groupId === groupId ? { ...item, groupId: 'default' } : item
        )
      );
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  }, []);

  /**
   * 重命名分组
   */
  const renameGroup = useCallback(async (groupId, newName) => {
    try {
      const result = await apiRenameGroup(groupId, newName);
      if (result.group) {
        setGroups((prev) =>
          prev.map((g) => (g.id === groupId ? result.group : g))
        );
      }
    } catch (error) {
      console.error('Failed to rename group:', error);
    }
  }, []);

  /**
   * 重新排序分组
   */
  const reorderGroups = useCallback((newGroups) => {
    setGroups(newGroups);
    // TODO: 可以添加后端 API 来保存排序
  }, []);

  /**
   * 检查基金是否已添加
   */
  const isFundAdded = useCallback(
    (code) => {
      return watchlist.some((item) => item.code === code);
    },
    [watchlist]
  );

  /**
   * 获取分组内的基金
   */
  const getFundsByGroup = useCallback(
    (groupId) => {
      return watchlist.filter((item) => item.groupId === groupId);
    },
    [watchlist]
  );

  /**
   * 获取所有基金代码
   */
  const getAllCodes = useMemo(() => {
    return watchlist.map((item) => item.code);
  }, [watchlist]);

  /**
   * 计算总收益
   */
  const calculateTotalProfit = useCallback(
    (realtimeData) => {
      let totalCost = 0;
      let totalAmount = 0;
      let totalDailyProfit = 0;
      let realtimeTotalAsset = 0;
      let hasDailyProfitData = false; // 是否有有效的当日收益数据

      watchlist.forEach((fund) => {
        totalCost += fund.cost || 0;
        totalAmount += fund.amount || 0;

        const realtime = realtimeData[fund.code];
        if (realtime?.estimate_nav && fund.shares) {
          // 实时资产 = 份额 × 实时估值
          const currentValue = fund.shares * realtime.estimate_nav;
          realtimeTotalAsset += currentValue;

          // 当日收益 = 份额 × (实时估值 - 昨日净值)
          // 只有在交易时间且估值时间是今天时才计算
          if (realtime.nav && shouldShowDailyProfit(realtime.estimate_time)) {
            const dailyChange = realtime.estimate_nav - realtime.nav;
            totalDailyProfit += fund.shares * dailyChange;
            hasDailyProfitData = true;
          }
        } else {
          realtimeTotalAsset += fund.amount || 0;
        }
      });

      const totalProfit = realtimeTotalAsset - totalCost;
      const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
      
      // 计算当日收益率 = 当日收益 / (实时总资产 - 当日收益) * 100
      // 或者简化为：当日收益率 = 当日收益 / 昨日总资产 * 100
      const yesterdayAsset = realtimeTotalAsset - totalDailyProfit;
      const totalDailyProfitRate = yesterdayAsset > 0 ? (totalDailyProfit / yesterdayAsset) * 100 : 0;

      return {
        totalCost: Math.round(totalCost * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalProfitRate: Math.round(totalProfitRate * 100) / 100,
        totalDailyProfit: hasDailyProfitData ? Math.round(totalDailyProfit * 100) / 100 : null,
        totalDailyProfitRate: hasDailyProfitData ? Math.round(totalDailyProfitRate * 100) / 100 : null,
        realtimeTotalAsset: Math.round(realtimeTotalAsset * 100) / 100,
      };
    },
    [watchlist]
  );

  /**
   * 计算分组收益
   */
  const calculateGroupProfit = useCallback(
    (groupId, realtimeData) => {
      const groupFunds = watchlist.filter((f) => f.groupId === groupId);

      let totalCost = 0;
      let totalAmount = 0;
      let totalDailyProfit = 0;
      let realtimeTotalAsset = 0;
      let hasDailyProfitData = false;

      groupFunds.forEach((fund) => {
        totalCost += fund.cost || 0;
        totalAmount += fund.amount || 0;

        const realtime = realtimeData[fund.code];
        if (realtime?.estimate_nav && fund.shares) {
          const currentValue = fund.shares * realtime.estimate_nav;
          realtimeTotalAsset += currentValue;

          if (realtime.nav && shouldShowDailyProfit(realtime.estimate_time)) {
            const dailyChange = realtime.estimate_nav - realtime.nav;
            totalDailyProfit += fund.shares * dailyChange;
            hasDailyProfitData = true;
          }
        } else {
          realtimeTotalAsset += fund.amount || 0;
        }
      });

      const totalProfit = realtimeTotalAsset - totalCost;
      const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
      
      // 计算当日收益率
      const yesterdayAsset = realtimeTotalAsset - totalDailyProfit;
      const totalDailyProfitRate = yesterdayAsset > 0 ? (totalDailyProfit / yesterdayAsset) * 100 : 0;

      return {
        totalCost: Math.round(totalCost * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalProfitRate: Math.round(totalProfitRate * 100) / 100,
        totalDailyProfit: hasDailyProfitData ? Math.round(totalDailyProfit * 100) / 100 : null,
        totalDailyProfitRate: hasDailyProfitData ? Math.round(totalDailyProfitRate * 100) / 100 : null,
        realtimeTotalAsset: Math.round(realtimeTotalAsset * 100) / 100,
      };
    },
    [watchlist]
  );

  return {
    watchlist,
    groups,
    loading,
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
  };
}

export default useWatchlist;
