// 水宝提醒 - 天气服务模块
// 负责获取天气数据、计算推荐喝水量调整、缓存和管理天气信息

/**
 * 天气数据接口定义
 * @typedef {Object} WeatherData
 * @property {number} temperature - 温度（摄氏度）
 * @property {number} humidity - 湿度（百分比）
 * @property {string} condition - 天气状况（如"晴"、"雨"等）
 * @property {string} location - 地理位置（城市名称）
 * @property {number} [feelsLike] - 体感温度
 * @property {string} [icon] - 天气图标代码
 * @property {Date} timestamp - 数据获取时间
 */

/**
 * 天气配置
 */
const WEATHER_CONFIG = {
    // OpenWeatherMap API 配置（如无API key则使用模拟数据）
    openWeatherMap: {
        apiKey: '', // 需要用户提供或从环境变量获取
        baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
        units: 'metric', // 使用摄氏度
        lang: 'zh_cn'
    },
    
    // 默认地理位置（可扩展为基于浏览器定位）
    defaultLocation: {
        city: '北京',
        lat: 39.9042,
        lon: 116.4074
    },
    
    // 温度补偿算法参数
    temperatureAdjustment: {
        baseTemp: 20, // 基准温度（°C）
        adjustmentPer5C: 1, // 每升高5°C增加杯数
        maxAdjustment: 4, // 最大调整杯数
        minAdjustment: -1 // 最低调整杯数（温度较低时减少）
    },
    
    // 缓存设置
    cacheDuration: 2 * 60 * 60 * 1000, // 2小时（毫秒）
    
    // 模拟数据（当API不可用时使用）
    mockData: {
        temperature: 25,
        humidity: 60,
        condition: '晴',
        location: '北京'
    }
};

/**
 * 天气服务类
 */
