// 水宝提醒 - 每周健康简报PDF生成模块
// 基于本周喝水数据生成统计报告，包含图表、成就总结和个性化建议

import {
    getRecordsByDateRange,
    getUnlockedAchievements
} from '../db/crud.js';

// 外部依赖：Chart.js 和 jsPDF（动态加载）
const CHARTJS_CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
const JSPDF_CDN = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';

/**
 * 生成每周健康简报PDF报告
 * @param {Object} options 配置选项
 * @param {string} options.startDate 报告开始日期（YYYY-MM-DD），默认最近7天
 * @param {string} options.endDate 报告结束日期（YYYY-MM-DD），默认今天
 * @returns {Promise<Blob>} PDF文件的Blob对象
 */
export async function generateWeeklyReport(options = {}) {
    console.log('📊 开始生成每周健康简报...');
    
    try {
        // 1. 确定日期范围
        const endDate = options.endDate || getTodayDateString();
        const startDate = options.startDate || getDateDaysAgo(endDate, 6);
        
        console.log(`📅 报告日期范围: ${startDate} 至 ${endDate}`);
        
        // 2. 加载本周记录和成就
        const [records, achievements] = await Promise.all([
            getRecordsByDateRange(startDate, endDate),
            getUnlockedAchievements()
        ]);
        
        // 3. 计算统计数据
        const stats = calculateWeeklyStats(records, startDate, endDate);
        
        // 4. 获取本周解锁的成就（根据解锁日期筛选）
        const weeklyAchievements = filterWeeklyAchievements(achievements, startDate, endDate);
        
        // 5. 生成个性化建议
        const suggestions = generateSuggestions(stats, weeklyAchievements);
        
        // 6. 创建趋势图表
        const chartImage = await createTrendChart(records, startDate, endDate);
        
        // 7. 生成PDF报告
        const pdfBlob = await createPDFReport({
            startDate,
            endDate,
            stats,
            weeklyAchievements,
            suggestions,
            chartImage
        });
        
        console.log('✅ 每周健康简报生成成功！');
        return pdfBlob;
        
    } catch (error) {
        console.error('❌ 生成每周健康简报失败:', error);
        throw error;
    }
}

/**
 * 获取今天日期字符串（YYYY-MM-DD）
 */
function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 获取指定日期前n天的日期
 */
function getDateDaysAgo(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 计算本周统计数据
 */
function calculateWeeklyStats(records, startDate, endDate) {
    // 按日期分组
    const recordsByDate = {};
    records.forEach(record => {
        const date = record.date;
        if (!recordsByDate[date]) {
            recordsByDate[date] = [];
        }
        recordsByDate[date].push(record);
    });
    
    // 生成完整日期范围
    const dateRange = getDateRange(startDate, endDate);
    
    let totalCups = 0;
    let goalDays = 0;
    let weatherAdjustedDays = 0;
    
    dateRange.forEach(date => {
        const dayRecords = recordsByDate[date] || [];
        // 取当天的最后一条记录（最新的）
        const latestRecord = dayRecords.length > 0 ? dayRecords[dayRecords.length - 1] : null;
        
        if (latestRecord) {
            totalCups += latestRecord.cups_drunk || 0;
            
            // 检查是否达到目标
            const goal = latestRecord.goal || 8;
            const adjustedGoal = goal + (latestRecord.weather_adjustment || 0);
            if (latestRecord.cups_drunk >= adjustedGoal) {
                goalDays++;
            }
            
            // 检查是否有天气调整
            if (latestRecord.weather_adjustment && latestRecord.weather_adjustment !== 0) {
                weatherAdjustedDays++;
            }
        }
    });
    
    const totalDays = dateRange.length;
    const avgDailyCups = totalDays > 0 ? (totalCups / totalDays).toFixed(1) : 0;
    const goalRate = totalDays > 0 ? Math.round((goalDays / totalDays) * 100) : 0;
    
    return {
        totalCups,
        avgDailyCups: parseFloat(avgDailyCups),
        goalDays,
        totalDays,
        goalRate,
        weatherAdjustedDays,
        dateRange
    };
}

/**
 * 获取日期范围内的所有日期
 */
function getDateRange(startDate, endDate) {
    const range = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        range.push(`${year}-${month}-${day}`);
    }
    
    return range;
}

/**
 * 筛选本周解锁的成就
 */
function filterWeeklyAchievements(achievements, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 包含结束日期的全天
    
    return achievements.filter(achievement => {
        if (!achievement.unlocked_date) return false;
        const unlocked = new Date(achievement.unlocked_date);
        return unlocked >= start && unlocked <= end;
    });
}

/**
 * 生成个性化建议
 */
