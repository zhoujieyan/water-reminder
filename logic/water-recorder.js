// 水宝提醒 - 喝水记录与进度追踪模块
// 基于IndexedDB实现数据持久化，提供实时进度计算和统计展示

import {
    getOrCreateTodayRecord,
    updateRecord,
    getSetting,
    updateSetting
} from '../db/crud.js';

/**
 * 喝水记录与进度追踪器
 * 负责管理当日的喝水记录、进度计算和数据持久化
 */
export class WaterRecorder {
    constructor() {
        this.state = {
            todayRecord: null,
            goal: 8,
            todayCount: 0,
            completionRate: 0,
            remainingCups: 8,
            weatherAdjustedGoal: 8,
            weatherAdjustment: 0
        };
        
        // 今天的日期（YYYY-MM-DD格式）
        this.today = this.getTodayDateString();
    }
    
    /**
     * 初始化记录器
     */
    async init() {
        console.log('💧 喝水记录器初始化...');
        
        try {
            // 加载当日记录
            await this.loadTodayRecord();
            
            // 加载用户设置
            await this.loadUserSettings();
            
            // 计算初始统计数据
            this.calculateStats();
            
            console.log('✅ 喝水记录器初始化完成', this.state);
            return true;
        } catch (error) {
            console.error('❌ 喝水记录器初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 获取今日日期字符串（YYYY-MM-DD）
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * 加载当日记录，如果没有则创建
     */
    async loadTodayRecord() {
        try {
            // 获取或创建今日记录
            const record = await getOrCreateTodayRecord(this.today, this.state.goal);
            this.state.todayRecord = record;
            this.state.todayCount = record.cups_drunk || 0;
            this.state.goal = record.goal || 8;
            this.state.weatherAdjustment = record.weather_adjustment || 0;
            
            console.log('📊 当日记录加载成功:', record);
        } catch (error) {
            console.error('❌ 加载当日记录失败:', error);
            throw error;
        }
    }
    
    /**
     * 加载用户设置
     */
    async loadUserSettings() {
        try {
            // 获取每日目标设置
            const goalSetting = await getSetting('daily_goal');
            if (goalSetting && goalSetting.value) {
                this.state.goal = parseInt(goalSetting.value) || 8;
            }
            
            // 如果有天气调整，更新目标
            this.state.weatherAdjustedGoal = this.state.goal + this.state.weatherAdjustment;
            
            console.log('⚙️ 用户设置加载成功，目标:', this.state.goal, '杯');
        } catch (error) {
            console.warn('⚠️ 加载用户设置失败，使用默认值:', error);
        }
    }
    
    /**
     * 记录一杯水
     * @returns {Promise<boolean>} 是否记录成功
     */
    async recordDrink() {
        try {
            // 增加杯数
            this.state.todayCount += 1;
            
            // 更新数据库记录
            if (this.state.todayRecord && this.state.todayRecord.id) {
                await updateRecord(this.state.todayRecord.id, {
                    cups_drunk: this.state.todayCount,
                    updated_at: new Date().toISOString()
                });
                
                // 更新本地记录对象
                this.state.todayRecord.cups_drunk = this.state.todayCount;
                this.state.todayRecord.updated_at = new Date().toISOString();
            } else {
                console.warn('⚠️ 记录ID不存在，可能为新创建记录');
            }
            
            // 重新计算统计数据
            this.calculateStats();
            
            console.log(`🥤 喝水记录成功！今日累计: ${this.state.todayCount}杯`);
            return true;
        } catch (error) {
            console.error('❌ 记录喝水失败:', error);
            return false;
        }
    }
    
    /**
     * 手动设置杯数（用于调试或修正）
     * @param {number} count 新的杯数
     */
    async setDrinkCount(count) {
        try {
            if (count < 0) count = 0;
            
            this.state.todayCount = count;
            
            // 更新数据库记录
            if (this.state.todayRecord && this.state.todayRecord.id) {
                await updateRecord(this.state.todayRecord.id, {
                    cups_drunk: count,
                    updated_at: new Date().toISOString()
                });
                
                // 更新本地记录对象
                this.state.todayRecord.cups_drunk = count;
                this.state.todayRecord.updated_at = new Date().toISOString();
            }
            
            // 重新计算统计数据
            this.calculateStats();
            
            console.log(`🔧 手动设置杯数: ${count}杯`);
            return true;
        } catch (error) {
            console.error('❌ 设置杯数失败:', error);
            return false;
        }
    }
    
    /**
     * 更新每日目标
     * @param {number} newGoal 新的每日目标杯数
     */
    async updateDailyGoal(newGoal) {
        try {
            if (newGoal < 1) newGoal = 1;
            
            this.state.goal = newGoal;
            this.state.weatherAdjustedGoal = newGoal + this.state.weatherAdjustment;
            
            // 更新数据库设置
            await updateSetting('daily_goal', newGoal);
            
            // 更新当日记录的目标值
            if (this.state.todayRecord && this.state.todayRecord.id) {
                await updateRecord(this.state.todayRecord.id, {
                    goal: newGoal,
                    updated_at: new Date().toISOString()
                });
                
                this.state.todayRecord.goal = newGoal;
            }
            
            // 重新计算统计数据
            this.calculateStats();
            
            console.log(`🎯 每日目标更新为: ${newGoal}杯`);
            return true;
        } catch (error) {
            console.error('❌ 更新每日目标失败:', error);
            return false;
        }
    }
    
    /**
     * 更新天气调整量
     * @param {number} adjustment 天气调整的杯数（可为正或负）
     */
    async updateWeatherAdjustment(adjustment) {
        try {
            this.state.weatherAdjustment = adjustment;
            this.state.weatherAdjustedGoal = this.state.goal + adjustment;
            
            // 更新当日记录
            if (this.state.todayRecord && this.state.todayRecord.id) {
                await updateRecord(this.state.todayRecord.id, {
                    weather_adjustment: adjustment,
                    updated_at: new Date().toISOString()
                });
                
                this.state.todayRecord.weather_adjustment = adjustment;
            }
            
            // 重新计算统计数据
            this.calculateStats();
            
            console.log(`🌤️ 天气调整量更新: ${adjustment}杯，调整后目标: ${this.state.weatherAdjustedGoal}杯`);
            return true;
        } catch (error) {
            console.error('❌ 更新天气调整量失败:', error);
            return false;
        }
    }
    
    /**
     * 计算统计数据
     */
    calculateStats() {
        const { todayCount, weatherAdjustedGoal } = this.state;
        
        // 计算完成率（基于调整后的目标）
        this.state.completionRate = weatherAdjustedGoal > 0 
            ? Math.min(100, (todayCount / weatherAdjustedGoal) * 100)
            : 0;
        
        // 计算剩余杯数
        this.state.remainingCups = Math.max(0, weatherAdjustedGoal - todayCount);
        
        // 确保数据有效性
        this.state.completionRate = Math.round(this.state.completionRate * 10) / 10;
    }
    
    /**
     * 获取当前状态
     */
    getState() {
        return {
            ...this.state,
            // 导出计算值
            todayDate: this.today,
            stats: {
                todayCount: this.state.todayCount,
                goal: this.state.goal,
                weatherAdjustedGoal: this.state.weatherAdjustedGoal,
                completionRate: this.state.completionRate,
                remainingCups: this.state.remainingCups,
                weatherAdjustment: this.state.weatherAdjustment
            }
        };
    }
    
    /**
     * 重置今日记录（用于测试）
     */
    async resetToday() {
        try {
            await this.setDrinkCount(0);
            console.log('🔄 今日记录已重置');
            return true;
        } catch (error) {
            console.error('❌ 重置今日记录失败:', error);
            return false;
        }
    }
}