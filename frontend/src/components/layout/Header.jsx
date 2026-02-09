/**
 * 应用头部组件
 * 显示用户头像、总收益、添加基金按钮
 */
import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Avatar from 'boring-avatars';
import { Eye, EyeSlash, ArrowsClockwise, Plus } from '@phosphor-icons/react';
import AnimatedNumber, { AnimatedCurrency, AnimatedPercent } from '../common/AnimatedNumber';
import AvatarPickerModal from '../common/AvatarPickerModal';
import { getChangeColor, formatCurrency } from '../../utils/format';
import { getTradingStatus } from '../../utils/trading';

// 预设头像配置 - 与 AvatarPickerModal 保持一致
const PRESET_AVATARS = [
  { id: '1', name: 'Felix', variant: 'beam' },
  { id: '2', name: 'Maria', variant: 'beam' },
  { id: '3', name: 'Jasper', variant: 'marble' },
  { id: '4', name: 'Luna', variant: 'marble' },
  { id: '5', name: 'Oliver', variant: 'pixel' },
  { id: '6', name: 'Sophie', variant: 'pixel' },
  { id: '7', name: 'Atlas', variant: 'sunset' },
  { id: '8', name: 'Iris', variant: 'sunset' },
  { id: '9', name: 'Leo', variant: 'ring' },
  { id: '10', name: 'Nova', variant: 'ring' },
];

const AVATAR_COLORS = ['#6C63FF', '#38B2AC', '#E53E3E', '#ED8936', '#48BB78'];

function Header({ 
  totalProfit, 
  countdown, 
  isPolling,
  lastUpdateTime,
  onRefresh, 
  onAddFund,
  hideAmount,
  onToggleHideAmount,
  appName = 'FM99',
  onUpdateAppName,
  avatar = { type: 'preset', value: '1' },
  onUpdateAvatar,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(appName);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const inputRef = useRef(null);

  // 同步外部 appName 变化
  useEffect(() => {
    setEditValue(appName);
  }, [appName]);

  // 聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(appName);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== appName && onUpdateAppName) {
      onUpdateAppName(trimmed);
    } else {
      setEditValue(appName); // 恢复原值
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(appName);
      setIsEditing(false);
    }
  };

  // 获取预设头像配置
  const getPresetById = (id) => {
    return PRESET_AVATARS.find((p) => p.id === id) || PRESET_AVATARS[0];
  };

  // 渲染头像
  const renderAvatar = () => {
    if (avatar?.type === 'custom' && avatar?.value) {
      return (
        <img
          src={avatar.value}
          alt="用户头像"
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    
    const preset = getPresetById(avatar?.value || '1');
    return (
      <Avatar
        size={48}
        name={preset.name}
        variant={preset.variant}
        colors={AVATAR_COLORS}
      />
    );
  };

  const {
    realtimeTotalAsset = 0,
    totalDailyProfit = null, // 可能为 null 表示无效数据
    totalDailyProfitRate = null, // 当日收益率
  } = totalProfit || {};

  // 获取当前交易状态
  const tradingStatus = getTradingStatus();
  
  // 当日收益显示内容
  const renderDailyProfit = () => {
    if (hideAmount) {
      return '****';
    }
    
    // 如果当日收益为 null，显示交易状态
    if (totalDailyProfit === null) {
      return <span className="text-muted text-sm">{tradingStatus}</span>;
    }
    
    return (
      <AnimatedCurrency 
        value={totalDailyProfit}
        duration={500}
        showSign
      />
    );
  };

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="flex justify-between items-center">
          {/* 左侧：用户头像和总资产 */}
          <div className="flex items-center gap-xl">
            <div className="flex items-center gap-md">
              <motion.div
                className="user-avatar cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAvatarPickerOpen(true)}
                title="点击更换头像"
              >
                {renderAvatar()}
              </motion.div>
              <div>
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="font-semibold bg-transparent border-b border-primary outline-none w-24"
                    maxLength={20}
                  />
                ) : (
                  <div 
                    className="font-semibold cursor-pointer hover:text-primary transition-colors"
                    onClick={handleStartEdit}
                    title="点击编辑应用名称"
                  >
                    {appName}
                  </div>
                )}
                <div className="text-sm text-muted">
                  {lastUpdateTime ? (
                    <>更新: {lastUpdateTime}</>
                  ) : isPolling ? (
                    <>下次刷新: {countdown}s</>
                  ) : (
                    '已暂停'
                  )}
                </div>
              </div>
            </div>

            {/* 总资产显示 */}
            <div className="hidden md:block pl-xl border-l border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-xs mb-1">
                <span className="text-xs text-muted">总资产</span>
                <button 
                  onClick={onToggleHideAmount}
                  className="text-muted hover:text-primary transition-colors focus:outline-none"
                  title={hideAmount ? '显示金额' : '隐藏金额'}
                >
                  {hideAmount ? (
                    <EyeSlash size={14} weight="bold" />
                  ) : (
                    <Eye size={14} weight="bold" />
                  )}
                </button>
              </div>
              <div className="text-2xl font-bold leading-none">
                {hideAmount ? '*****.**' : (
                  <AnimatedCurrency value={realtimeTotalAsset} duration={500} />
                )}
              </div>
            </div>
          </div>

          {/* 中间：收益显示 */}
          <div className="flex items-center gap-xl">
            {/* 当日收益 */}
            <div className="summary-card">
              <div className={`summary-value ${totalDailyProfit !== null ? getChangeColor(totalDailyProfit) : ''}`}>
                {renderDailyProfit()}
              </div>
              <div className="summary-label">当日收益</div>
            </div>

            {/* 当日收益率 */}
            <div className="summary-card">
              <div className={`summary-value ${totalDailyProfitRate !== null ? getChangeColor(totalDailyProfitRate) : ''}`}>
                {hideAmount ? '****' : (
                  totalDailyProfitRate !== null ? (
                    <AnimatedPercent 
                      value={totalDailyProfitRate}
                      duration={500}
                    />
                  ) : (
                    <span className="text-muted text-sm">{tradingStatus}</span>
                  )
                )}
              </div>
              <div className="summary-label">当日收益率</div>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-md">
            <motion.button
              className="neu-btn"
              onClick={onRefresh}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="刷新数据"
            >
              <ArrowsClockwise size={18} weight="bold" />
            </motion.button>
            <motion.button
              className="neu-btn-primary neu-btn"
              onClick={onAddFund}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} weight="bold" style={{ marginRight: 4 }} />
              添加基金
            </motion.button>
          </div>
        </div>
      </div>

      {/* 头像选择弹窗 */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatar={avatar}
        onSelect={onUpdateAvatar}
      />
    </header>
  );
}

export default memo(Header);
