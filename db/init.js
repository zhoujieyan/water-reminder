// 水宝提醒 - IndexedDB 数据库初始化
// 数据库名称和版本管理

const DB_NAME = 'water_reminder_db';
const DB_VERSION = 1;

/**
 * 打开或创建IndexedDB数据库
 * @returns {Promise<IDBDatabase>} 数据库实例
 */
export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('数据库打开失败:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            console.log('数据库打开成功:', DB_NAME);
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            console.log('数据库升级/初始化，版本:', event.oldVersion, '→', event.newVersion);
            const db = event.target.result;
            
            // 创建或更新对象仓库
            initObjectStores(db, event.oldVersion);
        };
    });
}

/**
 * 初始化所有对象仓库
 * @param {IDBDatabase} db 数据库实例
 * @param {number} oldVersion 旧版本号
 */
function initObjectStores(db, oldVersion) {
    // 从版本0开始创建所有表
    if (oldVersion < 1) {
        // 1. 喝水记录表
        if (!db.objectStoreNames.contains('records')) {
            const recordsStore = db.createObjectStore('records', { 
                keyPath: 'id',
                autoIncrement: true 
            });
            // 创建索引：按日期查询
            recordsStore.createIndex('date_idx', 'date', { unique: false });
            // 创建索引：按日期范围查询
            recordsStore.createIndex('date_range_idx', 'date', { unique: false });
            console.log('创建对象仓库: records');
        }
        
        // 2. 成就表
        if (!db.objectStoreNames.contains('achievements')) {
            const achievementsStore = db.createObjectStore('achievements', { 
                keyPath: 'id',
                autoIncrement: true 
            });
            // 创建索引：按解锁日期查询
            achievementsStore.createIndex('unlocked_date_idx', 'unlocked_date', { unique: false });
            // 创建索引：按成就名称查询
            achievementsStore.createIndex('name_idx', 'name', { unique: true });
            console.log('创建对象仓库: achievements');
        }
        
        // 3. 设置表
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { 
                keyPath: 'id' 
            });
            console.log('创建对象仓库: settings');
            
            // 初始化默认设置
            const defaultSettings = [
                { id: 'reminder_interval', value: 60, label: '提醒间隔（分钟）' },
                { id: 'daily_goal', value: 8, label: '每日目标（杯）' },
                { id: 'weather_enabled', value: true, label: '启用天气联动' },
                { id: 'notifications_enabled', value: true, label: '启用通知' },
                { id: 'sound_enabled', value: true, label: '启用声音提醒' }
            ];
            
            // 使用事务添加默认设置
            const transaction = db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            defaultSettings.forEach(setting => {
                store.put(setting);
            });
            
            transaction.oncomplete = () => {
                console.log('默认设置初始化完成');
            };
        }
    }
    
    // 后续版本升级逻辑可以在这里添加
    // if (oldVersion < 2) { ... }
}

/**
 * 删除数据库（主要用于测试和清理）
 * @returns {Promise<void>}
 */
export function deleteDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        
        request.onerror = () => {
            console.error('数据库删除失败:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            console.log('数据库删除成功:', DB_NAME);
            resolve();
        };
    });
}

/**
 * 检查数据库是否已存在
 * @returns {Promise<boolean>}
 */
export function checkDBExists() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME);
        
        request.onupgradeneeded = () => {
            // 如果触发onupgradeneeded，说明数据库不存在或需要创建
            request.transaction.abort();
            indexedDB.deleteDatabase(DB_NAME);
            resolve(false);
        };
        
        request.onsuccess = () => {
            const db = request.result;
            db.close();
            resolve(true);
        };
        
        request.onerror = () => {
            resolve(false);
        };
    });
}

// 导出数据库常量
export { DB_NAME, DB_VERSION };