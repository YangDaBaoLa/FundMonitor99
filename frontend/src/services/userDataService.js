/**
 * 用户数据服务
 * 与后端 API 交互，实现数据持久化到本地文件
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * 获取所有用户数据
 */
export async function getUserData() {
  try {
    const response = await api.get('/userdata');
    return response.data;
  } catch (error) {
    console.error('Failed to get user data:', error);
    throw error;
  }
}

/**
 * 保存所有用户数据
 */
export async function saveUserData(data) {
  try {
    const response = await api.post('/userdata', data);
    return response.data;
  } catch (error) {
    console.error('Failed to save user data:', error);
    throw error;
  }
}

/**
 * 获取自选基金列表
 */
export async function getWatchlist() {
  try {
    const response = await api.get('/userdata/watchlist');
    return response.data.watchlist;
  } catch (error) {
    console.error('Failed to get watchlist:', error);
    throw error;
  }
}

/**
 * 保存自选基金列表
 */
export async function saveWatchlist(watchlist) {
  try {
    const response = await api.post('/userdata/watchlist', { watchlist });
    return response.data;
  } catch (error) {
    console.error('Failed to save watchlist:', error);
    throw error;
  }
}

/**
 * 获取分组列表
 */
export async function getGroups() {
  try {
    const response = await api.get('/userdata/groups');
    return response.data.groups;
  } catch (error) {
    console.error('Failed to get groups:', error);
    throw error;
  }
}

/**
 * 保存分组列表
 */
export async function saveGroups(groups) {
  try {
    const response = await api.post('/userdata/groups', { groups });
    return response.data;
  } catch (error) {
    console.error('Failed to save groups:', error);
    throw error;
  }
}

/**
 * 获取用户设置
 */
export async function getSettings() {
  try {
    const response = await api.get('/userdata/settings');
    return response.data.settings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
}

/**
 * 保存用户设置
 */
export async function saveSettings(settings) {
  try {
    const response = await api.post('/userdata/settings', { settings });
    return response.data;
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}
