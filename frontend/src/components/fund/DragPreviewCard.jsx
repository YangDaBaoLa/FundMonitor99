/**
 * 拖拽预览卡片组件
 * 在拖拽时跟随光标显示的卡片预览
 */
import { memo } from 'react';
import { getChangeColor } from '../../utils/format';

function DragPreviewCard({ fund, realtime }) {
  const changeColor = getChangeColor(realtime?.estimate_change);

  return (
    <div
      className="neu-card fund-card"
      style={{
        cursor: 'grabbing',
        width: 320,
        transform: 'rotate(2deg) scale(1.03)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 15px 15px 30px rgba(163, 177, 198, 0.6), -15px -15px 30px rgba(255, 255, 255, 0.7)',
        opacity: 0.95,
      }}
    >
      {/* 头部：基金名称和代码 */}
      <div className="flex flex-col mb-md">
        <h4 
          className="font-semibold"
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

      {/* 简化的数据显示 */}
      <div className="fund-card-body">
        <div className="fund-card-data">
          <div className="fund-card-row">
            <span className="text-muted text-sm">实时估值</span>
            <span className={`font-bold ${changeColor}`}>
              {realtime?.estimate_nav?.toFixed(4) || '--'}
            </span>
          </div>
          
          <div className="fund-card-row">
            <span className="text-muted text-sm">涨跌幅</span>
            <span className={`font-semibold ${changeColor}`}>
              {realtime?.estimate_change !== null && realtime?.estimate_change !== undefined 
                ? `${realtime.estimate_change >= 0 ? '+' : ''}${realtime.estimate_change.toFixed(2)}%`
                : '--'}
            </span>
          </div>
        </div>

        {/* 占位图表区域 */}
        <div 
          className="fund-card-chart"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--accent)',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          拖拽中...
        </div>
      </div>
    </div>
  );
}

export default memo(DragPreviewCard);
