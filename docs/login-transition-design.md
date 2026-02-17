# 登录页/主页切换动效设计文档 (Login Transition Design)

> **版本 (Version)**: 1.1
> **状态 (Status)**: 已实现 (Implemented)

本文档记录了 "JustMemo" 登录页面的交互逻辑、视觉隐喻以及关键技术实现细节。

---

## 1. 需求背景 (Requirements)

用户希望登录页面不仅仅是一个简单的表单，而是一个具有**叙事感**的入口。

*   **目标**: 创建一个平滑的过渡效果，让用户感觉是从“门口”（Home Preview）进入到了“书房内部”（Login Form）。
*   **视觉风格**: 延续 "The Writer's Study" 的隐喻，沉稳、优雅、有物理质感。
*   **交互逻辑**: 默认展示全屏的主页预览（Home Focus）。点击进入后，主页先收缩为卡片（Card View），随后向右位移（Split View），登录表单从左侧滑入。

---

## 2. 核心逻辑 (Core Logic)

页面状态由一个状态机控制，新增了中间过渡状态以确保路径对称：

```typescript
type ViewMode = 'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW';
```

### 2.1 状态定义

1.  **HOME_FOCUS (默认)**
    *   **主页预览**: 占据全屏 (scale: 1, x: 0)，清晰可见 (blur: 0)。
    *   **登录表单**: 隐藏在左侧屏幕外 (x: -100%)。

2.  **CARD_VIEW (过渡状态)**
    *   **主页预览**: 缩放为居中卡片 (scale: 0.9, x: 0, borderRadius: 24px)。
    *   **作用**: 作为 `HOME_FOCUS` 与 `SPLIT_VIEW` 之间的缓冲，确保缩放与位位移分步进行。

3.  **SPLIT_VIEW (分屏模式)**
    *   **主页预览**: 缩小并移动到右侧 (scale: 0.9, x: 45%)，进入背景状态 (blur: 4px)。
    *   **登录表单**: 从左侧滑入占据左半部分 (x: 0, opacity: 1)。

### 2.2 动画路径 (Transition Paths)

为了实现视觉上的连贯性，我们实现了**对称路径**转换逻辑：

- **进入路径**: `HOME_FOCUS` -> `CARD_VIEW` (停留 600ms) -> `SPLIT_VIEW`
- **返回路径**: `SPLIT_VIEW` -> `CARD_VIEW` (停留 600ms) -> `HOME_FOCUS`

该逻辑在 `LoginTransitionWrapper` 中通过 `prevViewModeRef` 追踪前一状态实现。

---

## 3. 技术实现细节 (Technical Implementation)

### 3.1 状态追踪 (State Tracking)
使用 `useRef` 记录 `viewMode` 的历史，在 `useEffect` 中根据来源决定 `CARD_VIEW` 的下一步去向。

### 3.2 动效变体 (Animation Variants)
使用 `framer-motion` 的 `Variants` 统一管理三种状态的视觉参数：
- `home`: 全屏展示。
- `card`: 居中缩放。
- `split`: 位移压暗。

### 3.3 全局上下文注入与防御
(保持原有关于 TimelineProvider 和 Safe Return 模式的记录不变...)

---

## 4. 后续优化 (Future Considerations)
- **移动端适配**: 探索在移动端垂直方向的收缩与展开逻辑。
- **性能**: 在 `SPLIT_VIEW` 下进一步优化主页组件重绘性能。
