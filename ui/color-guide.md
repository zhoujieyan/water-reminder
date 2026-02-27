# 趣味卡通风格色彩指南

## 色彩理念
本应用采用明亮、活泼的色彩体系，营造清新健康的视觉感受，符合"趣味卡通"主题。色彩搭配以蓝色和绿色为主色调，象征水的清澈与健康；辅助色采用黄色、粉色等暖色调，增加活泼感和亲和力。

## 色彩变量说明

### 主色调
| 色块 | 变量名 | 色值 | 使用场景 |
|------|--------|------|----------|
| ![#4A90E2](https://via.placeholder.com/15/4A90E2/000000?text=+) | `--primary-blue` | `#4A90E2` | 主要按钮、重要元素、水杯主体色 |
| ![#6BA8FF](https://via.placeholder.com/15/6BA8FF/000000?text=+) | `--primary-blue-light` | `#6BA8FF` | 按钮悬停、高亮状态 |
| ![#2C6CB0](https://via.placeholder.com/15/2C6CB0/000000?text=+) | `--primary-blue-dark` | `#2C6CB0` | 按钮按下、阴影效果 |
| ![#50C878](https://via.placeholder.com/15/50C878/000000?text=+) | `--primary-green` | `#50C878` | 成功状态、进度条、健康指标 |
| ![#70E898](https://via.placeholder.com/15/70E898/000000?text=+) | `--primary-green-light` | `#70E898` | 成功状态高亮 |
| ![#2E9C5E](https://via.placeholder.com/15/2E9C5E/000000?text=+) | `--primary-green-dark` | `#2E9C5E` | 成功状态阴影 |

### 辅助色
| 色块 | 变量名 | 色值 | 使用场景 |
|------|--------|------|----------|
| ![#FFD166](https://via.placeholder.com/15/FFD166/000000?text=+) | `--accent-yellow` | `#FFD166` | 警告状态、成就徽章 |
| ![#FF9A5A](https://via.placeholder.com/15/FF9A5A/000000?text=+) | `--accent-orange` | `#FF9A5A` | 提醒通知、活跃元素 |
| ![#FF6B8B](https://via.placeholder.com/15/FF6B8B/000000?text=+) | `--accent-pink` | `#FF6B8B` | 错误状态、特殊功能 |
| ![#9D6BFF](https://via.placeholder.com/15/9D6BFF/000000?text=+) | `--accent-purple` | `#9D6BFF` | 趣味元素、装饰 |

### 中性色
| 色块 | 变量名 | 色值 | 使用场景 |
|------|--------|------|----------|
| ![#F8FBFF](https://via.placeholder.com/15/F8FBFF/000000?text=+) | `--bg-color` | `#F8FBFF` | 页面背景色 |
| ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) | `--card-bg` | `#FFFFFF` | 卡片背景色 |
| ![#333333](https://via.placeholder.com/15/333333/000000?text=+) | `--text-primary` | `#333333` | 主要文字 |
| ![#666666](https://via.placeholder.com/15/666666/000000?text=+) | `--text-secondary` | `#666666` | 次要文字 |
| ![#999999](https://via.placeholder.com/15/999999/000000?text=+) | `--text-muted` | `#999999` | 禁用文字 |
| ![#E0E6FF](https://via.placeholder.com/15/E0E6FF/000000?text=+) | `--border-color` | `#E0E6FF` | 边框颜色 |

### 状态色
| 色块 | 变量名 | 色值 | 使用场景 |
|------|--------|------|----------|
| ![#50C878](https://via.placeholder.com/15/50C878/000000?text=+) | `--success-color` | `#50C878` | 成功操作 |
| ![#FFD166](https://via.placeholder.com/15/FFD166/000000?text=+) | `--warning-color` | `#FFD166` | 警告提示 |
| ![#FF6B8B](https://via.placeholder.com/15/FF6B8B/000000?text=+) | `--error-color` | `#FF6B8B` | 错误提示 |
| ![#4A90E2](https://via.placeholder.com/15/4A90E2/000000?text=+) | `--info-color` | `#4A90E2` | 信息提示 |

## 字体变量
- `--font-family-base`: 'Arial Rounded MT Bold', 'Arial', sans-serif
  - 基础字体，具有圆润的卡通感，用于正文内容
- `--font-family-heading`: 'Comic Sans MS', 'Chalkboard SE', cursive
  - 标题字体，更具趣味性和手写感，用于标题和重要标签

## 使用示例
```css
/* 导入变量文件 */
@import "variables.css";

/* 使用变量 */
.button {
  background-color: var(--primary-blue);
  color: white;
  font-family: var(--font-family-base);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.button:hover {
  background-color: var(--primary-blue-light);
  box-shadow: var(--shadow-md);
}
```

## 设计原则
1. **一致性**：全站使用统一的色彩变量，确保视觉一致
2. **可访问性**：确保文字与背景有足够的对比度（至少4.5:1）
3. **情感化**：使用温暖活泼的色彩提升用户愉悦感
4. **层次感**：通过明度变化建立视觉层次，突出重要元素