/**
 * 基金卡片组件
 * 新拟态设计，显示基金实时信息
 */
import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash } from '@phosphor-icons/react';
import { AnimatedCurrency, AnimatedPercent, AnimatedNav } from '../common/AnimatedNumber';
import { formatNav, getChangeColor } from '../../utils/format';
import { calculateDailyProfit } from '../../utils/trading';
import IntradaySparkline from './IntradaySparkline';

function FundCard({ fund, realtime, intradayData, onNameClick, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: fund.id,
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  // 使用 dnd-kit 的 CSS transform 处理位置变化
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  // 计算涨跌颜色
  const changeColor = useMemo(() => {
    return getChangeColor(realtime?.estimate_change);
  }, [realtime?.estimate_change]);

  // 当日收益（使用交易时间判断）
  const dailyProfitData = useMemo(() => {
    return calculateDailyProfit({
      shares: fund.shares,
      nav: realtime?.nav,
      estimateNav: realtime?.estimate_nav,
      estimateTime: realtime?.estimate_time,
    });
  }, [realtime, fund.shares]);

  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(fund.id);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="neu-card fund-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={!isDragging ? { y: -3 } : {}}
      transition={{ 
        duration: 0.2,
        ease: 'easeOut',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 删除按钮 - 右上角 */}
      <motion.button
        className="fund-card-delete"
        onClick={handleDelete}
        onPointerDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered && !isDragging ? 1 : 0, 
          scale: isHovered && !isDragging ? 1 : 0.8 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="删除基金"
      >
        <Trash size={16} weight="bold" />
      </motion.button>

      {/* 头部：基金名称和代码 */}
      <div className="flex flex-col mb-md">
        <h4 
          className="font-semibold cursor-pointer hover:text-accent"
          onClick={(e) => {
            e.stopPropagation();
            onNameClick?.(fund);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ fontSize: '1rem', marginBottom: '4px' }}
        >
          {fund.name || realtime?.name || '加载中...'}
        </h4>
        <div className="flex items-center gap-sm">
          <span className="text-muted text-sm">{fund.code}</span>
          {realtime?.sector && (
            <span className="neu-tag-sm">
              {realtime.sector}
            </span>
          )}
        </div>
      </div>

      {/* 主体：数据信息 */}
      <div className="fund-card-body">
        <div className="fund-card-data" style={{ flex: 1 }}>
          <div className="fund-card-row">
            <span className="text-muted text-sm">昨日净值</span>
            <span className="font-medium">{formatNav(realtime?.nav)}</span>
          </div>
          
          <div className="fund-card-row">
            <span className="text-muted text-sm">实时估值</span>
            <span className={`font-bold ${changeColor}`}>
              {realtime?.estimate_nav ? (
                <AnimatedNav value={realtime.estimate_nav} />
              ) : (
                '--'
              )}
            </span>
          </div>
          
          <div className="fund-card-row">
            <span className="text-muted text-sm">涨跌幅</span>
            <span className={`font-semibold ${changeColor}`}>
              {realtime?.estimate_change !== null && realtime?.estimate_change !== undefined ? (
                <AnimatedPercent value={realtime.estimate_change} />
              ) : (
                '--'
              )}
            </span>
          </div>
          
          <div className="fund-card-row">
            <span className="text-muted text-sm">当日收益</span>
            <span className={`font-semibold ${dailyProfitData.value !== null ? getChangeColor(dailyProfitData.value) : ''}`}>
              {dailyProfitData.value !== null ? (
                <AnimatedCurrency value={dailyProfitData.value} />
              ) : (
                <span className="text-muted">{dailyProfitData.display}</span>
              )}
            </span>
          </div>
        </div>

        {/* 日内走势图 */}
        <div className="fund-card-chart">
          <IntradaySparkline 
            data={intradayData || []} 
            width={140} 
            height={70} 
          />
        </div>
      </div>
    </motion.div>
  );
}

export default memo(FundCard);
