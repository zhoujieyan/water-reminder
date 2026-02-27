// 水宝提醒 - 个性化消息生成器
// 根据成就进度、天气条件、时间段生成不同风格的喝水提醒文案

import { weatherService } from '../weather/weather-service.js';
import { AchievementSystem } from './achievement-system.js';
import { getOrCreateTodayRecord } from '../db/crud.js';

/**
 * 消息生成器配置
 */
const MESSAGE_CONFIG = {
    // 时间分段
    timeSegments: {
        morning: { start: 6, end: 12, name: '早上' },
        noon: { start: 12, end: 14, name: '中午' },
        afternoon: { start: 14, end: 18, name: '下午' },
        evening: { start: 18, end: 22, name: '晚上' },
        night: { start: 22, end: 6, name: '深夜' }
    },
    
    // 天气分类
    weatherCategories: {
        hot: { minTemp: 30, name: '炎热' },
        warm: { minTemp: 25, maxTemp: 30, name: '温暖' },
        comfortable: { minTemp: 18, maxTemp: 25, name: '舒适' },
        cool: { minTemp: 10, maxTemp: 18, name: '凉爽' },
        cold: { maxTemp: 10, name: '寒冷' }
    },
    
    // 风格定义
    styles: {
        humorous: '幽默风趣',
        scientific: '科普知识',
        encouraging: '鼓励加油',
        warm: '温馨提醒',
        cute: '可爱卖萌',
        serious: '认真严肃'
    }
};

/**
 * 消息生成器类
 */
export class MessageGenerator {
    constructor() {
        this.initialized = false;
        this.templates = null;
    }
    