function generateSuggestions(stats, weeklyAchievements) {
    const suggestions = [];
    
    // 基于平均喝水量
    if (stats.avgDailyCups < 6) {
        suggestions.push({
            type: '水量不足',
            text: '本周平均喝水量偏低，建议增加上午喝水频率，每工作45分钟补充一杯水。'
        });
    } else if (stats.avgDailyCups >= 6 && stats.avgDailyCups < 8) {
        suggestions.push({
            type: '水量良好',
            text: '本周喝水习惯良好，继续保持！建议尝试在不同时间段均匀饮水。'
        });
    } else {
        suggestions.push({
            type: '水量优秀',
            text: '本周喝水量非常充足！保持这个节奏，身体会感谢你的。'
        });
    }
    
    // 基于达标率
    if (stats.goalRate < 50) {
        suggestions.push({
            type: '达标率提醒',
            text: `本周只有 ${stats.goalRate}% 的天数完成目标，建议设置更易达成的阶段性小目标。`
        });
    } else if (stats.goalRate >= 50 && stats.goalRate < 80) {
        suggestions.push({
            type: '达标率良好',
            text: `本周有 ${stats.goalRate}% 的天数完成目标，表现不错！继续努力向100%迈进。`
        });
    } else {
        suggestions.push({
            type: '达标率优秀',
            text: `本周 ${stats.goalRate}% 的天数完成目标，真是太棒了！你已经养成了优秀的喝水习惯。`
        });
    }
    
    // 基于天气调整
    if (stats.weatherAdjustedDays > 0) {
        suggestions.push({
            type: '天气适应',
            text: `本周有 ${stats.weatherAdjustedDays} 天根据天气调整了喝水量，这种灵活性对保持水分平衡很有帮助。`
        });
    }
    
    // 基于解锁成就
    if (weeklyAchievements.length > 0) {
        suggestions.push({
            type: '成就鼓励',
            text: `本周解锁了 ${weeklyAchievements.length} 个成就，你的努力水宝都看在眼里！继续保持这种积极性。`
        });
    }
    
    return suggestions;
}

/**
 * 创建本周喝水趋势图表（Chart.js）
 */
async function createTrendChart(records, startDate, endDate) {
    return new Promise(async (resolve, reject) => {
        try {
            // 动态加载Chart.js
            await loadScript(CHARTJS_CDN);
            
            // 按日期分组计算当日总杯数
            const recordsByDate = {};
            records.forEach(record => {
                const date = record.date;
                if (!recordsByDate[date]) {
                    recordsByDate[date] = [];
                }
                recordsByDate[date].push(record);
            });
            
            const dateRange = getDateRange(startDate, endDate);
            const labels = dateRange.map(date => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            });
            
            const data = dateRange.map(date => {
                const dayRecords = recordsByDate[date] || [];
                // 取当天的最后一条记录
                const latestRecord = dayRecords.length > 0 ? dayRecords[dayRecords.length - 1] : null;
                return latestRecord ? latestRecord.cups_drunk || 0 : 0;
            });
            
            // 创建画布元素
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 400;
            canvas.style.width = '800px';
            canvas.style.height = '400px';
            const ctx = canvas.getContext('2d');
            
            // 创建图表
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: '每日喝水量（杯）',
                        data,
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#4a90e2',
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '本周喝水趋势',
                            font: { size: 18 }
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '杯数'
                            },
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
            
            // 等待图表渲染完成
            setTimeout(() => {
                const imageUrl = canvas.toDataURL('image/png');
                resolve(imageUrl);
            }, 500);
            
        } catch (error) {
            console.error('创建趋势图表失败:', error);
            reject(error);
        }
    });
}

/**
 * 创建PDF报告
 */
