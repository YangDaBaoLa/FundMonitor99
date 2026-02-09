/**
 * 日内涨跌幅迷你折线图组件
 * 使用 Canvas 绘制，性能优异
 */
import { useRef, useEffect, memo, useMemo } from 'react';

// 开盘和收盘时间（分钟数，从0:00开始计算）
const MARKET_OPEN_MINUTES = 9 * 60 + 30;  // 9:30 = 570分钟
const MARKET_CLOSE_MINUTES = 15 * 60;      // 15:00 = 900分钟
const TOTAL_MINUTES = MARKET_CLOSE_MINUTES - MARKET_OPEN_MINUTES; // 330分钟

/**
 * 将时间字符串转换为分钟数
 * @param {string} timeStr - "HH:MM:SS" 格式
 * @returns {number} 从 0:00 开始的分钟数
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * IntradaySparkline 组件
 * 
 * @param {Object} props
 * @param {Array} props.data - [{time: "HH:MM:SS", change: number}, ...]
 * @param {number} props.width - 图表宽度
 * @param {number} props.height - 图表高度
 */
function IntradaySparkline({ data = [], width = 120, height = 40 }) {
  const canvasRef = useRef(null);
  
  // 处理数据，转换时间为 x 坐标比例
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(point => {
      const minutes = timeToMinutes(point.time);
      // 计算 x 坐标比例 (0-1)
      const xRatio = (minutes - MARKET_OPEN_MINUTES) / TOTAL_MINUTES;
      return {
        x: Math.max(0, Math.min(1, xRatio)),
        change: point.change
      };
    }).filter(p => p.x >= 0 && p.x <= 1);
  }, [data]);

  // 计算涨跌幅范围
  const { minChange, maxChange, range } = useMemo(() => {
    if (processedData.length === 0) {
      return { minChange: -1, maxChange: 1, range: 2 };
    }
    
    const changes = processedData.map(p => p.change);
    let min = Math.min(...changes, 0);
    let max = Math.max(...changes, 0);
    
    // 确保有一定的范围，至少 0.5%
    const absMax = Math.max(Math.abs(min), Math.abs(max), 0.5);
    min = -absMax;
    max = absMax;
    
    return {
      minChange: min,
      maxChange: max,
      range: max - min
    };
  }, [processedData]);

  // 绘制图表
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // 设置 canvas 尺寸（考虑设备像素比）
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 颜色定义
    const colorUp = '#E53E3E';    // 红色（涨）
    const colorDown = '#38A169';  // 绿色（跌）
    const colorZero = 'rgba(107, 114, 128, 0.3)';  // 零轴线颜色

    // 计算零轴 y 坐标
    const zeroY = height * (maxChange / range);

    // 绘制零轴虚线
    ctx.beginPath();
    ctx.strokeStyle = colorZero;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 如果没有数据，只显示零轴
    if (processedData.length === 0) {
      return;
    }

    // 绘制区域填充和折线
    // 先绘制填充区域
    const points = processedData.map(p => ({
      x: p.x * width,
      y: height * (1 - (p.change - minChange) / range)
    }));

    // 绘制上涨区域（红色）
    ctx.beginPath();
    ctx.moveTo(points[0].x, zeroY);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const prevPoint = points[i - 1];
      
      if (i === 0) {
        ctx.lineTo(point.x, Math.min(point.y, zeroY));
      } else {
        // 如果跨越零轴，需要找到交点
        if ((prevPoint.y < zeroY && point.y > zeroY) || (prevPoint.y > zeroY && point.y < zeroY)) {
          const ratio = (zeroY - prevPoint.y) / (point.y - prevPoint.y);
          const crossX = prevPoint.x + ratio * (point.x - prevPoint.x);
          ctx.lineTo(crossX, zeroY);
        }
        ctx.lineTo(point.x, Math.min(point.y, zeroY));
      }
    }
    ctx.lineTo(points[points.length - 1].x, zeroY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(229, 62, 62, 0.15)';
    ctx.fill();

    // 绘制下跌区域（绿色）
    ctx.beginPath();
    ctx.moveTo(points[0].x, zeroY);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const prevPoint = points[i - 1];
      
      if (i === 0) {
        ctx.lineTo(point.x, Math.max(point.y, zeroY));
      } else {
        if ((prevPoint.y < zeroY && point.y > zeroY) || (prevPoint.y > zeroY && point.y < zeroY)) {
          const ratio = (zeroY - prevPoint.y) / (point.y - prevPoint.y);
          const crossX = prevPoint.x + ratio * (point.x - prevPoint.x);
          ctx.lineTo(crossX, zeroY);
        }
        ctx.lineTo(point.x, Math.max(point.y, zeroY));
      }
    }
    ctx.lineTo(points[points.length - 1].x, zeroY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(56, 161, 105, 0.15)';
    ctx.fill();

    // 绘制折线
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const prevPoint = points[i - 1];
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        // 根据当前点是否在零轴上方决定颜色
        const avgY = (prevPoint.y + point.y) / 2;
        ctx.strokeStyle = avgY < zeroY ? colorUp : colorDown;
        
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    }

    // 绘制最后一个点的圆点
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const lastChange = processedData[processedData.length - 1].change;
      
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = lastChange >= 0 ? colorUp : colorDown;
      ctx.fill();
    }

  }, [processedData, width, height, minChange, maxChange, range]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        borderRadius: '4px',
      }}
    />
  );
}

export default memo(IntradaySparkline);
