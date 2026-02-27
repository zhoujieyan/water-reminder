# 水宝提醒 - 本地存储框架

基于 IndexedDB 的本地存储解决方案，用于持久化喝水记录、用户设置和成就数据。

## 功能特性

- **数据库初始化**: 自动创建/升级数据库，初始化表结构和默认数据
- **CRUD 操作**: Promise 化的增删改查接口，支持事务
- **数据验证**: 类型检查、范围校验、批量验证
- **统计功能**: 按日期范围查询、周统计、进度计算

## 数据库设计

### 数据库信息
- 名称: `water_reminder_db`
- 版本: `1`

### 对象仓库（表）

#### 1. records - 喝水记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | 自增主键 | 记录唯一标识 |
| date | 字符串 | 日期 (YYYY-MM-DD) |
| cups_drunk | 整数 | 已喝杯数 |
| goal | 整数 | 当日目标杯数 |
| weather_adjustment | 整数 | 天气调整量 |
| created_at | 字符串 | 创建时间 |
| updated_at | 字符串 | 更新时间 |

**索引**:
- `date_idx`: 按日期查询
- `date_range_idx`: 按日期范围查询

#### 2. achievements - 成就表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | 自增主键 | 成就唯一标识 |
| name | 字符串 | 成就名称 (唯一) |
| description | 字符串 | 成就描述 |
| icon | 字符串 | 图标名称或URL |
| unlocked_date | 字符串 | 解锁时间 (null表示未解锁) |
| created_at | 字符串 | 创建时间 |

**索引**:
- `unlocked_date_idx`: 按解锁日期查询
- `name_idx`: 按成就名称查询 (唯一索引)

#### 3. settings - 设置表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | 字符串 | 设置项ID (主键) |
| value | 任意 | 设置值 |
| label | 字符串 | 显示标签 |
| updated_at | 字符串 | 更新时间 |

**默认设置项**:
- `reminder_interval`: 60 (提醒间隔，分钟)
- `daily_goal`: 8 (每日目标，杯)
- `weather_enabled`: true (启用天气联动)
- `notifications_enabled`: true (启用通知)
- `sound_enabled`: true (启用声音提醒)

## 快速开始

### 1. 导入模块
```javascript
import { openDB } from './src/db/init.js';
import { 
    addRecord, 
    getRecordsByDate,
    updateSetting 
} from './src/db/crud.js';
import { validateRecord } from './src/db/validation.js';
```

### 2. 初始化数据库
```javascript
// 打开数据库（如果不存在会自动创建）
const db = await openDB();
console.log('数据库已就绪:', db.name, db.version);
```

### 3. 基本操作示例

#### 添加喝水记录
```javascript
const today = new Date().toISOString().split('T')[0];
const record = {
    date: today,
    cups_drunk: 3,
    goal: 8,
    weather_adjustment: 1
};

// 先验证数据
const validation = validateRecord(record);
if (!validation.isValid) {
    console.error('数据无效:', validation.errors);
    return;
}

// 添加记录
const recordId = await addRecord(record);
console.log('记录添加成功，ID:', recordId);
```

#### 查询今日记录
```javascript
const today = new Date().toISOString().split('T')[0];
const records = await getRecordsByDate(today);
console.log('今日记录:', records);
```

#### 更新用户设置
```javascript
// 更改提醒间隔为45分钟
await updateSetting('reminder_interval', 45);

// 更改每日目标为10杯
await updateSetting('daily_goal', 10);
```

#### 获取或创建今日记录
```javascript
const today = new Date().toISOString().split('T')[0];
const todayRecord = await getOrCreateTodayRecord(today, 8);
console.log('今日记录:', todayRecord);
```

#### 获取本周统计
```javascript
const startDate = '2024-01-01';
const endDate = '2024-01-07';
const weeklyStats = await getWeeklyStats(startDate, endDate);
console.log('本周统计:', weeklyStats);
```

## API 参考

### 初始化模块 (`init.js`)

#### `openDB()`
打开或创建数据库。
- **返回**: `Promise<IDBDatabase>`

#### `deleteDB()`
删除整个数据库（主要用于测试）。
- **返回**: `Promise<void>`

#### `checkDBExists()`
检查数据库是否已存在。
- **返回**: `Promise<boolean>`