    /**
     * 初始化消息生成器
     */
    async init() {
        console.log('💬 消息生成器初始化...');
        
        try {
            // 加载消息模板
            await this.loadTemplates();
            
            this.initialized = true;
            console.log('✅ 消息生成器初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 消息生成器初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 加载消息模板
     */
    async loadTemplates() {
        // 这里可以扩展为从外部文件加载模板
        // 暂时使用内置模板
        this.templates = this.getBuiltInTemplates();
        console.log(`📝 加载了 ${this.countTemplates()} 个消息模板`);
    }
    
    /**
     * 获取内置模板
     */
    getBuiltInTemplates() {
        return {
            // 幽默风趣风格
            humorous: {
                morning: [
                    "早上好！新的一天，水杯君已经迫不及待想要被填满啦~",
                    "早起的鸟儿有虫吃，早起的水杯有水喝！快来第一杯吧~",
                    "一日之计在于晨，一杯之饮在于你！准备好了吗？"
                ],
                afternoon: [
                    "下午茶时间到！不过今天我们喝健康的水茶如何？",
                    "工作累了吗？来杯水提提神，水杯在向你招手呢~",
                    "太阳当空照，水杯对你笑，说：该喝水啦！"
                ],
                evening: [
                    "晚餐前喝杯水，既能控制食欲，又能让水杯开心一晚上~",
                    "今天的KPI完成了吗？水杯的KPI等着你哦！"
                ],
                hot: [
                    "这么热的天，水杯都渴了，你还不喝点水吗？",
                    "温度爆表，水分告急！快来补充你的生命之源~"
                ],
                cold: [
                    "天冷了，但喝水不能冷！来杯温水暖暖身子吧~",
                    "虽然天气冷，但你的水杯依然热情似火等着你！"
                ]
            },
            
            // 科普知识风格
            scientific: {
                morning: [
                    "经过一夜睡眠，身体处于轻度脱水状态。早晨第一杯水有助于促进新陈代谢，唤醒身体机能。",
                    "早上6-8点是身体排毒的高峰期，适量饮水有助于毒素排出。"
                ],
                afternoon: [
                    "下午2-4点是人体的第二个疲劳期，补充水分可以提高注意力和工作效率。",
                    "每工作1小时，人体会通过呼吸和皮肤蒸发约50ml水分，及时补充很重要。"
                ],
                hot: [
                    "气温超过30°C时，人体每小时可通过出汗流失500ml以上水分，需增加饮水量。",
                    "高温环境下，水分蒸发加快，建议每30分钟补充100-200ml水。"
                ],
                achievement: [
                    "连续打卡有助于建立饮水习惯，研究表明21天可形成稳定习惯。",
                    "达成每日目标有助于维持身体水分平衡，促进细胞代谢。"
                ]
            },
            
            // 鼓励加油风格
            encouraging: {
                morning: [
                    "新的一天，新的开始！今天也要努力完成喝水目标哦，加油！",
                    "早上第一杯水，为一天的健康打下坚实基础，你可以做到的！"
                ],
                afternoon: [
                    "下午是坚持的关键时刻，再来一杯水，离目标更近一步！",
                    "工作再忙也要记得喝水，这是对自己健康的负责，坚持就是胜利！"
                ],
                achievement: [
                    "恭喜你连续打卡！继续保持，让健康成为你的习惯！",
                    "今日目标即将达成，再加把劲，胜利就在眼前！"
                ],
                progress: [
                    "已经完成{{progress}}%的目标，真棒！继续保持这个势头！",
                    "今天已经喝了{{cups}}杯水，离目标只差{{remaining}}杯了，加油！"
                ]
            },
            
            // 温馨提醒风格
            warm: {
                morning: [
                    "早上好，记得喝杯温水，让身体慢慢苏醒过来~",
                    "新的一天开始了，先喝杯水润润喉咙吧，对身体好哦。"
                ],
                afternoon: [
                    "忙了一上午，该放松一下啦。喝杯水，休息片刻吧~",
                    "下午阳光正好，喝杯水补充一下水分吧。"
                ],
                evening: [
                    "晚餐前喝杯水，可以帮助控制食量，对身体有益哦~",
                    "晚上记得适量喝水，但别喝太多影响睡眠。"
                ],
                general: [
                    "水是生命之源，记得及时补充水分，照顾好自己~",
                    "再忙也要记得喝水，身体健康最重要。"
                ]
            },
            
            // 可爱卖萌风格
            cute: {
                morning: [
                    "水宝醒来啦！早上好呀，要一起喝杯水开始新的一天吗？(✧ω✧)",
                    "咕噜咕噜~水杯空空，主人快来填满我吧！(๑>ᴗ<๑)"
                ],
                afternoon: [
                    "工作累了吗？水宝给你加油打气！来杯水放松一下吧~ (•̀ω•́)✧",
                    "太阳公公晒，水宝有点渴，主人陪我喝水好不好？(っ◕‿◕)っ"
                ],
                evening: [
                    "晚餐时间到！水宝提醒：先喝水再吃饭更健康哦~ ᕕ( ᐛ )ᕗ",
                    "今天和水宝一起努力喝水，真是棒棒哒！明天也要继续哦！ (๑•̀ㅂ•́)و✧"
                ]
            },
            
            // 认真严肃风格
            serious: {
                morning: [
                    "晨起饮水有助于降低血液粘稠度，预防心血管疾病。",
                    "早晨空腹喝水可促进肠胃蠕动，预防便秘。"
                ],
                hot: [
                    "高温环境下，脱水可能引发中暑，请务必增加水分摄入。",
                    "体温调节依赖水分蒸发，高温时需保持充足饮水。"
                ],
                general: [
                    "饮水不足可能导致疲劳、头痛、注意力不集中。",
                    "成年人每日建议饮水量为1500-2000ml，请确保达标。"
                ]
            }
        };
    }
    
    /**
     * 计算模板总数
     */
    countTemplates() {
        let count = 0;
        for (const style in this.templates) {
            for (const category in this.templates[style]) {
                count += this.templates[style][category].length;
            }
        }
        return count;
    }
    
    /**
     * 获取当前时间段分类
     */
    getCurrentTimeSegment() {
        const hour = new Date().getHours();
        const { timeSegments } = MESSAGE_CONFIG;
        
        for (const [key, segment] of Object.entries(timeSegments)) {
            if (key === 'night') {
                // 夜间特殊处理（跨天）
                if (hour >= segment.start || hour < segment.end) {
                    return key;
                }
            } else if (hour >= segment.start && hour < segment.end) {
                return key;
            }
        }
        
        return 'afternoon'; // 默认值
    }
    
    /**
     * 根据温度获取天气分类
     */
    getWeatherCategory(temperature) {
        const { weatherCategories } = MESSAGE_CONFIG;
        
        for (const [key, category] of Object.entries(weatherCategories)) {
            const meetsMin = category.minTemp === undefined || temperature >= category.minTemp;
            const meetsMax = category.maxTemp === undefined || temperature < category.maxTemp;
            
            if (meetsMin && meetsMax) {
                return key;
            }
        }
        
        return 'comfortable'; // 默认值
    }
    
    /**
     * 分析当前上下文
     */
    async analyzeContext() {
        try {
            // 获取天气数据
            const weatherData = await weatherService.getWeatherData();
            const temperature = weatherData.temperature;
            
            // 获取时间段
            const timeSegment = this.getCurrentTimeSegment();
            
            // 获取成就数据
            const achievementSystem = new AchievementSystem();
            await achievementSystem.init();
            const userStats = await achievementSystem.calculateUserStats();
            
            // 获取已解锁成就数
            const unlockedAchievements = await achievementSystem.getUnlockedAchievements();
            
            // 获取今日记录和进度
            const today = new Date().toISOString().split('T')[0];
            let todayRecord;
            try {
                todayRecord = await getOrCreateTodayRecord(today, 8); // 默认目标8杯
            } catch (error) {
                console.warn('获取今日记录失败:', error);
                todayRecord = { cups_drunk: 0, goal: 8 };
            }
            
            const dailyGoalProgress = todayRecord.goal > 0 ? todayRecord.cups_drunk / todayRecord.goal : 0;
            
            // 获取最近解锁的成就
            let recentAchievement = null;
            if (unlockedAchievements.length > 0) {
                // 按解锁时间排序，取最新的
                const sorted = unlockedAchievements.sort((a, b) => 
                    new Date(b.unlocked_date) - new Date(a.unlocked_date)
                );
                recentAchievement = sorted[0].name;
            }
            
            return {
                timeSegment,
                temperature,
                weatherCategory: this.getWeatherCategory(temperature),
                weatherCondition: weatherData.condition,
                unlockedCount: unlockedAchievements.length,
                recentAchievement,
                streakDays: userStats.streakDays,
                dailyGoalProgress
            };
        } catch (error) {
            console.error('分析上下文失败:', error);
            // 返回默认上下文
            return {
                timeSegment: this.getCurrentTimeSegment(),
                temperature: 25,
                weatherCategory: 'comfortable',
                weatherCondition: '晴',
                unlockedCount: 0,
                recentAchievement: null,
                streakDays: 0,
                dailyGoalProgress: 0
            };
        }
    }
    
    /**
     * 生成提醒消息
     * @param {Object} context - 可选，如果不提供则自动分析
     * @returns {Promise<string>} 生成的提醒消息
     */
    async generateReminderMessage(context = null) {
        if (!this.initialized) {
            await this.init();
        }
        
        // 分析上下文（如果未提供）
        const ctx = context || await this.analyzeContext();
        
        // 根据上下文选择合适的风格
        const style = this.selectStyle(ctx);
        
        // 获取适用的模板类别
        const categories = this.getApplicableCategories(ctx);
        
        // 收集候选模板
        const candidates = [];
        
        for (const category of categories) {
            if (this.templates[style] && this.templates[style][category]) {
                candidates.push(...this.templates[style][category]);
            }
        }
        
        // 如果该风格没有合适模板，使用默认风格
        if (candidates.length === 0) {
            console.log('⚠️ 当前风格无合适模板，使用温馨提醒风格');
            return this.generateReminderMessage({ ...ctx, forcedStyle: 'warm' });
        }
        
        // 随机选择一条消息
        const randomIndex = Math.floor(Math.random() * candidates.length);
        let message = candidates[randomIndex];
        
        // 替换模板变量
        message = this.replaceTemplateVariables(message, ctx);
        
        console.log(`💬 生成消息: 风格=${style}, 时间段=${ctx.timeSegment}, 温度=${ctx.temperature}°C`);
        return message;
    }
    
    /**
     * 根据上下文选择合适的风格
     */
    selectStyle(ctx) {
        // 如果强制指定了风格，直接返回
        if (ctx.forcedStyle) {
            return ctx.forcedStyle;
        }
        
        // 根据条件选择风格
        const { timeSegment, temperature, unlockedCount, streakDays } = ctx;
        
        // 时间因素
        if (timeSegment === 'morning') {
            return Math.random() > 0.5 ? 'encouraging' : 'cute';
        } else if (timeSegment === 'afternoon') {
            return Math.random() > 0.5 ? 'humorous' : 'warm';
        } else if (timeSegment === 'evening') {
            return 'warm';
        } else if (timeSegment === 'night') {
            return 'serious';
        }
        
        // 温度因素
        if (temperature >= 30) {
            return Math.random() > 0.5 ? 'scientific' : 'humorous';
        } else if (temperature <= 10) {
            return 'warm';
        }
        
        // 成就因素
        if (unlockedCount >= 5 || streakDays >= 7) {
            return 'encouraging';
        }
        
        // 默认随机选择
        const styles = Object.keys(MESSAGE_CONFIG.styles);
        const randomIndex = Math.floor(Math.random() * styles.length);
        return styles[randomIndex];
    }
    
    /**
     * 获取适用的模板类别
     */
    getApplicableCategories(ctx) {
        const categories = [];
        
        // 时间类别
        categories.push(ctx.timeSegment);
        
        // 天气类别
        categories.push(ctx.weatherCategory);
        
        // 成就类别
        if (ctx.unlockedCount > 0) {
            categories.push('achievement');
        }
        
        if (ctx.dailyGoalProgress > 0) {
            categories.push('progress');
        }
        
        // 通用类别
        categories.push('general');
        
        return categories;
    }
    
    /**
     * 替换模板变量
     */
    replaceTemplateVariables(message, ctx) {
        // 简单的变量替换
        return message
            .replace('{{progress}}', Math.round(ctx.dailyGoalProgress * 100))
            .replace('{{cups}}', Math.round(ctx.dailyGoalProgress * 8))
            .replace('{{remaining}}', Math.round(8 - (ctx.dailyGoalProgress * 8)));
    }
    
    /**
     * 生成测试用例
     */
    async generateTestCases() {
        const testCases = [];
        
        // 测试不同的时间段
        const testTimes = [
            { hour: 8, desc: '早晨' },
            { hour: 13, desc: '中午' },
            { hour: 16, desc: '下午' },
            { hour: 20, desc: '晚上' },
            { hour: 23, desc: '深夜' }
        ];
        
        // 测试不同的温度
        const testTemps = [35, 28, 22, 15, 5];
        
        // 测试不同的成就状态
        const testAchievements = [
            { unlockedCount: 0, streakDays: 1, desc: '新用户' },
            { unlockedCount: 3, streakDays: 5, desc: '活跃用户' },
            { unlockedCount: 8, streakDays: 15, desc: '资深用户' }
        ];
        
        // 生成测试用例
        for (const time of testTimes) {
            for (const temp of testTemps) {
                for (const achievement of testAchievements) {
                    const context = {
                        timeSegment: this.getTimeSegmentByHour(time.hour),
                        temperature: temp,
                        weatherCategory: this.getWeatherCategory(temp),
                        weatherCondition: temp >= 30 ? '晴' : '多云',
                        ...achievement,
                        dailyGoalProgress: 0.6
                    };
                    
                    const message = await this.generateReminderMessage(context);
                    
                    testCases.push({
                        时间: time.desc,
                        温度: `${temp}°C`,
                        用户类型: achievement.desc,
                        生成消息: message
                    });
                }
            }
        }
        
        return testCases;
    }
    
    /**
     * 根据小时获取时间段
     */
    getTimeSegmentByHour(hour) {
        const { timeSegments } = MESSAGE_CONFIG;
        
        for (const [key, segment] of Object.entries(timeSegments)) {
            if (key === 'night') {
                if (hour >= segment.start || hour < segment.end) {
                    return key;
                }
            } else if (hour >= segment.start && hour < segment.end) {
                return key;
            }
        }
        
        return 'afternoon';
    }
}

// 导出单例实例
let messageGeneratorInstance = null;

export function getMessageGenerator() {
    if (!messageGeneratorInstance) {
        messageGeneratorInstance = new MessageGenerator();
    }
    return messageGeneratorInstance;
}

// 便捷导出
export default getMessageGenerator;