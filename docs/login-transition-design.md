# 登录页/主页切换动效设计文档 (Login Transition Design)

> **版本 (Version)**: 1.0
> **状态 (Status)**: 未实现

本文档记录了 "JustMemo" 登录页面的交互逻辑、视觉隐喻以及关键技术实现细节。

---

## 1. 需求背景 (Requirements)

用户希望登录页面不仅仅是一个简单的表单，而是一个具有**叙事感**的入口。

*   **目标**: 创建一个平滑的过渡效果，让用户感觉是从“门口”（Home Preview）进入到了“书房内部”（Login Form）。
*   **视觉风格**: 延续 "The Writer's Study" 的隐喻，沉稳、优雅、有物理质感。
*   **交互逻辑**: 默认展示全屏的主页预览（Home Focus），用户点击 "Authenticate" 后，主页后退并缩小，登录表单从左侧滑入（Split View）。

---

## 2. 核心逻辑 (Core Logic)

页面状态由一个简单的状态机控制：

```typescript
type ViewMode = 'HOME_FOCUS' | 'SPLIT_VIEW';
```

### 2.1 状态定义

1.  **HOME_FOCUS (默认)**
    *   **主页预览**: 占据全屏 (scale: 1, x: 0)，清晰可见 (blur: 0)。
    *   **登录表单**: 隐藏在左侧屏幕外 (x: -100%)，不可见 (opacity: 0)。
    *   **交互**: 用户可以浏览主页预览（只读），点击 "Authenticate" 按钮触发切换。

2.  **SPLIT_VIEW (分屏模式)**
    *   **主页预览**: 缩小并移动到右侧 (scale: 0.9, x: 50%)，进入背景状态 (blur: 2px, grayscale)。
    *   **登录表单**: 从左侧滑入占据左半部分 (x: 0, opacity: 1)。
    *   **交互**: 用户在左侧填写表单。点击右侧的主页预览区域可返回 `HOME_FOCUS` 模式。

### 2.2 动效变体 (Animation Variants)

使用 `framer-motion` 实现基于物理弹簧的过渡：

**主页面板 (Home Panel)**:
```typescript
const homeTransitionVariants = {
    home: {
        scale: 1,
        x: '0%',
        filter: 'blur(0px) brightness(1)',
        // 慢速、优雅的弹簧
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    },
    split: {
        scale: 0.9,
        x: '45%', // 移动到右半边，留出左侧空间
        filter: 'blur(4px) brightness(0.95)', // 视觉后退，轻微压暗
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    },
    hover: { // 悬停交互
        scale: 0.9,
        x: '45%',
        filter: 'blur(0px) brightness(1)', // 清除模糊和压暗
        transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
    }
};
```

**登录面板 (Login Panel)**:
```typescript
const loginPanelVariants = {
    home: {
        x: '-100%',
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.6, ease: 'easeIn' }
    },
    split: {
        x: '0%',
        opacity: 1,
        scale: 0.9, // 保持卡片大小一致
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
};
```

---

## 3. 技术实现细节 (Technical Implementation)

为了支撑这一复杂的交互，我们在架构上做出了以下关键决策：

### 3.1 全局上下文注入 (Global Context Injection)
**问题**: 在页面从 `SPLIT_VIEW` 切换回 `HOME_FOCUS` 或进行路由跳转时，嵌套在主页预览中的组件（如 `MemoFeed`）会因为 momentarily losing context 而报错 (`useTimeline must be used within a TimelineProvider`)。

**解决方案**:
我们将 `TimelineProvider` 提升至 `LoginPage` 的**最顶层根节点**。
```tsx
export default function LoginPage() {
    return (
        <TimelineProvider>
            {/* ... 所有的动画容器和子组件 ... */}
        </TimelineProvider>
    );
}
```
这确保了无论组件树如何进行动画变形或挂载/卸载，Context 始终存在。

### 3.2 防御性 Context 钩子 (Defensive Context Hook)
**问题**: 即使有了顶层 Provider，在 Next.js 的路由跳转（`router.push`）过程中，可能会出现极短的瞬间，旧的组件还在渲染但 Provider 已经开始卸载。

**解决方案**:
在 `src/context/TimelineContext.tsx` 中实现了 `Safe Return` 模式：
```typescript
export function useTimeline() {
    const context = useContext(TimelineContext);
    if (!context) {
        // 返回安全占位符，防止崩溃
        return { activeId: null, setActiveId: () => {}, ... };
    }
    return context;
}
```

### 3.3 异步组件隔离 (Suspense Isolation)
主页预览组件 (`MainLayoutClient`) 依赖于 URL 参数 (`useSearchParams`)。为了防止它阻塞整个登录页面的加载，我们将其包裹在 `Suspense` 中：
```tsx
<Suspense fallback={<div className="animate-pulse..." />}>
    <MainLayoutClient ... />
</Suspense>
```

### 3.4 视图层级管理 (Z-Index Hierarchy)
*   **Background (z-0)**: 装饰性大文字 "Draft/Archive"。
*   **Home Panel (z-10)**: 主页预览。
*   **Login Panel (z-20)**: 登录表单，确保滑入时覆盖在背景之上，但与主页预览并排。
*   **Overlay Controls (z-50)**: "Authenticate" 按钮和返回触发器，确保始终可点击。

---

## 4. 未来优化 (Future Considerations)
*   **性能**: 目前主页预览是在客户端渲染的。如果数据量过大，考虑在 `SPLIT_VIEW` 模式下暂停其内部的实时更新。
*   **移动端适配**: 目前动效主要针对桌面端优化。移动端可能需要采用垂直堆叠或完全不同的模态交互。
