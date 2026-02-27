// 水宝提醒 - 提醒UI组件
// 版本: 1.0.0

import { getReminderSystem } from '../../logic/reminder.js';

class ReminderUI {
    constructor() {
        this.reminderSystem = getReminderSystem();
        this.modal = null;
        this.settingsPanel = null;
        
        this.init();
    }
    
    init() {
        console.log('🎨 提醒UI组件初始化中...');
        
        // 创建CSS样式
        this.injectStyles();
        
        // 创建模态框容器
        this.createModalContainer();
        
        // 创建设置面板容器
        this.createSettingsPanel();
        
        // 绑定全局事件
        this.bindGlobalEvents();
        
        console.log('✅ 提醒UI组件初始化完成');
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 提醒模态框样式 */
            .reminder-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }
            
            .reminder-modal.active {
                opacity: 1;
                visibility: visible;
            }
            
            .reminder-modal-content {
                background: linear-gradient(135deg, var(--primary-blue-light), var(--primary-green-light));
                border-radius: 24px;
                padding: 32px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                text-align: center;
                transform: translateY(20px);
                transition: transform 0.3s ease-out;
            }
            
            .reminder-modal.active .reminder-modal-content {
                transform: translateY(0);
            }
            
            .reminder-icon {
                font-size: 64px;
                margin-bottom: 20px;
                animation: bounce 2s infinite;
            }
            
            .reminder-title {
                font-size: 28px;
                font-weight: bold;
                color: var(--text-color);
                margin-bottom: 16px;
            }
            
            .reminder-message {
                font-size: 18px;
                color: var(--text-color-light);
                margin-bottom: 32px;
                line-height: 1.5;
            }
            
            .reminder-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .reminder-btn {
                padding: 14px 24px;
                border: none;
                border-radius: 16px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .reminder-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }
            
            .reminder-btn:active {
                transform: translateY(0);
            }
            
            .reminder-btn-primary {
                background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
                color: white;
            }
            
            .reminder-btn-secondary {
                background-color: rgba(255, 255, 255, 0.9);
                color: var(--text-color);
            }
            
            .reminder-btn-tertiary {
                background-color: rgba(255, 255, 255, 0.7);
                color: var(--text-color-light);
            }
            
            /* 设置面板样式 */
            .settings-panel {
                position: fixed;
                top: 0;
                right: 0;
                width: 90%;
                max-width: 400px;
                height: 100%;
                background: linear-gradient(135deg, var(--card-bg), rgba(255, 255, 255, 0.95));
                box-shadow: -5px 0 25px rgba(0, 0, 0, 0.1);
                z-index: 10001;
                transform: translateX(100%);
                transition: transform 0.3s ease-out;
                overflow-y: auto;
                padding: 24px;
            }
            
            .settings-panel.active {
                transform: translateX(0);
            }
            
