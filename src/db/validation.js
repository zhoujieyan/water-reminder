// 水宝提醒 - 数据验证工具
// 对输入数据进行类型检查和范围校验

// ==================== 基础验证工具 ====================

/**
 * 检查值是否为有效数字
 * @param {any} value 要检查的值
 * @param {boolean} allowZero 是否允许零
 * @param {boolean} allowNegative 是否允许负数
 * @returns {boolean} 是否为有效数字
 */
function isValidNumber(value, allowZero = true, allowNegative = false) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return false;
    }
    
    if (!allowZero && value === 0) {
        return false;
    }
    
    if (!allowNegative && value < 0) {
        return false;
    }
    
    return true;
}

/**
 * 检查值是否为整数
 * @param {any} value 要检查的值
 * @returns {boolean} 是否为整数
 */
function isInteger(value) {
    return Number.isInteger(value);
}

/**
 * 检查字符串是否为有效日期格式（YYYY-MM-DD）
 * @param {string} dateStr 日期字符串
 * @returns {boolean} 是否为有效日期
 */
function isValidDateString(dateStr) {
    if (typeof dateStr !== 'string') {
        return false;
    }
    
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(dateStr)) {
        return false;
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return false;
    }
    
    // 确保日期字符串与解析后的日期一致（防止如2024-02-30这样的无效日期）
    const [year, month, day] = dateStr.split('-').map(Number);
    return date.getFullYear() === year && 
           date.getMonth() + 1 === month && 
           date.getDate() === day;
}

// ==================== 记录数据验证 ====================

/**
 * 验证喝水记录数据
 * @param {Object} record 记录对象
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array<string> }
 */
