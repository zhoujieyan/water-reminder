// 水宝提醒 - 提醒系统核心逻辑
// 版本: 1.0.0

// 从数据库导入CRUD函数
import { 
    getSetting, 
    updateSetting, 
    getOrCreateTodayRecord,
    addRecord,
    updateRecord 
} from '../db/crud.js';
import { openDB } from '../db/init.js';
import { getMessageGenerator } from './message-generator.js';

class ReminderSystem {
    constructor() {
        this.timer = null;
        this.nextReminderTime = null;
        this.isRunning = false;
        this.settings = {
            reminderInterval: 60, // 默认60分钟
            notificationsEnabled: true,
            soundEnabled: true,
            dailyGoal: 8
        };
        
        this.audioContext = null;
        this.audioBuffer = null;
        this.messageGenerator = getMessageGenerator();
        
        this.init();
    }
    
    async init() {
        console.log('💧 提醒系统初始化中...');
        
        // 加载用户设置
        await this.loadSettings();
        
        // 初始化音频
        this.initAudio();
        
        // 注册Service Worker消息监听
        this.registerServiceWorkerListeners();
        
        // 检查通知权限
        await this.checkNotificationPermission();
        
        // 启动提醒
        await this.start();
        
        console.log('✅ 提醒系统初始化完成');
    }
    
    async loadSettings() {
        try {
            // 从IndexedDB加载设置
            const interval = await getSetting('reminder_interval');
            const notifications = await getSetting('notifications_enabled');
            const sound = await getSetting('sound_enabled');
            const goal = await getSetting('daily_goal');
            
            this.settings = {
                reminderInterval: interval?.value || 60,
                notificationsEnabled: notifications?.value !== false, // 默认true
                soundEnabled: sound?.value !== false,
                dailyGoal: goal?.value || 8
            };
            
            console.log('📋 设置加载成功:', this.settings);
        } catch (error) {
            console.warn('⚠️ 加载设置失败，使用默认值:', error);
        }
    }
    
    async saveSettings() {
        try {
            await updateSetting('reminder_interval', this.settings.reminderInterval);
            await updateSetting('notifications_enabled', this.settings.notificationsEnabled);
            await updateSetting('sound_enabled', this.settings.soundEnabled);
            await updateSetting('daily_goal', this.settings.dailyGoal);
            console.log('📋 设置保存成功');
        } catch (error) {
            console.error('❌ 保存设置失败:', error);
        }
    }
    
