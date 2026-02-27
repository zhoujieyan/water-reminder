// 水宝提醒 - IndexedDB CRUD操作封装
// 提供Promise化的数据库操作接口

import { openDB } from './init.js';

// ==================== 通用工具函数 ====================

/**
 * 执行数据库操作
 * @param {string} storeName 对象仓库名称
 * @param {string} mode 事务模式：'readonly' 或 'readwrite'
 * @param {Function} operation 操作函数，接收(store, resolve, reject)
 * @returns {Promise<any>} 操作结果
 */
function executeOperation(storeName, mode, operation) {
    return new Promise((resolve, reject) => {
        openDB()
            .then(db => {
                const transaction = db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                
                // 执行操作
                operation(store, resolve, reject);
                
                transaction.oncomplete = () => {
                    db.close();
                };
                
                transaction.onerror = () => {
                    console.error('事务执行失败:', transaction.error);
                    reject(transaction.error);
                    db.close();
                };
            })
            .catch(error => {
                console.error('数据库打开失败:', error);
                reject(error);
            });
    });
}

// ==================== 记录表操作 ====================

/**
 * 添加喝水记录
 * @param {Object} record 记录对象
 * @param {string} record.date 日期字符串（YYYY-MM-DD）
 * @param {number} record.cups_drunk 已喝杯数
 * @param {number} record.goal 当日目标杯数
 * @param {number} record.weather_adjustment 天气调整量
 * @returns {Promise<number>} 新记录的ID
 */
