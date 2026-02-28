// 水宝提醒 - 成就系统模块
// 负责成就定义、检测、解锁和展示

import {
    getAllAchievements,
    addAchievement,
    unlockAchievement,
    getAchievementByName,
    getAllRecords,
    getRecordsByDateRange
} from '../db/crud.js';

/**
 * 成就系统管理器
 */
export class AchievementSystem {
    constructor() {
        this.achievements = [];
        this.initialized = false;
    }
    
    /**
     * 初始化成就系统
     */
    async init() {
        console.log('🏆 成就系统初始化...');
        
        try {
            // 加载所有成就定义
            await this.loadAchievements();
            
            // 如果还没有成就定义，创建默认成就
            if (this.achievements.length === 0) {
                await this.createDefaultAchievements();
                await this.loadAchievements(); // 重新加载
            }
            
            this.initialized = true;
            console.log('✅ 成就系统初始化完成，成就数量:', this.achievements.length);
            return true;
        } catch (error) {
            console.error('❌ 成就系统初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 从数据库加载成就定义
     */
    async loadAchievements() {
        try {
            const achievements = await getAllAchievements();
            this.achievements = achievements;
            console.log(`📊 加载了 ${achievements.length} 个成就定义`);
        } catch (error) {
            console.error('加载成就定义失败:', error);
            throw error;
        }
    }
    
    /**
     * 创建默认成就定义
     */
    async createDefaultAchievements() {
        console.log('创建默认成就定义...');
        
        const defaultAchievements = [
            {
                name: '初次喝水',
                description: '完成首次喝水记录',
                icon: '🥛',
                type: 'one_time',
                condition: { type: 'first_record' }
            },
            {
                name: '每日达标',
                description: '单日喝满目标杯数',
                icon: '🎯',
                type: 'daily',
                condition: { type: 'daily_goal_complete' }
            },
            {
                name: '连续打卡',
                description: '连续3天记录喝水',
                icon: '📅',
                type: 'streak',
                condition: { type: 'streak_days', days: 3 }
            },
            {
                name: '水杯达人',
                description: '累计喝满50杯水',
                icon: '👑',
                type: 'cumulative',
                condition: { type: 'total_cups', cups: 50 }
            },
            {
                name: '天气适应者',
                description: '根据天气调整达成目标',
                icon: '🌤️',
                type: 'conditional',
                condition: { type: 'weather_adjusted_goal' }
            },
            {
                name: '坚持之星',
                description: '连续7天记录喝水',
                icon: '⭐',
                type: 'streak',
                condition: { type: 'streak_days', days: 7 }
            },
            {
                name: '喝水冠军',
                description: '单日喝满12杯水',
                icon: '🏆',
                type: 'daily',
                condition: { type: 'daily_cups', cups: 12 }
            },
            {
                name: '早起喝水',
                description: '在早上8点前记录喝水',
                icon: '🌅',
                type: 'time_based',
                condition: { type: 'morning_drink' }
            }
        ];
        
        // 检查每个成就是否已存在，不存在则添加
        for (const achievementDef of defaultAchievements) {
            try {
                const existing = await getAchievementByName(achievementDef.name);
                if (!existing) {
                    await addAchievement({
                        name: achievementDef.name,
                        description: achievementDef.description,
                        icon: achievementDef.icon,
                        type: achievementDef.type,
                        condition: JSON.stringify(achievementDef.condition),
                        unlocked_date: null,
                        progress: 0,
                        target: this.getTargetFromCondition(achievementDef.condition)
                    });
                    console.log(`创建成就: ${achievementDef.name}`);
                }
            } catch (error) {
                console.error(`创建成就 ${achievementDef.name} 失败:`, error);
            }
        }
        
        console.log('默认成就定义创建完成');
    }
    
    /**
     * 从条件中提取目标值
     */
    getTargetFromCondition(condition) {
        switch (condition.type) {
            case 'streak_days':
                return condition.days;
            case 'total_cups':
                return condition.cups;
            case 'daily_cups':
                return condition.cups;
            default:
                return 1;
        }
    }
    
    /**
     * 获取所有成就（包括解锁状态）
     */
    async getAllAchievements() {
        if (!this.initialized) {
            await this.init();
        }
        return this.achievements;
    }
    
    /**
     * 获取已解锁的成就
     */
    async getUnlockedAchievements() {
        return this.achievements.filter(achievement => achievement.unlocked_date !== null);
    }
    
    /**
     * 获取待解锁的成就
     */
    async getLockedAchievements() {
        return this.achievements.filter(achievement => achievement.unlocked_date === null);
    }
    
    /**
     * 根据成就名称获取成就
     */
    async getAchievement(name) {
        return this.achievements.find(achievement => achievement.name === name);
    }
    
    /**
     * 检查并解锁成就
     * @param {Object} context 检查上下文，包含用户数据、记录等
     */
    async checkAndUnlockAchievements(context) {
        if (!this.initialized) {
            await this.init();
        }
        
        const unlockedAchievements = [];
        
        for (const achievement of this.achievements) {
            // 如果已经解锁，跳过
            if (achievement.unlocked_date) {
                continue;
            }
            
            // 检查成就条件
            const isUnlocked = await this.checkAchievementCondition(achievement, context);
            
            if (isUnlocked) {
                // 解锁成就
                await unlockAchievement(achievement.id);
                achievement.unlocked_date = new Date().toISOString();
                unlockedAchievements.push(achievement);
                console.log(`🎉 成就解锁: ${achievement.name}`);
            }
        }
        
        return unlockedAchievements;
    }
    
    /**
     * 检查单个成就条件
     */
    async checkAchievementCondition(achievement, context) {
        try {
            const condition = JSON.parse(achievement.condition || '{}');
            
            switch (condition.type) {
                case 'first_record':
                    // 初次喝水：检查总记录数
                    const allRecords = await getAllRecords();
                    return allRecords.length >= 1;
                    
                case 'daily_goal_complete':
                    // 每日达标：检查当日是否完成目标
                    const { todayCount, weatherAdjustedGoal } = context;
                    return todayCount >= weatherAdjustedGoal;
                    
                case 'streak_days': {
                    // 连续打卡：检查连续记录天数
                    const { streakDays } = context;
                    return streakDays >= condition.days;
                }
                    
                case 'total_cups': {
                    // 累计杯数：检查累计喝水量
                    const { totalCups } = context;
                    return totalCups >= condition.cups;
                }
                    
                case 'daily_cups': {
                    // 单日杯数：检查当日喝水量
                    const { todayCount } = context;
                    return todayCount >= condition.cups;
                }
                    
                case 'weather_adjusted_goal': {
                    // 天气适应者：在天气调整后仍完成目标
                    const { todayCount, weatherAdjustedGoal, weatherAdjustment } = context;
                    return weatherAdjustment !== 0 && todayCount >= weatherAdjustedGoal;
                }
                    
                case 'morning_drink': {
                    // 早起喝水：检查当前时间是否在早上8点前
                    const now = new Date();
                    const hour = now.getHours();
                    return hour < 8 && context.hasDrinkToday;
                }
                    
                default:
                    return false;
            }
        } catch (error) {
            console.error('检查成就条件失败:', error);
            return false;
        }
    }
    
    /**
     * 计算用户统计数据，用于成就检测
     */
    async calculateUserStats() {
        try {
            const allRecords = await getAllRecords();
            
            // 计算总杯数
            const totalCups = allRecords.reduce((sum, record) => sum + (record.cups_drunk || 0), 0);
            
            // 计算连续打卡天数
            const streakDays = await this.calculateStreakDays(allRecords);
            
            // 获取今日记录
            const today = new Date().toISOString().split('T')[0];
            const todayRecords = allRecords.filter(record => record.date === today);
            const todayCount = todayRecords.length > 0 ? todayRecords[0].cups_drunk || 0 : 0;
            
            return {
                totalCups,
                streakDays,
                todayCount,
                hasDrinkToday: todayCount > 0,
                totalRecords: allRecords.length
            };
        } catch (error) {
            console.error('计算用户统计数据失败:', error);
            return {
                totalCups: 0,
                streakDays: 0,
                todayCount: 0,
                hasDrinkToday: false,
                totalRecords: 0
            };
        }
    }
    
    /**
     * 计算连续打卡天数
     */
    async calculateStreakDays(allRecords) {
        if (allRecords.length === 0) {
            return 0;
        }
        
        // 按日期排序（从新到旧）
        const sortedRecords = [...allRecords].sort((a, b) => b.date.localeCompare(a.date));
        
        // 去重，每个日期只保留一条记录
        const uniqueDates = [];
        const seenDates = new Set();
        
        for (const record of sortedRecords) {
            if (!seenDates.has(record.date)) {
                seenDates.add(record.date);
                uniqueDates.push(record.date);
            }
        }
        
        // 检查连续日期
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date(today);
        
        for (let i = 0; i < uniqueDates.length; i++) {
            const recordDate = uniqueDates[i];
            const expectedDate = currentDate.toISOString().split('T')[0];
            
            if (recordDate === expectedDate) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    /**
     * 获取成就进度信息
     */
    async getAchievementProgress(achievement, context) {
        try {
            const condition = JSON.parse(achievement.condition || '{}');
            const userStats = await this.calculateUserStats();
            
            let current = 0;
            let target = achievement.target || 1;
            
            switch (condition.type) {
                case 'total_cups':
                    current = userStats.totalCups;
                    target = condition.cups;
                    break;
                    
                case 'streak_days':
                    current = userStats.streakDays;
                    target = condition.days;
                    break;
                    
                case 'daily_cups':
                    current = context.todayCount || 0;
                    target = condition.cups;
                    break;
                    
                default:
                    current = achievement.unlocked_date ? 1 : 0;
                    target = 1;
            }
            
            return {
                current,
                target,
                progress: Math.min(100, (current / target) * 100),
                unlocked: achievement.unlocked_date !== null
            };
        } catch (error) {
            console.error('获取成就进度失败:', error);
            return {
                current: 0,
                target: 1,
                progress: 0,
                unlocked: false
            };
        }
    }
}