export function validateRecord(record) {
    const errors = [];
    
    if (!record || typeof record !== 'object') {
        return { isValid: false, errors: ['记录数据必须是对象'] };
    }
    
    // 验证日期
    if (!record.date || !isValidDateString(record.date)) {
        errors.push('日期格式无效，必须为YYYY-MM-DD格式');
    }
    
    // 验证已喝杯数
    if (!isValidNumber(record.cups_drunk, true, false)) {
        errors.push('已喝杯数必须是有效的非负数');
    } else if (!isInteger(record.cups_drunk)) {
        errors.push('已喝杯数必须是整数');
    } else if (record.cups_drunk < 0) {
        errors.push('已喝杯数不能为负数');
    } else if (record.cups_drunk > 50) {
        errors.push('已喝杯数超过合理范围（最大50杯）');
    }
    
    // 验证目标杯数
    if (!isValidNumber(record.goal, false, false)) {
        errors.push('目标杯数必须是有效的正数');
    } else if (!isInteger(record.goal)) {
        errors.push('目标杯数必须是整数');
    } else if (record.goal < 1) {
        errors.push('目标杯数必须大于0');
    } else if (record.goal > 20) {
        errors.push('目标杯数超过合理范围（最大20杯）');
    }
    
    // 验证天气调整量
    if (record.weather_adjustment !== undefined) {
        if (!isValidNumber(record.weather_adjustment, true, true)) {
            errors.push('天气调整量必须是有效数字');
        } else if (!isInteger(record.weather_adjustment)) {
            errors.push('天气调整量必须是整数');
        } else if (record.weather_adjustment < -5 || record.weather_adjustment > 5) {
            errors.push('天气调整量超出合理范围（-5到5杯）');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 验证记录ID
 * @param {any} id 记录ID
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array<string> }
 */
export function validateRecordId(id) {
    const errors = [];
    
    if (!isValidNumber(id, false, false)) {
        errors.push('记录ID必须是有效的正数');
    } else if (!isInteger(id)) {
        errors.push('记录ID必须是整数');
    } else if (id < 1) {
        errors.push('记录ID必须大于0');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ==================== 成就数据验证 ====================

/**
 * 验证成就数据
 * @param {Object} achievement 成就对象
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array<string> }
 */
export function validateAchievement(achievement) {
    const errors = [];
    
    if (!achievement || typeof achievement !== 'object') {
        return { isValid: false, errors: ['成就数据必须是对象'] };
    }
    
    // 验证名称
    if (!achievement.name || typeof achievement.name !== 'string') {
        errors.push('成就名称不能为空且必须是字符串');
    } else if (achievement.name.trim().length === 0) {
        errors.push('成就名称不能为空');
    } else if (achievement.name.length > 100) {
        errors.push('成就名称不能超过100个字符');
    }
    
    // 验证描述
    if (!achievement.description || typeof achievement.description !== 'string') {
        errors.push('成就描述不能为空且必须是字符串');
    } else if (achievement.description.trim().length === 0) {
        errors.push('成就描述不能为空');
    } else if (achievement.description.length > 500) {
        errors.push('成就描述不能超过500个字符');
    }
    
    // 验证图标
    if (achievement.icon !== undefined && achievement.icon !== null) {
        if (typeof achievement.icon !== 'string') {
            errors.push('成就图标必须是字符串');
        } else if (achievement.icon.trim().length === 0) {
            errors.push('成就图标不能为空字符串');
        } else if (achievement.icon.length > 200) {
            errors.push('成就图标URL过长（最大200字符）');
        }
    }
    
    // 验证解锁日期
    if (achievement.unlocked_date !== undefined && achievement.unlocked_date !== null) {
        if (typeof achievement.unlocked_date !== 'string') {
            errors.push('解锁日期必须是字符串');
        } else {
            const date = new Date(achievement.unlocked_date);
            if (isNaN(date.getTime())) {
                errors.push('解锁日期格式无效');
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ==================== 设置数据验证 ====================

/**
 * 验证设置数据
 * @param {Object} setting 设置对象
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array<string> }
 */
export function validateSetting(setting) {
    const errors = [];
    
    if (!setting || typeof setting !== 'object') {
        return { isValid: false, errors: ['设置数据必须是对象'] };
    }
    
    // 验证设置ID
    if (!setting.id || typeof setting.id !== 'string') {
        errors.push('设置ID不能为空且必须是字符串');
    } else if (setting.id.trim().length === 0) {
        errors.push('设置ID不能为空');
    } else if (setting.id.length > 50) {
        errors.push('设置ID不能超过50个字符');
    }
    
    // 验证值（根据ID进行特定验证）
    if (setting.value === undefined) {
        errors.push('设置值不能为undefined');
    } else {
        const validationResult = validateSettingValue(setting.id, setting.value);
        if (!validationResult.isValid) {
            errors.push(...validationResult.errors);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 根据设置ID验证对应的值
 * @param {string} settingId 设置ID
 * @param {any} value 要验证的值
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array<string> }
 */
export function validateSettingValue(settingId, value) {
    const errors = [];
    
    switch (settingId) {
        case 'reminder_interval':
            // 提醒间隔必须是正整数（分钟）
            if (!isValidNumber(value, false, false)) {
                errors.push('提醒间隔必须是有效的正数');
            } else if (!isInteger(value)) {
                errors.push('提醒间隔必须是整数');
            } else if (value < 15) {
                errors.push('提醒间隔不能小于15分钟');
            } else if (value > 240) {
                errors.push('提醒间隔不能超过240分钟（4小时）');
            }
            break;
            
        case 'daily_goal':
            // 每日目标必须是正整数（杯）
            if (!isValidNumber(value, false, false)) {
                errors.push('每日目标必须是有效的正数');
            } else if (!isInteger(value)) {
                errors.push('每日目标必须是整数');
            } else if (value < 1) {
                errors.push('每日目标必须大于0');
            } else if (value > 20) {
                errors.push('每日目标不能超过20杯');
            }
            break;
            
        case 'weather_enabled':
        case 'notifications_enabled':
        case 'sound_enabled':
            // 布尔值设置
            if (typeof value !== 'boolean') {
                errors.push(`${settingId}必须是布尔值（true或false）`);
            }
            break;
            
        default:
            // 未知设置类型，进行基本验证
            if (value === null || value === undefined) {
                errors.push('设置值不能为空');
            } else if (typeof value === 'object') {
                errors.push('设置值不能为对象（除非特殊定义）');
            }
            break;
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 验证设置ID
 * @param {any} id 设置ID
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array<string> }
 */
export function validateSettingId(id) {
    const errors = [];
    
    if (!id || typeof id !== 'string') {
        errors.push('设置ID不能为空且必须是字符串');
    } else if (id.trim().length === 0) {
        errors.push('设置ID不能为空');
    } else if (id.length > 50) {
        errors.push('设置ID不能超过50个字符');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ==================== 复合验证工具 ====================

/**
 * 批量验证记录数据
 * @param {Array<Object>} records 记录数组
 * @returns {Object} 验证结果 { 
 *   isValid: boolean, 
 *   errors: Array<string>,
 *   invalidRecords: Array<{ index: number, errors: Array<string> }>
 * }
 */
export function validateRecordsBatch(records) {
    if (!Array.isArray(records)) {
        return {
            isValid: false,
            errors: ['输入必须是数组'],
            invalidRecords: []
        };
    }
    
    const invalidRecords = [];
    let allValid = true;
    
    records.forEach((record, index) => {
        const validation = validateRecord(record);
        if (!validation.isValid) {
            allValid = false;
            invalidRecords.push({
                index: index,
                errors: validation.errors
            });
        }
    });
    
    return {
        isValid: allValid,
        errors: allValid ? [] : [`${invalidRecords.length}条记录验证失败`],
        invalidRecords: invalidRecords
    };
}

/**
 * 批量验证成就数据
 * @param {Array<Object>} achievements 成就数组
 * @returns {Object} 验证结果 { 
 *   isValid: boolean, 
 *   errors: Array<string>,
 *   invalidAchievements: Array<{ index: number, errors: Array<string> }>
 * }
 */
export function validateAchievementsBatch(achievements) {
    if (!Array.isArray(achievements)) {
        return {
            isValid: false,
            errors: ['输入必须是数组'],
            invalidAchievements: []
        };
    }
    
    const invalidAchievements = [];
    let allValid = true;
    
    achievements.forEach((achievement, index) => {
        const validation = validateAchievement(achievement);
        if (!validation.isValid) {
            allValid = false;
            invalidAchievements.push({
                index: index,
                errors: validation.errors
            });
        }
    });
    
    return {
        isValid: allValid,
        errors: allValid ? [] : [`${invalidAchievements.length}项成就验证失败`],
        invalidAchievements: invalidAchievements
    };
}

// ==================== 实用验证函数 ====================

/**
 * 验证杯数是否在合理范围内
 * @param {number} cups 杯数
 * @param {boolean} allowZero 是否允许零
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
export function validateCups(cups, allowZero = true) {
    if (!isValidNumber(cups, allowZero, false)) {
        return {
            isValid: false,
            message: '杯数必须是有效的数字'
        };
    }
    
    if (!isInteger(cups)) {
        return {
            isValid: false,
            message: '杯数必须是整数'
        };
    }
    
    if (cups < 0) {
        return {
            isValid: false,
            message: '杯数不能为负数'
        };
    }
    
    if (!allowZero && cups === 0) {
        return {
            isValid: false,
            message: '杯数不能为零'
        };
    }
    
    if (cups > 50) {
        return {
            isValid: false,
            message: '杯数超过合理范围（最大50杯）'
        };
    }
    
    return {
        isValid: true,
        message: '杯数验证通过'
    };
}

/**
 * 验证时间间隔（分钟）
 * @param {number} minutes 分钟数
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
export function validateInterval(minutes) {
    if (!isValidNumber(minutes, false, false)) {
        return {
            isValid: false,
            message: '时间间隔必须是有效的正数'
        };
    }
    
    if (!isInteger(minutes)) {
        return {
            isValid: false,
            message: '时间间隔必须是整数'
        };
    }
    
    if (minutes < 15) {
        return {
            isValid: false,
            message: '时间间隔不能小于15分钟'
        };
    }
    
    if (minutes > 240) {
        return {
            isValid: false,
            message: '时间间隔不能超过240分钟（4小时）'
        };
    }
    
    return {
        isValid: true,
        message: '时间间隔验证通过'
    };
}

// ==================== 导出所有验证函数 ====================

export default {
    // 基础工具
    isValidNumber,
    isInteger,
    isValidDateString,
    
    // 记录验证
    validateRecord,
    validateRecordId,
    validateRecordsBatch,
    
    // 成就验证
    validateAchievement,
    validateAchievementsBatch,
    
    // 设置验证
    validateSetting,
    validateSettingValue,
    validateSettingId,
    
    // 实用函数
    validateCups,
    validateInterval
};