export function addRecord(record) {
    return executeOperation('records', 'readwrite', (store, resolve, reject) => {
        const request = store.add({
            date: record.date,
            cups_drunk: record.cups_drunk || 0,
            goal: record.goal || 8,
            weather_adjustment: record.weather_adjustment || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 获取指定日期的记录
 * @param {string} date 日期字符串（YYYY-MM-DD）
 * @returns {Promise<Array>} 记录数组
 */
export function getRecordsByDate(date) {
    return executeOperation('records', 'readonly', (store, resolve, reject) => {
        const index = store.index('date_idx');
        const range = IDBKeyRange.only(date);
        const request = index.getAll(range);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 获取日期范围内的记录
 * @param {string} startDate 开始日期（YYYY-MM-DD）
 * @param {string} endDate 结束日期（YYYY-MM-DD）
 * @returns {Promise<Array>} 记录数组
 */
export function getRecordsByDateRange(startDate, endDate) {
    return executeOperation('records', 'readonly', (store, resolve, reject) => {
        const index = store.index('date_range_idx');
        const range = IDBKeyRange.bound(startDate, endDate);
        const request = index.getAll(range);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 获取所有记录
 * @returns {Promise<Array>} 所有记录
 */
export function getAllRecords() {
    return executeOperation('records', 'readonly', (store, resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 更新记录
 * @param {number} id 记录ID
 * @param {Object} updates 更新字段
 * @returns {Promise<void>}
 */
export function updateRecord(id, updates) {
    return executeOperation('records', 'readwrite', (store, resolve, reject) => {
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
            const record = getRequest.result;
            if (!record) {
                reject(new Error(`记录不存在: ${id}`));
                return;
            }
            
            // 合并更新
            const updatedRecord = {
                ...record,
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            const putRequest = store.put(updatedRecord);
            
            putRequest.onsuccess = () => {
                resolve();
            };
            
            putRequest.onerror = () => {
                reject(putRequest.error);
            };
        };
        
        getRequest.onerror = () => {
            reject(getRequest.error);
        };
    });
}

/**
 * 删除记录
 * @param {number} id 记录ID
 * @returns {Promise<void>}
 */
export function deleteRecord(id) {
    return executeOperation('records', 'readwrite', (store, resolve, reject) => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// ==================== 成就表操作 ====================

/**
 * 添加成就
 * @param {Object} achievement 成就对象
 * @param {string} achievement.name 成就名称
 * @param {string} achievement.description 成就描述
 * @param {string} achievement.icon 图标名称或URL
 * @returns {Promise<number>} 新成就的ID
 */
export function addAchievement(achievement) {
    return executeOperation('achievements', 'readwrite', (store, resolve, reject) => {
        const request = store.add({
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon || 'badge-default',
            unlocked_date: achievement.unlocked_date || null,
            created_at: new Date().toISOString()
        });
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 获取所有成就
 * @returns {Promise<Array>} 成就数组
 */
export function getAllAchievements() {
    return executeOperation('achievements', 'readonly', (store, resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 获取已解锁的成就
 * @returns {Promise<Array>} 已解锁成就数组
 */
export function getUnlockedAchievements() {
    return executeOperation('achievements', 'readonly', (store, resolve, reject) => {
        const index = store.index('unlocked_date_idx');
        const range = IDBKeyRange.lowerBound(new Date(0).toISOString());
        const request = index.getAll(range);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 解锁成就
 * @param {number} id 成就ID
 * @returns {Promise<void>}
 */
export function unlockAchievement(id) {
    return executeOperation('achievements', 'readwrite', (store, resolve, reject) => {
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
            const achievement = getRequest.result;
            if (!achievement) {
                reject(new Error(`成就不存在: ${id}`));
                return;
            }
            
            // 如果已经解锁，不再重复解锁
            if (achievement.unlocked_date) {
                resolve();
                return;
            }
            
            achievement.unlocked_date = new Date().toISOString();
            achievement.updated_at = new Date().toISOString();
            
            const putRequest = store.put(achievement);
            
            putRequest.onsuccess = () => {
                resolve();
            };
            
            putRequest.onerror = () => {
                reject(putRequest.error);
            };
        };
        
        getRequest.onerror = () => {
            reject(getRequest.error);
        };
    });
}

/**
 * 按名称获取成就
 * @param {string} name 成就名称
 * @returns {Promise<Object|null>} 成就对象或null
 */
export function getAchievementByName(name) {
    return executeOperation('achievements', 'readonly', (store, resolve, reject) => {
        const index = store.index('name_idx');
        const request = index.get(name);
        
        request.onsuccess = () => {
            resolve(request.result || null);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// ==================== 设置表操作 ====================

/**
 * 获取所有设置
 * @returns {Promise<Array>} 设置数组
 */
export function getAllSettings() {
    return executeOperation('settings', 'readonly', (store, resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 获取单个设置项
 * @param {string} id 设置项ID
 * @returns {Promise<Object|null>} 设置对象或null
 */
export function getSetting(id) {
    return executeOperation('settings', 'readonly', (store, resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = () => {
            resolve(request.result || null);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 更新设置项
 * @param {string} id 设置项ID
 * @param {any} value 新的值
 * @returns {Promise<void>}
 */
export function updateSetting(id, value) {
    return executeOperation('settings', 'readwrite', (store, resolve, reject) => {
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
            let setting = getRequest.result;
            
            if (!setting) {
                // 如果设置项不存在，创建新的
                setting = {
                    id: id,
                    value: value,
                    label: id,
                    updated_at: new Date().toISOString()
                };
            } else {
                // 更新现有设置
                setting.value = value;
                setting.updated_at = new Date().toISOString();
            }
            
            const putRequest = store.put(setting);
            
            putRequest.onsuccess = () => {
                resolve();
            };
            
            putRequest.onerror = () => {
                reject(putRequest.error);
            };
        };
        
        getRequest.onerror = () => {
            reject(getRequest.error);
        };
    });
}

/**
 * 批量更新设置
 * @param {Object} settings 设置对象，键值对形式
 * @returns {Promise<void>}
 */
export function updateSettings(settings) {
    return executeOperation('settings', 'readwrite', (store, resolve, reject) => {
        const promises = Object.entries(settings).map(([id, value]) => {
            return new Promise((innerResolve, innerReject) => {
                const getRequest = store.get(id);
                
                getRequest.onsuccess = () => {
                    let setting = getRequest.result;
                    
                    if (!setting) {
                        setting = {
                            id: id,
                            value: value,
                            label: id,
                            updated_at: new Date().toISOString()
                        };
                    } else {
                        setting.value = value;
                        setting.updated_at = new Date().toISOString();
                    }
                    
                    const putRequest = store.put(setting);
                    
                    putRequest.onsuccess = () => {
                        innerResolve();
                    };
                    
                    putRequest.onerror = () => {
                        innerReject(putRequest.error);
                    };
                };
                
                getRequest.onerror = () => {
                    innerReject(getRequest.error);
                };
            });
        });
        
        Promise.all(promises)
            .then(() => resolve())
            .catch(error => reject(error));
    });
}

/**
 * 重置为默认设置
 * @returns {Promise<void>}
 */
export function resetToDefaultSettings() {
    return executeOperation('settings', 'readwrite', (store, resolve, reject) => {
        store.clear();
        
        const defaultSettings = [
            { id: 'reminder_interval', value: 60, label: '提醒间隔（分钟）' },
            { id: 'daily_goal', value: 8, label: '每日目标（杯）' },
            { id: 'weather_enabled', value: true, label: '启用天气联动' },
            { id: 'notifications_enabled', value: true, label: '启用通知' },
            { id: 'sound_enabled', value: true, label: '启用声音提醒' }
        ];
        
        defaultSettings.forEach(setting => {
            store.add(setting);
        });
        
        resolve();
    });
}

// ==================== 统计数据操作 ====================

/**
 * 获取今日记录（如果没有则创建）
 * @param {string} date 今日日期（YYYY-MM-DD）
 * @param {number} defaultGoal 默认目标杯数
 * @returns {Promise<Object>} 今日记录
 */
export async function getOrCreateTodayRecord(date, defaultGoal = 8) {
    const records = await getRecordsByDate(date);
    
    if (records.length > 0) {
        return records[0]; // 返回第一条记录（应该只有一条）
    }
    
    // 创建新的今日记录
    const id = await addRecord({
        date: date,
        cups_drunk: 0,
        goal: defaultGoal,
        weather_adjustment: 0
    });
    
    return {
        id: id,
        date: date,
        cups_drunk: 0,
        goal: defaultGoal,
        weather_adjustment: 0
    };
}

/**
 * 获取本周统计数据
 * @param {string} startDate 本周开始日期
 * @param {string} endDate 本周结束日期
 * @returns {Promise<Object>} 统计对象
 */
export async function getWeeklyStats(startDate, endDate) {
    const records = await getRecordsByDateRange(startDate, endDate);
    
    const stats = {
        total_days: records.length,
        total_cups: records.reduce((sum, record) => sum + record.cups_drunk, 0),
        average_cups: 0,
        goal_completion_rate: 0,
        best_day: null,
        worst_day: null
    };
    
    if (records.length > 0) {
        stats.average_cups = stats.total_cups / records.length;
        
        // 计算目标完成率
        const total_goal = records.reduce((sum, record) => sum + record.goal, 0);
        stats.goal_completion_rate = total_goal > 0 ? (stats.total_cups / total_goal) * 100 : 0;
        
        // 寻找最好和最差的日子
        const sortedByCups = [...records].sort((a, b) => b.cups_drunk - a.cups_drunk);
        if (sortedByCups.length > 0) {
            stats.best_day = sortedByCups[0];
            stats.worst_day = sortedByCups[sortedByCups.length - 1];
        }
    }
    
    return stats;
}