#### 常量
- `DB_NAME`: 数据库名称 (`'water_reminder_db'`)
- `DB_VERSION`: 数据库版本 (`1`)

### CRUD 操作模块 (`crud.js`)

#### 记录操作
- `addRecord(record)`: 添加记录
- `getRecordsByDate(date)`: 按日期查询
- `getRecordsByDateRange(startDate, endDate)`: 按日期范围查询
- `getAllRecords()`: 获取所有记录
- `updateRecord(id, updates)`: 更新记录
- `deleteRecord(id)`: 删除记录

#### 成就操作
- `addAchievement(achievement)`: 添加成就
- `getAllAchievements()`: 获取所有成就
- `getUnlockedAchievements()`: 获取已解锁成就
- `unlockAchievement(id)`: 解锁成就
- `getAchievementByName(name)`: 按名称查询成就

#### 设置操作
- `getAllSettings()`: 获取所有设置
- `getSetting(id)`: 获取单个设置项
- `updateSetting(id, value)`: 更新设置项
- `updateSettings(settings)`: 批量更新设置
- `resetToDefaultSettings()`: 重置为默认设置

#### 实用函数
- `getOrCreateTodayRecord(date, defaultGoal)`: 获取或创建今日记录
- `getWeeklyStats(startDate, endDate)`: 获取本周统计数据

### 数据验证模块 (`validation.js`)

#### 基础验证
- `isValidNumber(value, allowZero, allowNegative)`: 检查有效数字
- `isInteger(value)`: 检查整数
- `isValidDateString(dateStr)`: 检查日期格式

#### 记录验证
- `validateRecord(record)`: 验证记录数据
- `validateRecordId(id)`: 验证记录ID
- `validateRecordsBatch(records)`: 批量验证记录

#### 成就验证
- `validateAchievement(achievement)`: 验证成就数据
- `validateAchievementsBatch(achievements)`: 批量验证成就

#### 设置验证
- `validateSetting(setting)`: 验证设置对象
- `validateSettingValue(settingId, value)`: 验证设置值
- `validateSettingId(id)`: 验证设置ID

#### 实用验证
- `validateCups(cups, allowZero)`: 验证杯数范围
- `validateInterval(minutes)`: 验证时间间隔

## 数据验证规则

### 记录数据
- `date`: 必须为 `YYYY-MM-DD` 格式的有效日期
- `cups_drunk`: 非负整数，0-50范围
- `goal`: 正整数，1-20范围
- `weather_adjustment`: 整数，-5到5范围

### 设置数据
- `reminder_interval`: 正整数，15-240分钟
- `daily_goal`: 正整数，1-20杯
- 布尔值设置: 必须为 `true` 或 `false`

### 成就数据
- `name`: 非空字符串，最大100字符
- `description`: 非空字符串，最大500字符
- `icon`: 可选字符串，最大200字符
- `unlocked_date`: 可选的有效日期字符串

## 错误处理

所有API都返回Promise，使用标准的 `try-catch` 进行错误处理：

```javascript
try {
    const records = await getAllRecords();
    console.log('操作成功:', records);
} catch (error) {
    console.error('操作失败:', error);
    // 错误可能是:
    // - 数据库连接失败
    // - 事务执行失败
    // - 数据验证失败
    // - 权限问题（IndexedDB被禁用）
}
```

## 浏览器兼容性

- Chrome 23+
- Firefox 10+
- Safari 8+
- Edge 12+
- iOS Safari 8+
- Android Browser 4.4+

**注意**: 在隐私模式（无痕浏览）下，IndexedDB可能被限制或禁用。

## 测试

运行完整测试：
1. 打开 `outputs/db-test.html`
2. 点击 "运行全部测试" 按钮
3. 查看控制台输出和测试结果

测试内容包括：
- 数据库初始化
- 记录CRUD操作
- 成就管理功能
- 设置读写操作
- 数据验证工具

## 后续开发建议

1. **版本升级**: 当需要修改表结构时，增加 `DB_VERSION` 并在 `initObjectStores` 中添加升级逻辑
2. **数据迁移**: 考虑添加数据迁移工具，用于版本间数据格式转换
3. **备份恢复**: 实现数据库导出/导入功能，支持数据备份
4. **性能优化**: 对于大量数据，考虑分页查询和索引优化

## 许可证

本项目使用 MIT 许可证。