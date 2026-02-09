/**
 * 添加自选基金弹窗组件
 */
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchFunds, getFundRealtime } from '../../services/fundService';

function AddFundModal({ isOpen, onClose, onAdd, isFundAdded }) {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [amount, setAmount] = useState('10000');
  const [profit, setProfit] = useState('0');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [currentNav, setCurrentNav] = useState(null);
  
  // 使用 ref 存储 debounce timer
  const searchTimerRef = useRef(null);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setKeyword('');
      setSearchResults([]);
      setSelectedFund(null);
      setAmount('10000');
      setProfit('0');
      setCurrentNav(null);
    }
  }, [isOpen]);

  // 搜索基金 - 直接在 useEffect 中使用 debounce 逻辑
  useEffect(() => {
    // 清除之前的 timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // 如果关键词太短或已选择基金，不搜索
    if (!keyword || keyword.length < 1 || selectedFund) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    setSearching(true);
    
    // 设置 debounce
    searchTimerRef.current = setTimeout(async () => {
      try {
        console.log('Searching for:', keyword);
        const result = await searchFunds(keyword, 10);
        console.log('Search result:', result);
        setSearchResults(result.funds || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    
    // 清理函数
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [keyword, selectedFund]);

  // 选择基金
  const handleSelectFund = async (fund) => {
    setSelectedFund(fund);
    setSearchResults([]);
    setKeyword(fund.name);
    
    // 获取当前净值
    try {
      const realtime = await getFundRealtime(fund.code);
      setCurrentNav(realtime.estimate_nav || realtime.nav);
    } catch (error) {
      console.error('Failed to get fund realtime:', error);
    }
  };

  // 计算持仓信息
  const calculateHoldings = () => {
    const amountNum = parseFloat(amount) || 0;
    const profitNum = parseFloat(profit) || 0;
    const cost = amountNum - profitNum;
    const nav = currentNav || 1;
    const shares = amountNum / nav;
    const costPrice = cost / shares;
    
    return {
      cost: cost.toFixed(2),
      shares: shares.toFixed(2),
      costPrice: costPrice.toFixed(4),
    };
  };

  const holdings = calculateHoldings();

  // 提交
  const handleSubmit = async () => {
    if (!selectedFund || !amount) return;
    
    const amountNum = parseFloat(amount) || 0;
    const profitNum = parseFloat(profit) || 0;
    
    if (amountNum <= 0) {
      alert('请输入有效的持有金额');
      return;
    }
    
    if (isFundAdded(selectedFund.code)) {
      alert('该基金已添加');
      return;
    }
    
    setLoading(true);
    try {
      await onAdd(selectedFund, amountNum, profitNum, currentNav || 1);
      onClose();
    } catch (error) {
      console.error('Failed to add fund:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-xl mb-lg">添加自选基金</h3>

            {/* 搜索输入框 */}
            <div className="mb-md" style={{ position: 'relative' }}>
              <label className="text-sm text-muted mb-xs block">搜索基金</label>
              <input
                type="text"
                className="neu-input"
                placeholder="输入基金代码或名称"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setSelectedFund(null);
                }}
              />
              
              {/* 搜索结果下拉 */}
              {searchResults.length > 0 && !selectedFund && (
                <div
                  className="neu-card-sm"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    marginTop: 8,
                  }}
                >
                  {searchResults.map((fund) => (
                    <div
                      key={fund.code}
                      className="p-sm cursor-pointer hover:bg-[#D4D9E0]"
                      onClick={() => handleSelectFund(fund)}
                      style={{ borderRadius: 8 }}
                    >
                      <div className="font-medium">{fund.name}</div>
                      <div className="text-sm text-muted">
                        {fund.code} · {fund.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searching && (
                <div className="text-sm text-muted mt-xs">搜索中...</div>
              )}
            </div>

            {/* 选中的基金 */}
            {selectedFund && (
              <div className="neu-inset mb-md p-md">
                <div className="font-semibold">{selectedFund.name}</div>
                <div className="text-sm text-muted">
                  {selectedFund.code} · {selectedFund.type}
                </div>
                {currentNav && (
                  <div className="text-sm mt-xs">
                    当前净值: <span className="font-medium">{currentNav.toFixed(4)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 持有金额 */}
            <div className="mb-md">
              <label className="text-sm text-muted mb-xs block">持有金额（元）</label>
              <input
                type="number"
                className="neu-input"
                placeholder="输入持有金额"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="100"
              />
            </div>

            {/* 累计收益 */}
            <div className="mb-md">
              <label className="text-sm text-muted mb-xs block">累计收益（元）</label>
              <input
                type="number"
                className="neu-input"
                placeholder="输入累计收益"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                step="10"
              />
              <div className="text-xs text-muted mt-xs">
                正数表示盈利，负数表示亏损
              </div>
            </div>

            {/* 计算结果预览 */}
            {selectedFund && (
              <div className="neu-inset mb-lg p-md">
                <div className="text-sm text-muted mb-sm">计算结果（预估）</div>
                <div className="grid grid-cols-3 gap-sm text-center">
                  <div>
                    <div className="text-sm text-muted">持仓成本</div>
                    <div className="font-medium">¥{holdings.cost}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">持有份额</div>
                    <div className="font-medium">{holdings.shares}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">成本价</div>
                    <div className="font-medium">{holdings.costPrice}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-md justify-end">
              <button className="neu-btn" onClick={onClose}>
                取消
              </button>
              <button
                className="neu-btn-primary neu-btn"
                onClick={handleSubmit}
                disabled={!selectedFund || loading}
              >
                {loading ? '添加中...' : '添加'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(AddFundModal);
