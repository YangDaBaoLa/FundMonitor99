/**
 * 数字滚动动画组件
 * 只在数值真正变化时才触发动画
 */
import { memo, useRef, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  duration = 500,
  formatFn = null,
}) {
  const prevValueRef = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);
  
  // 检测值是否真正变化
  const hasChanged = prevValueRef.current !== value;
  
  // 使用 react-spring 进行动画
  const { animatedValue } = useSpring({
    animatedValue: value,
    from: { animatedValue: hasChanged ? prevValueRef.current : value },
    config: { duration: hasChanged ? duration : 0 },
    onChange: ({ value: springValue }) => {
      setDisplayValue(springValue.animatedValue);
    },
  });
  
  // 更新上一次的值
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  // 格式化显示值
  const formattedValue = formatFn 
    ? formatFn(displayValue)
    : `${prefix}${displayValue.toFixed(decimals)}${suffix}`;
  
  return (
    <span className={className}>
      {formattedValue}
    </span>
  );
}

/**
 * 货币数字组件 - 带正负号
 */
export function AnimatedCurrency({
  value,
  decimals = 2,
  className = '',
  duration = 500,
  showSign = true,
}) {
  const formatFn = (val) => {
    const absValue = Math.abs(val).toFixed(decimals);
    if (showSign) {
      return val >= 0 ? `+¥${absValue}` : `-¥${absValue}`;
    }
    return `¥${absValue}`;
  };
  
  return (
    <AnimatedNumber
      value={value}
      decimals={decimals}
      className={className}
      duration={duration}
      formatFn={formatFn}
    />
  );
}

/**
 * 百分比数字组件 - 带正负号
 */
export function AnimatedPercent({
  value,
  decimals = 2,
  className = '',
  duration = 500,
  showSign = true,
}) {
  const formatFn = (val) => {
    const absValue = Math.abs(val).toFixed(decimals);
    if (showSign) {
      return val >= 0 ? `+${absValue}%` : `-${absValue}%`;
    }
    return `${absValue}%`;
  };
  
  return (
    <AnimatedNumber
      value={value}
      decimals={decimals}
      className={className}
      duration={duration}
      formatFn={formatFn}
    />
  );
}

/**
 * 净值数字组件 - 4位小数
 */
export function AnimatedNav({
  value,
  className = '',
  duration = 500,
}) {
  return (
    <AnimatedNumber
      value={value}
      decimals={4}
      className={className}
      duration={duration}
    />
  );
}

export default memo(AnimatedNumber);
