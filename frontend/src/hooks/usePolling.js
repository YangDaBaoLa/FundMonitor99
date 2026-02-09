/**
 * 轮询 Hook
 * 用于定时刷新数据
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { REFRESH_INTERVAL } from '../utils/constants';

/**
 * 轮询 Hook
 * @param {Function} callback - 回调函数
 * @param {number} interval - 轮询间隔（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Object} - { isPolling, start, stop, refresh }
 */
export function usePolling(callback, interval = REFRESH_INTERVAL, immediate = true) {
  const [isPolling, setIsPolling] = useState(false);
  const [countdown, setCountdown] = useState(interval / 1000);
  const savedCallback = useRef(callback);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const isVisibleRef = useRef(true);

  // 更新回调引用
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 启动轮询
  const start = useCallback(() => {
    if (intervalRef.current) return;

    setIsPolling(true);
    setCountdown(interval / 1000);

    // 主轮询
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        savedCallback.current();
        setCountdown(interval / 1000);
      }
    }, interval);

    // 倒计时
    countdownRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        setCountdown((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
  }, [interval]);

  // 停止轮询
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 手动刷新
  const refresh = useCallback(() => {
    savedCallback.current();
    setCountdown(interval / 1000);
  }, [interval]);

  // 页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        // 页面隐藏时暂停
        stop();
      } else {
        // 页面可见时恢复
        if (immediate) {
          savedCallback.current();
        }
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [start, stop, immediate]);

  // 初始化
  useEffect(() => {
    if (immediate) {
      savedCallback.current();
    }
    start();

    return () => {
      stop();
    };
  }, [start, stop, immediate]);

  return {
    isPolling,
    countdown,
    start,
    stop,
    refresh,
  };
}

export default usePolling;