export class WeatherService {
    constructor(config = {}) {
        this.config = { ...WEATHER_CONFIG, ...config };
        this.cache = {
            data: null,
            timestamp: null,
            lastError: null
        };
        this.isOnline = navigator.onLine;
        
        // 监听网络状态变化
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    /**
     * 获取天气数据
     * @param {boolean} forceRefresh - 是否强制刷新（忽略缓存）
     * @returns {Promise<WeatherData>}
     */
    async getWeatherData(forceRefresh = false) {
        // 检查缓存有效性
        if (!forceRefresh && this.isCacheValid()) {
            console.log('📦 使用缓存的天气数据');
            return this.cache.data;
        }
        
        // 检查网络状态
        if (!this.isOnline) {
            console.warn('🌐 网络不可用，使用缓存数据或模拟数据');
            return this.getFallbackData();
        }
        
        try {
            // 尝试从API获取数据
            const weatherData = await this.fetchFromAPI();
            
            // 更新缓存
            this.cache.data = weatherData;
            this.cache.timestamp = new Date();
            this.cache.lastError = null;
            
            // 保存到本地存储（用于离线访问）
            this.saveToLocalStorage(weatherData);
            
            return weatherData;
        } catch (error) {
            console.error('❌ 获取天气数据失败:', error);
            this.cache.lastError = error.message;
            
            // 降级：从本地存储获取历史数据
            const cachedData = this.getFromLocalStorage();
            if (cachedData) {
                console.log('📦 使用本地存储的天气数据');
                return cachedData;
            }
            
            // 最终降级：返回模拟数据
            console.log('🎭 使用模拟天气数据');
            return this.getMockData();
        }
    }
    
    /**
     * 从API获取天气数据
     * @private
     */
    async fetchFromAPI() {
        const { apiKey, baseUrl, units, lang } = this.config.openWeatherMap;
        
        // 如果没有API key，降级到模拟数据
        if (!apiKey || apiKey.trim() === '') {
            console.warn('⚠️ 未配置OpenWeatherMap API key，使用模拟数据');
            return this.getMockData();
        }
        
        const { lat, lon } = this.config.defaultLocation;
        const url = `${baseUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}&lang=${lang}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return this.transformAPIData(data);
    }
    
    /**
     * 转换API数据为内部格式
     * @private
     */
    transformAPIData(apiData) {
        return {
            temperature: Math.round(apiData.main.temp),
            humidity: apiData.main.humidity,
            condition: this.translateCondition(apiData.weather[0].description),
            location: apiData.name,
            feelsLike: Math.round(apiData.main.feels_like),
            icon: apiData.weather[0].icon,
            timestamp: new Date()
        };
    }
    
    /**
     * 翻译天气状况为中文
     * @private
     */
    translateCondition(description) {
        const conditionMap = {
            'clear sky': '晴',
            'few clouds': '少云',
            'scattered clouds': '散云',
            'broken clouds': '多云',
            'overcast clouds': '阴',
            'shower rain': '阵雨',
            'rain': '雨',
            'thunderstorm': '雷雨',
            'snow': '雪',
            'mist': '雾',
            'haze': '霾'
        };
        
        // 转换为小写比较
        const key = description.toLowerCase();
        return conditionMap[key] || description;
    }
    
    /**
     * 获取模拟数据
     * @private
     */
    getMockData() {
        const { temperature, humidity, condition, location } = this.config.mockData;
        return {
            temperature,
            humidity,
            condition,
            location,
            timestamp: new Date()
        };
    }
    
    /**
     * 获取降级数据（缓存或模拟）
     * @private
     */
    getFallbackData() {
        // 优先使用缓存
        if (this.cache.data) {
            return this.cache.data;
        }
        
        // 其次使用本地存储
        const cachedData = this.getFromLocalStorage();
        if (cachedData) {
            return cachedData;
        }
        
        // 最后使用模拟数据
        return this.getMockData();
    }
    
    /**
     * 根据温度计算推荐调整杯数
     * @param {number} temperature - 温度（摄氏度）
     * @returns {number} 调整杯数（正数表示增加，负数表示减少）
     */
    calculateAdjustment(temperature) {
        const { baseTemp, adjustmentPer5C, maxAdjustment, minAdjustment } = this.config.temperatureAdjustment;
        
        // 计算温度差
        const tempDiff = temperature - baseTemp;
        
        // 每5°C调整一杯
        let adjustment = Math.round(tempDiff / 5) * adjustmentPer5C;
        
        // 限制调整范围
        adjustment = Math.max(minAdjustment, Math.min(maxAdjustment, adjustment));
        
        console.log(`🌡️ 温度: ${temperature}°C (基准: ${baseTemp}°C) → 调整: ${adjustment}杯`);
        return adjustment;
    }
    
    /**
     * 获取推荐喝水量调整
     * @param {WeatherData} weatherData - 天气数据
     * @returns {Object} 包含调整信息和推荐说明
     */
    getWaterRecommendation(weatherData) {
        const adjustment = this.calculateAdjustment(weatherData.temperature);
        const adjustedGoal = 8 + adjustment; // 基础8杯
        
        // 生成推荐说明
        let reason = '';
        if (adjustment > 0) {
            reason = `温度较高(${weatherData.temperature}°C)，建议多喝${adjustment}杯补充水分`;
        } else if (adjustment < 0) {
            reason = `温度较低(${weatherData.temperature}°C)，可适当减少${Math.abs(adjustment)}杯`;
        } else {
            reason = `温度适宜(${weatherData.temperature}°C)，保持每日8杯即可`;
        }
        
        return {
            adjustment,
            adjustedGoal,
            reason,
            weatherData
        };
    }
    
    /**
     * 获取天气图标URL
     * @param {string} iconCode - OpenWeatherMap图标代码
     * @returns {string} 图标URL
     */
    getWeatherIconUrl(iconCode) {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }
    
    /**
     * 格式化天气信息显示
     * @param {WeatherData} weatherData
     * @returns {string} 格式化字符串
     */
    formatWeatherInfo(weatherData) {
        const { condition, temperature, humidity, location } = weatherData;
        return `${condition}，${temperature}°C，湿度${humidity}%`;
    }
    
    /**
     * 检查缓存是否有效
     * @private
     */
    isCacheValid() {
        if (!this.cache.data || !this.cache.timestamp) {
            return false;
        }
        
        const now = new Date();
        const cacheAge = now - this.cache.timestamp;
        return cacheAge < this.config.cacheDuration;
    }
    
    /**
     * 保存到本地存储
     * @private
     */
    saveToLocalStorage(weatherData) {
        try {
            const storageData = {
                ...weatherData,
                timestamp: weatherData.timestamp.toISOString()
            };
            localStorage.setItem('water_reminder_weather_cache', JSON.stringify(storageData));
        } catch (error) {
            console.warn('无法保存天气数据到本地存储:', error);
        }
    }
    
    /**
     * 从本地存储获取
     * @private
     */
    getFromLocalStorage() {
        try {
            const stored = localStorage.getItem('water_reminder_weather_cache');
            if (!stored) return null;
            
            const data = JSON.parse(stored);
            return {
                ...data,
                timestamp: new Date(data.timestamp)
            };
        } catch (error) {
            console.warn('无法从本地存储读取天气数据:', error);
            return null;
        }
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.data = null;
        this.cache.timestamp = null;
        localStorage.removeItem('water_reminder_weather_cache');
        console.log('🗑️ 天气缓存已清除');
    }
    
    /**
     * 处理网络恢复
     * @private
     */
    handleOnline() {
        console.log('🌐 网络已恢复');
        this.isOnline = true;
        
        // 网络恢复时自动刷新天气数据
        setTimeout(() => {
            this.getWeatherData(true).catch(err => {
                console.warn('网络恢复后刷新天气失败:', err);
            });
        }, 2000);
    }
    
    /**
     * 处理网络断开
     * @private
     */
    handleOffline() {
        console.warn('🌐 网络已断开');
        this.isOnline = false;
    }
    
    /**
     * 设置API key
     */
    setApiKey(apiKey) {
        this.config.openWeatherMap.apiKey = apiKey;
        console.log('🔑 API key已更新');
    }
    
    /**
     * 设置地理位置
     */
    setLocation(city, lat, lon) {
        this.config.defaultLocation = { city, lat, lon };
        console.log(`📍 地理位置已更新: ${city} (${lat}, ${lon})`);
    }
}

// 导出单例实例（可选）
export const weatherService = new WeatherService();