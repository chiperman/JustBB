# 全局动画规范 (Global Animation Guidelines)

为了确保 JustBB 项目中交互体验的一致性与高发，所有动画实现必须遵循以下规范。我们主要使用 `framer-motion` 作为动画库。

## 核心原则 (Core Principles)

1.  **响应迅速 (Snappy)**: 用户触发的动画应立即开始，且持续时间通常不超过 300ms。
2.  **物理自然 (Natural)**: 优先使用 Spring (弹性) 动画，模拟真实物理世界的阻尼与刚度，避免机械的线性运动。
3.  **目的明确 (Purposeful)**: 动画应辅助理解（如空间关系、状态变化），而非由于装饰。

## 标准参数 (Standard Parameters)

### Transition Presets (过渡预设)

在 `framer-motion` 中通用的 `transition` 配置：

```typescript
export const spring = {
  stiff: {
    type: "spring",
    stiffness: 500,
    damping: 30,
    restDelta: 0.001
  },
  default: {
    type: "spring",
    stiffness: 350,
    damping: 40, // 略微增加阻尼，减少过度回弹
    mass: 1,
    restDelta: 0.001
  },
  soft: {
    type: "spring",
    stiffness: 200,
    damping: 25,
    restDelta: 0.001
  }
};

export const ease = {
  out: [0.22, 1, 0.36, 1], // easeOutQuint - 快速进入，缓慢停止
  in: [0.64, 0, 0.78, 0],  // easeInQuint - 缓慢开始，快速结束（用于退出）
  inOut: [0.83, 0, 0.17, 1] // easeInOutQuint
};

export const duration = {
  fast: 0.2,
  default: 0.3,
  slow: 0.5
};
```

### 常用模式 (Common Patterns)

#### 1. 模态框/对话框 (Modals/Dialogs)

-   **Enter**: Scale 0.95 -> 1, Opacity 0 -> 1 (`spring.default`)
-   **Exit**: Scale 1 -> 0.95, Opacity 1 -> 0 (`duration.fast`, `ease.in`)

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={spring.default}
/>
```

#### 2. 列表项 (List Items)

-   **Enter**: Opacity 0 -> 1, Y 20 -> 0 (带有 staggerChildren)
-   **Exit**: Opacity 1 -> 0, Height auto -> 0 (使用 `layout` 属性平滑布局)

#### 3. 侧边栏/抽屉 (Sidebar/Drawer)

-   **Enter**: X -100% -> 0% (`spring.stiff` 此时阻尼可稍小，确保跟手)
-   **Exit**: X 0% -> -100% (`ease.in`, `duration.default`)

#### 4. 显隐切换 (Toggle Visibility) - *如 MemoEditor*

-   **Enter**: Height 0 -> auto, Opacity 0 -> 1
-   **Exit**: Height auto -> 0, Opacity 1 -> 0
-   **关键点**: 使用 `layout` 属性处理高度变化，避免布局跳变。

```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
  exit={{ opacity: 0, height: 0 }}
  transition={spring.default}
  style={{ overflow: "hidden" }} // 动画过程中防止内容溢出
/>
```

## 实现检查清单 (Checklist)

-   [ ] **Layout Thrashing**: 是否在动画高频触发时读取了布局属性（offsetWidth 等）？考虑使用 `layout` prop 或 `transform`。
-   [ ] **Will Change**: 对于复杂动画，是否添加了 `will-change: transform, opacity`？
-   [ ] **Reduced Motion**: 是否尊重用户的 `prefers-reduced-motion` 设置？

## 颜色与主题过渡

-   主题切换应使用 CSS transition (`background-color 0.3s ease`)，通常不需要弹簧效果。

---

*随着项目发展，请持续更新此文档。*