async function createPDFReport(data) {
    return new Promise(async (resolve, reject) => {
        try {
            // 动态加载jsPDF
            await loadScript(JSPDF_CDN);
            
            // 等待jsPDF全局变量
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const { startDate, endDate, stats, weeklyAchievements, suggestions, chartImage } = data;
            
            // ========== 封面页 ==========
            doc.setFontSize(32);
            doc.setTextColor(74, 144, 226);
            doc.text('水宝提醒', 105, 40, { align: 'center' });
            
            doc.setFontSize(20);
            doc.setTextColor(100, 100, 100);
            doc.text('每周健康简报', 105, 55, { align: 'center' });
            
            doc.setFontSize(16);
            doc.setTextColor(150, 150, 150);
            doc.text(`${startDate} 至 ${endDate}`, 105, 70, { align: 'center' });
            
            // 水宝图标
            doc.setFontSize(60);
            doc.setTextColor(74, 144, 226);
            doc.text('💧', 105, 110, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('本报告基于您本周的喝水数据生成', 105, 140, { align: 'center' });
            doc.text('包含统计分析、成就总结和个性化建议', 105, 150, { align: 'center' });
            
            doc.setFontSize(10);
            doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 105, 170, { align: 'center' });
            
            // ========== 第二页：数据摘要 ==========
            doc.addPage();
            doc.setFontSize(22);
            doc.setTextColor(74, 144, 226);
            doc.text('📊 本周数据摘要', 20, 30);
            
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);
            
            let yPos = 50;
            doc.text(`报告周期: ${startDate} 至 ${endDate}`, 20, yPos);
            yPos += 10;
            doc.text(`总喝水量: ${stats.totalCups} 杯`, 20, yPos);
            yPos += 10;
            doc.text(`日均喝水量: ${stats.avgDailyCups} 杯`, 20, yPos);
            yPos += 10;
            doc.text(`达标天数: ${stats.goalDays}/${stats.totalDays} 天`, 20, yPos);
            yPos += 10;
            doc.text(`达标率: ${stats.goalRate}%`, 20, yPos);
            yPos += 10;
            doc.text(`天气调整天数: ${stats.weatherAdjustedDays} 天`, 20, yPos);
            
            // ========== 第三页：趋势图表 ==========
            if (chartImage) {
                doc.addPage();
                doc.setFontSize(22);
                doc.setTextColor(74, 144, 226);
                doc.text('📈 本周喝水趋势', 20, 30);
                
                doc.setFontSize(12);
                doc.setTextColor(100, 100, 100);
                doc.text('下图展示了您本周每天的喝水情况:', 20, 45);
                
                // 添加图表图片
                doc.addImage(chartImage, 'PNG', 20, 60, 170, 85);
            }
            
            // ========== 第四页：成就总结 ==========
            doc.addPage();
            doc.setFontSize(22);
            doc.setTextColor(74, 144, 226);
            doc.text('🏆 本周成就总结', 20, 30);
            
            if (weeklyAchievements.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(60, 60, 60);
                
                let y = 50;
                weeklyAchievements.forEach((achievement, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 30;
                    }
                    
                    doc.setFontSize(14);
                    doc.text(`${achievement.icon || '🏅'} ${achievement.name}`, 20, y);
                    
                    doc.setFontSize(10);
                    doc.text(achievement.description, 40, y + 7);
                    
                    if (achievement.unlocked_date) {
                        const date = new Date(achievement.unlocked_date).toLocaleDateString('zh-CN');
                        doc.text(`解锁时间: ${date}`, 40, y + 14);
                    }
                    
                    y += 25;
                });
            } else {
                doc.setFontSize(14);
                doc.setTextColor(150, 150, 150);
                doc.text('本周没有解锁新成就，继续努力哦！', 20, 60);
            }
            
            // ========== 第五页：个性化建议 ==========
            doc.addPage();
            doc.setFontSize(22);
            doc.setTextColor(74, 144, 226);
            doc.text('💡 个性化健康建议', 20, 30);
            
            if (suggestions.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(60, 60, 60);
                
                let y = 50;
                suggestions.forEach((suggestion, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 30;
                    }
                    
                    doc.setFontSize(14);
                    doc.text(`${suggestion.type}`, 20, y);
                    
                    doc.setFontSize(10);
                    const lines = doc.splitTextToSize(suggestion.text, 170);
                    doc.text(lines, 20, y + 7);
                    
                    y += 7 + (lines.length * 7) + 5;
                });
            }
            
            // ========== 最后一页：温馨提示 ==========
            doc.addPage();
            doc.setFontSize(18);
            doc.setTextColor(74, 144, 226);
            doc.text('💧 水宝温馨提示', 20, 30);
            
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            
            const tips = [
                '充足饮水有助于维持身体代谢、改善皮肤状态、提升注意力。',
                '建议每日喝水量为体重（kg）× 30ml，办公室工作者可适量增加。',
                '上午10点和下午3点是补充水分的最佳时段，设置提醒有助于养成习惯。',
                '天气炎热或干燥时，水分流失更快，需要相应增加喝水量。',
                '少量多次饮水比一次性大量饮水更有利于身体吸收。'
            ];
            
            let y = 50;
            tips.forEach((tip, index) => {
                doc.text(`${index + 1}. ${tip}`, 20, y);
                y += 10;
            });
            
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text('感谢您使用水宝提醒，祝您健康快乐每一天！', 105, 180, { align: 'center' });
            
            // 生成PDF Blob
            const pdfBlob = doc.output('blob');
            resolve(pdfBlob);
            
        } catch (error) {
            console.error('创建PDF报告失败:', error);
            reject(error);
        }
    });
}

/**
 * 动态加载脚本
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // 检查是否已加载
        if (window.Chart && src.includes('chart')) {
            resolve();
            return;
        }
        if (window.jspdf && src.includes('jspdf')) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 辅助函数：下载PDF文件
 */
export function downloadPDF(blob, filename = null) {
    if (!filename) {
        const today = getTodayDateString();
        filename = `weekly-report-${today}.pdf`;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 测试函数：在Node.js环境中生成PDF（用于开发测试）
 */
export async function generateTestPDF() {
    console.log('🧪 生成测试PDF...');
    // 此函数在浏览器环境中无效，仅用于测试
    return null;
}