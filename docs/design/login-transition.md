# 登录页/主页切换动效设计文档 (Login Transition Design)

> 最后更新：2026-02-19  
> 状态: 已实现 (Implemented)

本文档记录了 "JustMemo" 登录页面的交互逻辑、视觉隐喻以及关键技术实现细节。

> [!NOTE]
> 本项目的通用动画参数（缓动、时长、Spring 配置）已统一移至 **[Design System - Animation Specs](design-system.md#54-动画技术规范-animation-technical-specs)**。请优先参考该文档以保持一致性。

---

## 1. 需求背景 (Requirements)

用户希望登录页面不仅仅是一个简单的表单，而是一个具有叙事感的入口。

*   目标: 创建一个平滑且充满亲和力的过渡效果，让用户感觉是从“灵感画廊”（Home Preview）进入到了“个人创作空间”（Login Form）。
*   视觉风格: 现代圆润感，强调空间的流动性与平滑的几何衔接。
*   交互逻辑: 默认展示全屏的主页预览（Home Focus）。点击进入后，主页先平滑收缩为带有 12px 圆角的卡片（Card View），随后向右位移（Split View），登录表单从左侧滑入。

---

## 2. 核心逻辑 (Core Logic)

页面状态由一个状态机控制，新增了中间过渡状态以确保路径对称：

```typescript
type ViewMode = 'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW';
```

### 2.1 状态定义

1.  HOME_FOCUS (默认)
    *   主页预览: 占据全屏 (scale: 1, x: 0)，清晰可见 (blur: 0)。
    *   登录表单: 隐藏在左侧屏幕外 (x: -100%)。

2.  CARD_VIEW (过渡状态)
    *   主页预览: 缩放为居中卡片 (scale: 0.9, x: 0, borderRadius: 12px)。

3.  SPLIT_VIEW (分屏模式)
    *   主页预览: 缩小并移动到右侧 (scale: 0.9, x: 45%)，进入背景状态 (blur: 4px)。
    *   登录表单: 从左侧滑入占据左半部分 (x: 0, opacity: 1)。

### 2.2 动画路径 (Transition Paths)

- 进入路径: `HOME_FOCUS` -> `CARD_VIEW` (停留 600ms) -> `SPLIT_VIEW`
- 返回路径: `SPLIT_VIEW` -> `CARD_VIEW` (停留 600ms) -> `HOME_FOCUS`

---

## 3. 技术实现细节 (Technical Implementation)

### 3.1 状态追踪 (State Tracking)
使用 `useRef` 记录 `viewMode` 的历史，在 `useEffect` 中根据来源决定 `CARD_VIEW` 的下一步去向。

### 3.2 动效变体 (Animation Variants)
使用 `framer-motion` 的 `Variants` 统一管理三种状态的视觉参数。

---

## 4. 后续优化 (Future Considerations)
- 移动端适配: 探索在移动端垂直方向的收缩与展开逻辑。
- 性能: 在 `SPLIT_VIEW` 下进一步优化主页组件重绘性能。