    initAudio() {
        // 创建简单的提示音
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createBeepSound();
            }
        } catch (error) {
            console.warn('⚠️ 音频初始化失败:', error);
        }
    }
    
    createBeepSound() {
        // 创建简单的"叮"声
        if (!this.audioContext) return;
        
        const duration = 0.5;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSound() {
        if (!this.settings.soundEnabled || !this.audioContext) return;
        
        try {
            this.createBeepSound();
            console.log('🔊 播放提示音');
        } catch (error) {
            console.warn('⚠️ 播放声音失败:', error);
        }
    }
    
    async checkNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('⚠️ 浏览器不支持通知API');
            return false;
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('🔔 通知权限状态:', permission);
            return permission === 'granted';
        }
        
        return Notification.permission === 'granted';
    }
    
    async start() {
        if (this.isRunning) {
            console.warn('⚠️ 提醒系统已经在运行');
            return;
        }
        
        if (!this.settings.notificationsEnabled) {
            console.log('⏸️ 提醒功能已禁用');
            return;
        }
        
        this.isRunning = true;
        console.log('▶️ 提醒系统启动');
        
        // 计算下一次提醒时间
        this.scheduleNextReminder();
        
        // 注册后台同步
        await this.registerBackgroundSync();
    }
    
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        
        this.isRunning = false;
        this.nextReminderTime = null;
        console.log('⏹️ 提醒系统停止');
    }
    
    scheduleNextReminder() {
        if (!this.isRunning) return;
        
        // 清除现有定时器
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        const intervalMs = this.settings.reminderInterval * 60 * 1000;
        this.nextReminderTime = new Date(Date.now() + intervalMs);
        
        console.log(`⏰ 下次提醒时间: ${this.nextReminderTime.toLocaleTimeString()}`);
        
        this.timer = setTimeout(() => {
            this.triggerReminder();
            this.scheduleNextReminder(); // 为下一次提醒重新调度
        }, intervalMs);
    }
    
    async triggerReminder() {
        console.log('🔔 触发喝水提醒');
        
        // 播放声音
        this.playSound();
        
        // 发送浏览器通知
        await this.showNotification();
        
        // 如果应用在前台，也可以显示自定义UI弹窗
        await this.showInAppReminder();
    }
    
    async showNotification() {
        if (!this.settings.notificationsEnabled) return;
        
        // 检查权限
        if (Notification.permission !== 'granted') {
            console.warn('⚠️ 没有通知权限');
            return;
        }
        
        const title = '💧 水宝提醒';
        const body = await this.generateReminderMessage();
        const icon = './assets/icon-192.png';
        
        const options = {
            body,
            icon,
            badge: './assets/icon-72.png',
            vibrate: [200, 100, 200],
            tag: 'water-reminder', // 相同tag的通知会被替换
            renotify: true,
            requireInteraction: false,
            actions: [
                {
                    action: 'drink',
                    title: '💧 喝了一杯'
                },
                {
                    action: 'skip',
                    title: '⏭️ 跳过'
                },
                {
                    action: 'snooze',
                    title: '⏰ 10分钟后'
                }
            ],
            data: {
                timestamp: new Date().toISOString(),
                type: 'drink-reminder'
            }
        };
        
        // 使用Service Worker显示通知（如果可用）
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, options);
        } else {
            // 直接使用Notification API
            new Notification(title, options);
        }
        
        console.log('📨 通知已发送');
    }
    
    async generateReminderMessage() {
        try {
            // 使用消息生成器生成个性化提醒
            const message = await this.messageGenerator.generateReminderMessage();
            return message;
        } catch (error) {
            console.error('❌ 生成提醒消息失败，使用默认消息:', error);
            // 降级到默认消息
            const defaultMessages = [
                '该喝水啦！保持水分补充很重要哦~',
                '喝水时间到！来一杯清凉的水吧 💦',
                '水是生命之源，记得及时补充哦！'
            ];
            const randomIndex = Math.floor(Math.random() * defaultMessages.length);
            return defaultMessages[randomIndex];
        }
    }
    
    async showInAppReminder() {
        try {
            // 触发自定义UI弹窗显示
            const message = await this.generateReminderMessage();
            const event = new CustomEvent('reminderTriggered', {
                detail: {
                    time: new Date().toISOString(),
                    message: message
                }
            });
            window.dispatchEvent(event);
            
            console.log('📱 应用内提醒已触发');
        } catch (error) {
            console.error('❌ 应用内提醒失败:', error);
        }
    }
    
    async registerBackgroundSync() {
        if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
            console.log('⚠️ 浏览器不支持后台同步');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // 注册periodicSync（Chrome 80+）
            if ('periodicSync' in registration) {
                const status = await navigator.permissions.query({
                    name: 'periodic-background-sync'
                });
                
                if (status.state === 'granted') {
                    await registration.periodicSync.register('water-reminder', {
                        minInterval: this.settings.reminderInterval * 60 * 1000 // 最小间隔
                    });
                    console.log('🔄 周期性后台同步已注册');
                }
            }
        } catch (error) {
            console.warn('⚠️ 后台同步注册失败:', error);
        }
    }
    
    registerServiceWorkerListeners() {
        // 监听来自Service Worker的消息
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                    case 'REMINDER':
                        console.log('🔄 收到后台同步提醒:', data);
                        this.triggerReminder();
                        break;
                        
                    case 'UPDATE_SETTINGS':
                        console.log('🔄 收到设置更新:', data);
                        this.loadSettings().then(() => {
                            // 重启提醒系统
                            this.stop();
                            this.start();
                        });
                        break;
                }
            });
        }
    }
    
    // 用户操作处理
    async handleDrink() {
        console.log('💧 记录喝水');
        
        try {
            // 获取或创建今日记录
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = await getOrCreateTodayRecord(today, this.settings.dailyGoal);
            
            // 更新杯数
            const updatedRecord = {
                cups_drunk: (todayRecord.cups_drunk || 0) + 1,
                updated_at: new Date().toISOString()
            };
            
            // 保存到数据库
            await updateRecord(todayRecord.id, updatedRecord);
            
            console.log('✅ 喝水记录成功');
            
            // 触发UI更新事件
            window.dispatchEvent(new CustomEvent('drinkRecorded', {
                detail: { cups_drunk: updatedRecord.cups_drunk }
            }));
            
        } catch (error) {
            console.error('❌ 记录喝水失败:', error);
        }
    }
    
    handleSkip() {
        console.log('⏭️ 跳过本次提醒');
        // 可以记录跳过次数用于分析
    }
    
    handleSnooze(minutes = 10) {
        console.log(`⏰ 稍后提醒（${minutes}分钟）`);
        
        // 临时调整下一次提醒时间
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        this.nextReminderTime = new Date(Date.now() + minutes * 60 * 1000);
        
        this.timer = setTimeout(() => {
            this.triggerReminder();
            this.scheduleNextReminder(); // 恢复正常调度
        }, minutes * 60 * 1000);
        
        console.log(`⏰ 下次提醒时间: ${this.nextReminderTime.toLocaleTimeString()}`);
    }
    
    // 设置更新
    updateInterval(minutes) {
        if (minutes < 15 || minutes > 240) {
            console.error('❌ 无效的间隔时间，应在15-240分钟之间');
            return false;
        }
        
        this.settings.reminderInterval = minutes;
        this.saveSettings();
        
        // 重启提醒系统
        this.stop();
        this.start();
        
        console.log(`✅ 提醒间隔更新为 ${minutes} 分钟`);
        return true;
    }
    
    toggleNotifications(enabled) {
        this.settings.notificationsEnabled = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
        
        console.log(`🔔 通知功能 ${enabled ? '启用' : '禁用'}`);
    }
    
    toggleSound(enabled) {
        this.settings.soundEnabled = enabled;
        this.saveSettings();
        console.log(`🔊 声音提醒 ${enabled ? '启用' : '禁用'}`);
    }
    
    async updateDailyGoal(goal) {
        if (goal < 1 || goal > 20) {
            throw new Error('每日目标应在1-20杯之间');
        }
        
        this.settings.dailyGoal = goal;
        await this.saveSettings();
        console.log(`🎯 每日目标更新为 ${goal} 杯`);
        
        // 触发UI更新事件
        window.dispatchEvent(new CustomEvent('dailyGoalUpdated', {
            detail: { dailyGoal: goal }
        }));
    }
    
    // 获取状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextReminderTime: this.nextReminderTime,
            settings: this.settings
        };
    }
}

// 导出单例
let reminderInstance = null;

export function getReminderSystem() {
    if (!reminderInstance) {
        reminderInstance = new ReminderSystem();
    }
    return reminderInstance;
}

// 便捷导出
export default getReminderSystem;