            .settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
                padding-bottom: 16px;
                border-bottom: 2px solid var(--border-color);
            }
            
            .settings-title {
                font-size: 24px;
                font-weight: bold;
                color: var(--text-color);
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: var(--text-color-light);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .close-btn:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
            
            .setting-item {
                margin-bottom: 24px;
            }
            
            .setting-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-size: 18px;
                color: var(--text-color);
            }
            
            .setting-description {
                font-size: 14px;
                color: var(--text-color-light);
                margin-bottom: 16px;
                line-height: 1.4;
            }
            
            .interval-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .interval-btn {
                padding: 10px 16px;
                border: 2px solid var(--border-color);
                border-radius: 12px;
                background: none;
                cursor: pointer;
                font-size: 16px;
                color: var(--text-color);
                transition: all 0.2s;
                flex: 1;
                min-width: 80px;
            }
            
            .interval-btn:hover {
                border-color: var(--primary-blue);
                color: var(--primary-blue);
            }
            
            .interval-btn.active {
                background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
                color: white;
                border-color: transparent;
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 60px;
                height: 30px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 34px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(30px);
            }
            
            .status-display {
                background: rgba(255, 255, 255, 0.8);
                border-radius: 16px;
                padding: 20px;
                margin-top: 32px;
                text-align: center;
            }
            
            .status-title {
                font-size: 18px;
                color: var(--text-color-light);
                margin-bottom: 8px;
            }
            
            .status-value {
                font-size: 24px;
                font-weight: bold;
                color: var(--primary-blue);
            }
            
            .status-hint {
                font-size: 14px;
                color: var(--text-color-light);
                margin-top: 8px;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    createModalContainer() {
        this.modal = document.createElement('div');
        this.modal.className = 'reminder-modal';
        this.modal.innerHTML = `
            <div class="reminder-modal-content">
                <div class="reminder-icon">💧</div>
                <h2 class="reminder-title">该喝水啦！</h2>
                <p class="reminder-message">长时间工作别忘了补充水分，喝一杯水放松一下吧~</p>
                <div class="reminder-actions">
                    <button class="reminder-btn reminder-btn-primary drink-btn">
                        <span>💧</span>
                        <span>喝了一杯</span>
                    </button>
                    <button class="reminder-btn reminder-btn-secondary snooze-btn">
                        <span>⏰</span>
                        <span>10分钟后</span>
                    </button>
                    <button class="reminder-btn reminder-btn-tertiary skip-btn">
                        <span>⏭️</span>
                        <span>跳过</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // 绑定按钮事件
        this.bindModalEvents();
    }
    
    createSettingsPanel() {
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.className = 'settings-panel';
        this.settingsPanel.innerHTML = `
            <div class="settings-header">
                <h2 class="settings-title">提醒设置</h2>
                <button class="close-btn">&times;</button>
            </div>
            
            <div class="setting-item">
                <div class="setting-label">
                    <span>提醒间隔</span>
                </div>
                <p class="setting-description">设置多长时间提醒你喝水一次</p>
                <div class="interval-buttons">
                    <button class="interval-btn" data-minutes="30">30分钟</button>
                    <button class="interval-btn" data-minutes="60">60分钟</button>
                    <button class="interval-btn" data-minutes="90">90分钟</button>
                    <button class="interval-btn" data-minutes="120">120分钟</button>
                </div>
            </div>
            
            <div class="setting-item">
                <div class="setting-label">
                    <span>通知提醒</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="notifications-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <p class="setting-description">启用后会在提醒时间显示浏览器通知</p>
            </div>
            
            <div class="setting-item">
                <div class="setting-label">
                    <span>声音提醒</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="sound-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <p class="setting-description">启用后会在提醒时播放提示音</p>
            </div>
            
            <div class="setting-item">
                <div class="setting-label">
                    <span>每日目标</span>
                    <input type="number" id="daily-goal" min="1" max="20" value="8" style="width: 80px; padding: 8px; border-radius: 8px; border: 2px solid var(--border-color);">
                </div>
                <p class="setting-description">设置每天需要喝多少杯水（1杯约250ml）</p>
            </div>
            
            <div class="status-display">
                <div class="status-title">下次提醒时间</div>
                <div class="status-value" id="next-reminder-time">--:--</div>
                <div class="status-hint">提醒系统状态: <span id="system-status">加载中...</span></div>
            </div>
        `;
        
        document.body.appendChild(this.settingsPanel);
        
        // 绑定设置面板事件
        this.bindSettingsEvents();
    }
    
    bindModalEvents() {
        const drinkBtn = this.modal.querySelector('.drink-btn');
        const snoozeBtn = this.modal.querySelector('.snooze-btn');
        const skipBtn = this.modal.querySelector('.skip-btn');
        
        drinkBtn.addEventListener('click', () => {
            this.handleDrink();
            this.hideModal();
        });
        
        snoozeBtn.addEventListener('click', () => {
            this.handleSnooze();
            this.hideModal();
        });
        
        skipBtn.addEventListener('click', () => {
            this.handleSkip();
            this.hideModal();
        });
        
        // 点击模态框背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
                this.handleSnooze(); // 默认稍后提醒
            }
        });
    }
    
    bindSettingsEvents() {
        const closeBtn = this.settingsPanel.querySelector('.close-btn');
        const intervalBtns = this.settingsPanel.querySelectorAll('.interval-btn');
        const notificationsToggle = this.settingsPanel.querySelector('#notifications-toggle');
        const soundToggle = this.settingsPanel.querySelector('#sound-toggle');
        const dailyGoalInput = this.settingsPanel.querySelector('#daily-goal');
        
        closeBtn.addEventListener('click', () => {
            this.hideSettings();
        });
        
        // 间隔按钮
        intervalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.updateInterval(minutes);
                
                // 更新按钮状态
                intervalBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // 通知开关
        notificationsToggle.addEventListener('change', (e) => {
            this.toggleNotifications(e.target.checked);
        });
        
        // 声音开关
        soundToggle.addEventListener('change', (e) => {
            this.toggleSound(e.target.checked);
        });
        
        // 每日目标输入
        dailyGoalInput.addEventListener('change', (e) => {
            const goal = parseInt(e.target.value);
            if (goal >= 1 && goal <= 20) {
                this.updateDailyGoal(goal);
            } else {
                e.target.value = 8; // 重置为默认值
                alert('每日目标应在1-20杯之间');
            }
        });
    }
    
    bindGlobalEvents() {
        // 监听提醒触发事件
        window.addEventListener('reminderTriggered', (event) => {
            this.showModal(event.detail.message);
        });
        
        // 监听喝水记录事件
        window.addEventListener('drinkRecorded', () => {
            // 可以在这里更新UI，比如显示庆祝动画
            this.showCelebration();
        });
        
        // 监听系统状态变化
        setInterval(() => {
            this.updateStatusDisplay();
        }, 60000); // 每分钟更新一次
    }
    
    // UI控制方法
    showModal(message = '') {
        if (message) {
            const messageEl = this.modal.querySelector('.reminder-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        console.log('📱 显示提醒模态框');
    }
    
    hideModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            // 重置消息
            const messageEl = this.modal.querySelector('.reminder-message');
            if (messageEl) {
                messageEl.textContent = '长时间工作别忘了补充水分，喝一杯水放松一下吧~';
            }
        }, 300); // 等待动画结束
        
        console.log('📱 隐藏提醒模态框');
    }
    
    showSettings() {
        // 加载当前设置
        this.loadCurrentSettings();
        
        this.settingsPanel.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('⚙️ 显示设置面板');
    }
    
    hideSettings() {
        this.settingsPanel.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('⚙️ 隐藏设置面板');
    }
    
    loadCurrentSettings() {
        const status = this.reminderSystem.getStatus();
        
        // 更新间隔按钮
        const intervalBtns = this.settingsPanel.querySelectorAll('.interval-btn');
        intervalBtns.forEach(btn => {
            const minutes = parseInt(btn.dataset.minutes);
            btn.classList.toggle('active', minutes === status.settings.reminderInterval);
        });
        
        // 更新开关状态
        const notificationsToggle = this.settingsPanel.querySelector('#notifications-toggle');
        const soundToggle = this.settingsPanel.querySelector('#sound-toggle');
        const dailyGoalInput = this.settingsPanel.querySelector('#daily-goal');
        
        if (notificationsToggle) {
            notificationsToggle.checked = status.settings.notificationsEnabled;
        }
        
        if (soundToggle) {
            soundToggle.checked = status.settings.soundEnabled;
        }
        
        if (dailyGoalInput) {
            dailyGoalInput.value = status.settings.dailyGoal;
        }
        
        // 更新状态显示
        this.updateStatusDisplay();
    }
    
    updateStatusDisplay() {
        const status = this.reminderSystem.getStatus();
        const nextTimeEl = this.settingsPanel.querySelector('#next-reminder-time');
        const statusEl = this.settingsPanel.querySelector('#system-status');
        
        if (nextTimeEl && status.nextReminderTime) {
            const timeStr = status.nextReminderTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            nextTimeEl.textContent = timeStr;
        }
        
        if (statusEl) {
            statusEl.textContent = status.isRunning ? '运行中' : '已停止';
            statusEl.style.color = status.isRunning ? 'var(--primary-green)' : 'var(--accent-orange)';
        }
    }
    
    // 用户操作处理方法
    async handleDrink() {
        await this.reminderSystem.handleDrink();
        this.showCelebration();
    }
    
    handleSkip() {
        this.reminderSystem.handleSkip();
    }
    
    handleSnooze(minutes = 10) {
        this.reminderSystem.handleSnooze(minutes);
    }
    
    // 设置更新方法
    updateInterval(minutes) {
        const success = this.reminderSystem.updateInterval(minutes);
        if (success) {
            this.showToast(`提醒间隔已设置为 ${minutes} 分钟`);
            this.updateStatusDisplay();
        }
    }
    
    toggleNotifications(enabled) {
        this.reminderSystem.toggleNotifications(enabled);
        this.showToast(`通知功能已${enabled ? '启用' : '禁用'}`);
        this.updateStatusDisplay();
    }
    
    toggleSound(enabled) {
        this.reminderSystem.toggleSound(enabled);
        this.showToast(`声音提醒已${enabled ? '启用' : '禁用'}`);
    }
    
    async updateDailyGoal(goal) {
        // 更新数据库中的每日目标
        try {
            await this.reminderSystem.updateDailyGoal(goal);
            this.showToast(`每日目标已设置为 ${goal} 杯`);
        } catch (error) {
            console.error('❌ 更新每日目标失败:', error);
            this.showToast('更新失败，请重试', 'error');
        }
    }
    
    // 工具方法
    showCelebration() {
        // 显示庆祝动画
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 80px;
            z-index: 10002;
            pointer-events: none;
            animation: celebration 2s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes celebration {
                0% { 
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% { 
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                100% { 
                    opacity: 0;
                    transform: translate(-50%, -100%) scale(0.8);
                }
            }
        `;
        
        document.head.appendChild(style);
        
        celebration.textContent = '🎉';
        document.body.appendChild(celebration);
        
        // 动画结束后移除元素
        setTimeout(() => {
            celebration.remove();
            style.remove();
        }, 2000);
        
        console.log('🎊 显示庆祝动画');
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'var(--accent-orange)' : 'var(--primary-green)'};
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: bold;
            z-index: 10003;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            animation: toast 3s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes toast {
                0% { 
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                20% { 
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                80% { 
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                100% { 
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
        
        document.head.appendChild(style);
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 3000);
        
        console.log('📝 显示Toast:', message);
    }
}

// 导出单例
let uiInstance = null;

export function getReminderUI() {
    if (!uiInstance) {
        uiInstance = new ReminderUI();
    }
    return uiInstance;
}

// 便捷导出
export default getReminderUI;