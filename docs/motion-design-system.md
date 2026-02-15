# JustMemo 动效设计系统 (Motion Design System)
> "作家的书房" (The Writer's Study) —— 沉稳、有分量、意图明确。

本文档定义了 JustMemo 应用的动效原则和可复用的动画模式。我们的动画旨在模拟安静房间中的物理实体：它们拥有重量，移动时推开空气，从不匆忙。

---

## 1. 核心哲学 (Core Philosophy)

*   **重于快 (Weight over Speed)**: 物体应当感觉有质量。使用较低的刚度 (Stiffness) 和较高的阻尼 (Damping)。
*   **编排感 (Orchestration)**: 元素从不一次性全部出现。它们按顺序流动 (Stagger)，引导用户的视线。
*   **触觉反馈 (Tactile Feedback)**: 交互 (Hover, Tap) 应当感觉灵敏但扎实，就像按下高质量的机械按键。
*   **氛围感 (Atmosphere)**: 背景从不是静止的；它们缓慢呼吸，让空间感觉充满生机。

---

## 2. 物理参数 (Physics Constants)

我们几乎所有的运动都使用 **Spring (弹簧)** 物理模型，以确保自然的响应性。

| 参数 (Parameter) | 值 (Value) | 感觉 (Feel) | 适用场景 (Use Case) |
| :--- | :--- | :--- | :--- |
| **Stiffness** | `100` | 沉重、放松 | 主布局元素，大卡片入场。 |
| **Damping** | `20-25` | 克制、无振荡 | 防止“果冻效应”。高阻尼带来“昂贵/高级”的质感。 |
| **Stiffness** | `220` | 灵敏、流畅 | 中型元素，警告框，模态窗。 |
| **Stiffness** | `400` | 干脆、触觉 | 微交互 (按钮, 开关)。 |

---

## 3. 可复用变体 (Reusable Variants)

将这些变体对象复制到你的组件中，即可立即应用 JustMemo 的动效语言 (基于 Framer Motion)。

### 3.1. 错落容器 (Staggered Container - Parent)

用于页面或区块的主包装器。它负责控制子元素的 *时间调度*。

```tsx
import { Variants } from 'framer-motion';

// 1. 缓慢、沉思的流动 (页面加载 - Page Load)
export const pageContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12, // 缓慢涟漪
            delayChildren: 0.3     // 先让空间呼吸
        }
    }
};

// 2. 快速、即时的流动 (嵌套列表/网格 - Nested Lists / Grids)
export const listContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05, // 快速涟漪
            delayChildren: 0       // 随父容器立即启动，无额外延迟
        }
    }
};
```

### 3.2. 入场子项 (Entering Item - Child)

应用此变体到容器 *内部* 的 `motion.div` 元素。它们会自动遵循父容器的错落延迟。

```tsx
export const itemVariants: Variants = {
    hidden: { 
        y: 20,              // 从下方 20px 滑入
        opacity: 0,         // 淡入
        filter: 'blur(4px)' // 柔焦效果
    },
    visible: {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
            type: 'spring',
            bounce: 0,
            duration: 0.8,
            stiffness: 100, // 沉重感
            damping: 20
        }
    }
};
```

### 3.3. 展开卡片 (Unfolding Card - Modal / Panel)

用于需要从中心弹出或展开的元素。

```tsx
export const cardVariants: Variants = {
    hidden: { 
        scale: 0.96, 
        opacity: 0, 
        y: 10 
    },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 220, // 更流畅的展开
            damping: 25
        }
    }
};
```

---

## 4. 交互模式 (Interaction Patterns)

*注：当前版本已移除按钮的 Hover/Tap 缩放动效，以保持界面的极致沉稳与简洁。交互反馈仅通过色彩变化与光标状态体现。*

## 5. 防止内容闪烁 (Preventing FOUC)

为了防止动画加载前的白屏闪烁：

1.  **始终** 给初始 `motion.div` 添加 `opacity-0` 类。
2.  让 Framer Motion 接管可见性切换。

```tsx
<motion.div 
    className="opacity-0" // CSS 初始隐藏
    animate={{ opacity: 1 }} // JS 负责揭示
>
    Content
</motion.div>
```

---

## 6. 实例参考 (Examples)

*   [登录页/主页切换动效设计 (Login Transition Design)](./login-transition-design.md) - 详解了如何实现全屏预览到分屏表单的复杂过渡。
*   [登录页动效分步实现计划 (Login Transition Roadmap)](./login-transition-roadmap.md) - 记录了从全屏->卡片->分屏的迭代步骤。
