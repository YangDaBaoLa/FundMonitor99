/**
 * 分组容器组件
 * 支持拖拽基金卡片，显示分组收益汇总
 */
import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import FundCard from '../fund/FundCard';
import { AnimatedCurrency, AnimatedPercent } from '../common/AnimatedNumber';
import { getChangeColor } from '../../utils/format';
import { getTradingStatus } from '../../utils/trading';

function FundGroup({ 
  group, 
  funds, 
  realtimeData, 
  groupProfit,
  onFundNameClick,
  onDeleteFund,
  onDeleteGroup,
  onRenameGroup,
  activeDragId,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
  });

  // 分组收益颜色
  const profitColor = useMemo(() => {
    return getChangeColor(groupProfit?.totalDailyProfit);
  }, [groupProfit?.totalDailyProfit]);

  // 过滤掉正在拖拽的卡片（它会显示在 DragOverlay 中）
  const visibleFunds = useMemo(() => {
    return funds.filter(f => f.id !== activeDragId);
  }, [funds, activeDragId]);

  // 检查当前拖拽的基金是否属于这个分组
  const isDraggingFromThisGroup = activeDragId && funds.some(f => f.id === activeDragId);

  return (
    <motion.div
      ref={setNodeRef}
      className={`neu-card group-container ${isOver ? 'drag-over' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isOver && !isDraggingFromThisGroup ? 1.01 : 1,
      }}
      transition={{ 
        duration: 0.3,
        ease: 'easeOut',
      }}
      style={{ marginBottom: 'var(--space-lg)' }}
    >
      {/* 分组头部 */}
      <div className="flex justify-between items-center mb-lg">
        <div className="flex items-center gap-md">
          <h3 className="font-semibold">{group.name}</h3>
          <span 
            className="neu-tag"
            style={{
              backgroundColor: isOver && !isDraggingFromThisGroup ? 'var(--accent)' : undefined,
              color: isOver && !isDraggingFromThisGroup ? 'white' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            {funds.length} 只基金
          </span>
        </div>

        {/* 分组收益汇总 */}
        {funds.length > 0 && groupProfit && (
          <div className="flex items-center gap-lg">
            <div className="text-right">
              <div className="text-muted text-sm">当日收益</div>
              <div className={`font-semibold ${profitColor}`}>
                {groupProfit.totalDailyProfit !== null ? (
                  <AnimatedCurrency 
                    value={groupProfit.totalDailyProfit || 0}
                    duration={500}
                  />
                ) : (
                  <span className="text-muted text-sm">{getTradingStatus()}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted text-sm">当日收益率</div>
              <div className={`font-semibold ${getChangeColor(groupProfit.totalDailyProfitRate)}`}>
                {groupProfit.totalDailyProfitRate !== null ? (
                  <AnimatedPercent 
                    value={groupProfit.totalDailyProfitRate || 0}
                    duration={500}
                  />
                ) : (
                  <span className="text-muted text-sm">--</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮（非默认分组） */}
        {group.id !== 'default' && (
          <div className="flex gap-sm">
            <button 
              className="neu-btn text-sm"
              onClick={() => onRenameGroup?.(group.id)}
            >
              重命名
            </button>
            <button 
              className="neu-btn text-sm"
              onClick={() => onDeleteGroup?.(group.id)}
            >
              删除
            </button>
          </div>
        )}
      </div>

      {/* 基金卡片网格 */}
      {funds.length > 0 || (isOver && !isDraggingFromThisGroup) ? (
        <SortableContext items={funds.map(f => f.id)} strategy={rectSortingStrategy}>
          <div 
            className="fund-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-lg)',
              minHeight: isOver ? 180 : undefined,
            }}
          >
            <AnimatePresence mode="popLayout">
              {visibleFunds.map((fund) => (
                <FundCard
                  key={fund.id}
                  fund={fund}
                  realtime={realtimeData[fund.code]}
                  onNameClick={onFundNameClick}
                  onDelete={onDeleteFund}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      ) : (
        <div 
          className="neu-inset text-center p-xl text-muted"
          style={{
            backgroundColor: isOver ? 'rgba(108, 99, 255, 0.1)' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          拖拽基金卡片到这里
        </div>
      )}

      {/* 拖拽悬停时的提示 */}
      {isOver && !isDraggingFromThisGroup && (
        <div className="drag-drop-hint">
          松开放置到「{group.name}」
        </div>
      )}
    </motion.div>
  );
}

export default memo(FundGroup);
