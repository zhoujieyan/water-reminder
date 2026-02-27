// 水宝提醒 - 集成版主应用逻辑
// 包含PWA注册、喝水记录、进度追踪和UI更新

import { WaterRecorder } from './logic/water-recorder.js';

console.log('💧 水宝提醒应用启动中...');

// ==================== PWA 注册逻辑 ====================
if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('ServiceWorker 注册成功:', registration.scope);
            
            // 检查更新
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('ServiceWorker 更新发现:', newWorker.state);
            });
            
        } catch (error) {
            console.error('ServiceWorker 注册失败:', error);
        }
    });
}

// ==================== 应用状态管理 ====================
class WaterReminderApp {
    constructor() {
        this.waterRecorder = new WaterRecorder();
        this.achievements = [];
        this.settings = {
            reminderInterval: 60, // 分钟
            enableSound: true,
            enableWeather: true,
            enableNotifications: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('初始化水宝提醒应用...');
        
        try {
            // 初始化喝水记录器
            const recorderInit = await this.waterRecorder.init();
            if (!recorderInit) {
                throw new Error('喝水记录器初始化失败');
            }
            
            // 绑定事件
            this.bindEvents();
            
            // 更新UI
            this.updateUI();
            
            // 检查提醒权限
            this.checkNotificationPermission();
            
            // 初始化天气模块（占位）
            this.initWeatherModule();
            
            console.log('✅ 应用初始化完成！');
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            // 显示错误提示
            this.showErrorMessage('应用初始化失败，请刷新页面重试');
        }
    }
    
    bindEvents() {
        // 喝水按钮
        const drinkBtn = document.getElementById('drinkBtn');
        if (drinkBtn) {
            drinkBtn.addEventListener('click', () => this.handleDrink());
        }
        
        // 设置按钮
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        // 历史记录按钮
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.openHistory());
        }
        
