/**
 * LocalStorage Hook
 * 用于持久化数据到 LocalStorage
 */
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 从 LocalStorage 读取数据
 * @param {string} key - 存储键
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
function getStoredValue(key, defaultValue) {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * LocalStorage Hook
 * @param {string} key - 存储键
 * @param {*} defaultValue - 默认值
 * @returns {[*, Function]}
 */
export function useLocalStorage(key, defaultValue) {
  // 使用函数初始化，确保只在首次渲染时读取 localStorage
  const [storedValue, setStoredValue] = useState(() => {
    return getStoredValue(key, defaultValue);
  });

  // 使用 ref 来跟踪最新的值，避免闭包问题
  const storedValueRef = useRef(storedValue);
  
  // 同步更新 ref
  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  const setValue = useCallback((value) => {
    try {
      // 允许传入函数，使用 ref 获取最新值
      const valueToStore = value instanceof Function 
        ? value(storedValueRef.current) 
        : value;
      
      // 更新 state
      setStoredValue(valueToStore);
      
      // 更新 ref
      storedValueRef.current = valueToStore;
      
      // 持久化到 localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      console.log(`[localStorage] Saved "${key}":`, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
          storedValueRef.current = newValue;
        } catch (error) {
          console.error(`Error parsing storage change for "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
