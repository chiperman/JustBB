# 设计规范：侧边栏收缩按钮动画优化 (修订版)

## 1. 目标描述

优化左右侧边栏收缩按钮，解决因 CSS 缩放与 Motion 动画冲突导致的视觉“怪异感”。通过统一使用 `framer-motion` 接管交互状态，实现高度一致、物理感强且丝滑的“极简呼吸感”动效。

## 2. 组件架构

提取 `SidebarCollapseButton` 通用组件。

### 核心改进 (针对怪异感)

- **禁用原生 CSS 缩放**: 覆盖 `Button` 组件的 `hover:scale-102` 和 `active:scale-95` 类，避免双重缩放冲突。
- **动效统一**: 按钮整体的 Hover/Tap 以及图标的切换全部交由 `framer-motion` 处理，共享同一套缓动参数。

## 3. 动画与交互参数

### 全局缓动配置 (Synced Motion)

- **持续时间 (Duration)**: `0.15s`
- **缓动曲线 (Ease)**: `[0.23, 1, 0.32, 1]` (更具高级感的缓出曲线，比标准 ease-out 更轻盈)

### 交互反馈

- **Hover (悬停)**: 整体 `scale: 1.02`
- **Tap (点击)**: 整体 `scale: 0.95`
- **Icon Switch (切换)**: 图标 `opacity: 0 -> 1`, `scale: 0.9 -> 1`

## 4. 视觉规范

- **圆角**: 统一为 `rounded-md` (8px)。
- **样式**: `variant="ghost"`，悬停时仅保留 `bg-secondary` 和 `text-foreground`，移除 `ring` 干扰。

## 5. 实施路径

1. 创建 `SidebarCollapseButton`。
2. 在组件内部使用 `motion(Button)`。
3. 替换 `LeftSidebar` 和 `RightSidebar` 的实现。