        // 离线检测
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // 添加到主屏幕检测
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            console.log('PWA 安装提示可用');
            // 保存事件供后续使用
            this.deferredPrompt = e;
        });
        
        // 测试按钮（开发环境）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.addDebugButtons();
        }
    }
    
    /**
     * 处理喝水记录
     */
    async handleDrink() {
        console.log('🥤 记录喝水...');
        
        // 播放动画反馈
        this.playDrinkAnimation();
        
        // 记录到数据库
        const success = await this.waterRecorder.recordDrink();
        
        if (success) {
            // 更新UI
            this.updateUI();
            
            // 检查成就
            this.checkAchievements();
            
            // 显示成功反馈
            this.showToast('喝水记录成功！', 'success');
        } else {
            this.showToast('记录失败，请重试', 'error');
        }
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        const state = this.waterRecorder.getState();
        const stats = state.stats;
        
        console.log('🔄 更新UI，统计数据:', stats);
        
        // 更新今日计数
        const todayCountEl = document.getElementById('todayCount');
        if (todayCountEl) {
            todayCountEl.textContent = `${stats.todayCount} 杯`;
        }
        
        // 更新目标
        const targetCountEl = document.getElementById('targetCount');
        if (targetCountEl) {
            targetCountEl.textContent = `${stats.weatherAdjustedGoal} 杯`;
        }
        
        // 更新完成率
        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl) {
            completionRateEl.textContent = `${stats.completionRate}%`;
        }
        
        // 更新进度条
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${stats.completionRate}%`;
            
            // 添加平滑过渡效果
            progressBar.style.transition = 'width 0.5s ease';
        }
        
        // 更新进度文本
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = `${stats.todayCount}/${stats.weatherAdjustedGoal} 杯`;
        }
        
        // 更新水杯水位
        const waterLevel = document.getElementById('waterLevel');
        if (waterLevel) {
            const waterHeight = Math.min(100, stats.completionRate);
            waterLevel.style.height = `${waterHeight}%`;
            waterLevel.style.transition = 'height 0.5s ease';
        }
        
        // 更新水杯表情
        const cupFace = document.getElementById('cupFace');
        if (cupFace) {
            if (stats.completionRate >= 100) {
                cupFace.textContent = '🎉';
            } else if (stats.completionRate >= 75) {
                cupFace.textContent = '😄';
            } else if (stats.completionRate >= 50) {
                cupFace.textContent = '😊';
            } else if (stats.completionRate >= 25) {
                cupFace.textContent = '😐';
            } else {
                cupFace.textContent = '😟';
            }
        }
        
        // 更新状态文本
        const statusText = document.getElementById('statusText');
        if (statusText) {
            if (stats.todayCount === 0) {
                statusText.textContent = '今天还没喝水呢，快开始吧！';
            } else if (stats.completionRate >= 100) {
                statusText.textContent = '太棒了！今日目标已完成！🎊';
            } else {
                statusText.textContent = `加油！还需要喝 ${stats.remainingCups} 杯水~`;
            }
        }
        
        // 更新详细统计信息（如果存在）
        this.updateDetailedStats(stats);
    }
    
    /**
     * 更新详细统计信息
     */
    updateDetailedStats(stats) {
        // 检查是否存在详细统计元素，如果不存在则创建
        let detailedStatsEl = document.getElementById('detailedStats');
        
        if (!detailedStatsEl) {
            // 创建详细统计区域
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                detailedStatsEl = document.createElement('div');
                detailedStatsEl.id = 'detailedStats';
                detailedStatsEl.className = 'detailed-stats';
                detailedStatsEl.innerHTML = `
                    <div class="stat-row">
                        <span class="stat-label">基础目标：</span>
                        <span class="stat-value" id="baseGoal">${stats.goal}杯</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">天气调整：</span>
                        <span class="stat-value" id="weatherAdjustment">${stats.weatherAdjustment > 0 ? '+' : ''}${stats.weatherAdjustment}杯</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">剩余杯数：</span>
                        <span class="stat-value" id="remainingCups">${stats.remainingCups}杯</span>
                    </div>
                `;
                
                // 插入到统计区域后面
                statsSection.parentNode.insertBefore(detailedStatsEl, statsSection.nextSibling);
            }
        } else {
            // 更新现有元素
            const baseGoalEl = document.getElementById('baseGoal');
            const weatherAdjustmentEl = document.getElementById('weatherAdjustment');
            const remainingCupsEl = document.getElementById('remainingCups');
            
            if (baseGoalEl) baseGoalEl.textContent = `${stats.goal}杯`;
            if (weatherAdjustmentEl) weatherAdjustmentEl.textContent = `${stats.weatherAdjustment > 0 ? '+' : ''}${stats.weatherAdjustment}杯`;
            if (remainingCupsEl) remainingCupsEl.textContent = `${stats.remainingCups}杯`;
        }
    }
    
    /**
     * 播放喝水动画
     */
    playDrinkAnimation() {
        // 水杯弹跳动画
        const cup = document.getElementById('cup');
        if (cup) {
            cup.classList.remove('bounce');
            void cup.offsetWidth; // 触发重绘
            cup.classList.add('bounce');
            
            // 动画结束后移除类
            setTimeout(() => {
                cup.classList.remove('bounce');
            }, 500);
        }
        
        // 按钮脉冲反馈
        const drinkBtn = document.getElementById('drinkBtn');
        if (drinkBtn) {
            drinkBtn.classList.add('pulse');
            setTimeout(() => drinkBtn.classList.remove('pulse'), 1000);
        }
        
        // 添加水滴飞溅效果
        this.addWaterSplashEffect();
    }
    
    /**
     * 添加水滴飞溅效果
     */
    addWaterSplashEffect() {
        const cupContainer = document.querySelector('.cup-container');
        if (!cupContainer) return;
        
        // 创建多个水滴元素
        for (let i = 0; i < 5; i++) {
            const drop = document.createElement('div');
            drop.className = 'water-drop';
            
            // 随机位置和动画延迟
            const startX = 50 + (Math.random() * 20 - 10);
            const startY = 50 + (Math.random() * 20 - 10);
            const delay = Math.random() * 0.3;
            
            drop.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: var(--primary-blue-light);
                border-radius: 50%;
                left: ${startX}%;
                top: ${startY}%;
                opacity: 0.8;
                animation: drop-splash 0.8s ease-out ${delay}s forwards;
                z-index: 10;
            `;
            
            cupContainer.appendChild(drop);
            
            // 动画结束后移除元素
            setTimeout(() => {
                if (drop.parentNode) {
                    drop.parentNode.removeChild(drop);
                }
            }, 1000 + delay * 1000);
        }
    }
    
    /**
     * 检查成就
     */
    checkAchievements() {
        const state = this.waterRecorder.getState();
        const stats = state.stats;
        
        const newAchievements = [];
        
        // 示例成就：第一次喝水
        if (stats.todayCount === 1) {
            newAchievements.push({ 
                id: 'first_drink', 
                name: '第一杯水', 
                description: '喝下今天的第一杯水！',
                icon: '🥛'
            });
        }
        
        // 示例成就：完成一半
        if (stats.todayCount === Math.floor(stats.weatherAdjustedGoal / 2)) {
            newAchievements.push({ 
                id: 'halfway', 
                name: '半程达成', 
                description: '完成今日目标的一半！',
                icon: '🎯'
            });
        }
        
        // 示例成就：目标达成
        if (stats.completionRate >= 100) {
            newAchievements.push({ 
                id: 'goal_achieved', 
                name: '目标达成！', 
                description: '恭喜完成今日喝水目标！',
                icon: '🏆'
            });
        }
        
        if (newAchievements.length > 0) {
            this.achievements.push(...newAchievements);
            this.showAchievementNotification(newAchievements);
        }
    }
    
    /**
     * 显示成就通知
     */
    showAchievementNotification(achievements) {
        console.log('🎉 新成就解锁:', achievements);
        
        // 创建成就通知元素
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        // 如果是多个成就，只显示第一个
        const achievement = achievements[0];
        
        notification.innerHTML = `
            <div class="achievement-badge">${achievement.icon}</div>
            <div class="achievement-content">
                <h3>成就解锁！</h3>
                <p><strong>${achievement.name}</strong></p>
                <p>${achievement.description}</p>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 1000;
            animation: slide-in 0.5s ease;
            border: 3px solid var(--accent-yellow);
            max-width: 320px;
        `;
        
        document.body.appendChild(notification);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slide-out 0.5s ease forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 5000);
    }
    
    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: fade-in 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'fade-out 0.3s ease forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    /**
     * 显示错误消息
     */
    showErrorMessage(message) {
        const errorEl = document.createElement('div');
        errorEl.id = 'app-error';
        errorEl.innerHTML = `
            <div style="padding: 16px; background: #ffebee; color: #c62828; border-radius: 8px; margin: 16px; text-align: center;">
                <strong>⚠️ 错误：</strong> ${message}
                <button id="retryBtn" style="margin-left: 12px; padding: 4px 12px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    重试
                </button>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.prepend(errorEl);
            
            // 绑定重试按钮事件
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    location.reload();
                });
            }
        }
    }
    
    async checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    console.log('通知权限状态:', permission);
                } catch (error) {
                    console.error('请求通知权限失败:', error);
                }
            }
        }
    }
    
    initWeatherModule() {
        const weatherInfo = document.getElementById('weatherInfo');
        const waterRecommendation = document.getElementById('waterRecommendation');
        
        if (weatherInfo && waterRecommendation) {
            // 模拟天气数据
            setTimeout(() => {
                weatherInfo.textContent = '晴，25°C，湿度60%';
                waterRecommendation.textContent = '推荐喝水量：2200ml (约11杯)';
                
                // 根据天气模拟调整目标
                // 温度高时增加推荐量
                this.waterRecorder.updateWeatherAdjustment(2); // 增加2杯
            }, 1000);
        }
    }
    
    openSettings() {
        console.log('打开设置页面');
        this.showToast('设置功能开发中...', 'info');
    }
    
    openHistory() {
        console.log('打开历史记录');
        this.showToast('历史记录功能开发中...', 'info');
    }
    
    handleOnline() {
        console.log('网络已恢复');
        this.showToast('网络连接已恢复', 'success');
    }
    
    handleOffline() {
        console.log('网络断开');
        this.showToast('网络连接已断开，正在使用离线模式', 'warning');
    }
    
    // 安装PWA到主屏幕
    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`安装结果: ${outcome}`);
            this.deferredPrompt = null;
        }
    }
    
    /**
     * 添加调试按钮（仅开发环境）
     */
    addDebugButtons() {
        const actionSection = document.querySelector('.action-section');
        if (!actionSection) return;
        
        // 创建调试按钮容器
        const debugContainer = document.createElement('div');
        debugContainer.className = 'debug-buttons';
        debugContainer.innerHTML = `
            <h4 style="margin: 16px 0 8px; color: #666; font-size: 14px;">🧪 调试工具</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-secondary" id="debugReset">重置今日</button>
                <button class="btn btn-secondary" id="debugAdd5">+5杯</button>
                <button class="btn btn-secondary" id="debugSetGoal">目标:10杯</button>
                <button class="btn btn-secondary" id="debugShowState">显示状态</button>
            </div>
        `;
        
        actionSection.parentNode.insertBefore(debugContainer, actionSection.nextSibling);
        
        // 绑定调试按钮事件
        const debugReset = document.getElementById('debugReset');
        const debugAdd5 = document.getElementById('debugAdd5');
        const debugSetGoal = document.getElementById('debugSetGoal');
        const debugShowState = document.getElementById('debugShowState');
        
        if (debugReset) {
            debugReset.addEventListener('click', async () => {
                await this.waterRecorder.resetToday();
                this.updateUI();
                this.showToast('今日记录已重置', 'info');
            });
        }
        
        if (debugAdd5) {
            debugAdd5.addEventListener('click', async () => {
                const current = this.waterRecorder.getState().stats.todayCount;
                await this.waterRecorder.setDrinkCount(current + 5);
                this.updateUI();
                this.showToast('已添加5杯水', 'success');
            });
        }
        
        if (debugSetGoal) {
            debugSetGoal.addEventListener('click', async () => {
                await this.waterRecorder.updateDailyGoal(10);
                this.updateUI();
                this.showToast('每日目标已设为10杯', 'success');
            });
        }
        
        if (debugShowState) {
            debugShowState.addEventListener('click', () => {
                const state = this.waterRecorder.getState();
                console.log('应用完整状态:', state);
                alert(`当前状态：
今日杯数: ${state.stats.todayCount}
基础目标: ${state.stats.goal}杯
天气调整: ${state.stats.weatherAdjustment}杯
调整后目标: ${state.stats.weatherAdjustedGoal}杯
完成率: ${state.stats.completionRate}%
剩余杯数: ${state.stats.remainingCups}杯`);
            });
        }
    }
}

// ==================== 动画关键帧定义 ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes drop-splash {
        0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
        }
        100% {
            transform: translateY(-40px) scale(1.5);
            opacity: 0;
        }
    }
    
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    /* 应用样式 */
    .bounce {
        animation: bounce 0.5s ease;
    }
    
    .pulse {
        animation: pulse 1s ease;
    }
    
    .detailed-stats {
        background: var(--card-bg);
        border-radius: var(--border-radius-md);
        padding: 16px;
        margin: 16px 0;
        box-shadow: var(--shadow-sm);
        border: 2px solid var(--border-color);
    }
    
    .stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: var(--font-size-sm);
    }
    
    .stat-label {
        color: var(--text-secondary);
        font-weight: normal;
    }
    
    .stat-value {
        color: var(--text-primary);
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// ==================== 应用启动 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 创建应用实例
    window.waterApp = new WaterReminderApp();
    
    // 开发环境日志
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 开发模式：启用调试功能');
    }
});

// ==================== 模块导出 ====================
export { WaterReminderApp };