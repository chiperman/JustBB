# 设计规范：侧边栏收缩按钮动画优化

## 1. 目标描述

优化左侧和右侧侧边栏收缩按钮的动画效果，采用“极简呼吸感”风格。确保项目视觉一致性，提升界面“高级感”，并遵循“人文主义极简”的设计哲学。

## 2. 组件架构

提取一个可复用的 `SidebarCollapseButton` 组件，替代目前在 `LeftSidebar.tsx` 和 `RightSidebar.tsx` 中分散的实现。

### SidebarCollapseButton 属性定义 (Props)

| 属性          | 类型         | 描述                        |
| :------------ | :----------- | :-------------------------- | -------------------------- |
| `isCollapsed` | `boolean`    | 当前收缩状态                |
| `onClick`     | `() => void` | 点击回调                    |
| `side`        | `'left'      | 'right'`                    | 归属侧边栏（决定图标方向） |
| `isMobile`    | `boolean`    | (可选) 左侧边栏的移动端模式 |
| `label`       | `string`     | ARIA 标签                   |
| `className`   | `string`     | (可选) 自定义样式           |

## 3. 动画规范 (方案 A：同步缩放淡入淡出)

使用 `framer-motion` 处理所有过渡效果。

### 时间与节奏

- **持续时间 (Duration)**: `0.15s`
- **缓动函数 (Ease)**: `[0.4, 0, 0.2, 1]` (三次贝塞尔曲线)
- **AnimatePresence 模式**: `wait` (确保图标不会重叠)

### 关键帧 (Keyframes)

- **初始/进入 (Initial/Enter)**: `{ opacity: 0, scale: 0.9 }`
- **动画中 (Animate)**: `{ opacity: 1, scale: 1 }`
- **退出 (Exit)**: `{ opacity: 0, scale: 0.9 }`

### 交互状态

- **悬停 (Hover)**: `scale(1.02)` (继承全局按钮样式)
- **点击 (whileTap)**: `scale(0.95)` (与 `design.md` 中的全局点击态同步)

## 4. 视觉语言一致性

- **图标选择**:
  - 左侧边栏：`PanelLeftOpenIcon` (收缩时), `PanelLeftCloseIcon` (展开时)
  - 右侧边栏：`PanelRightOpenIcon` (收缩时), `PanelRightCloseIcon` (展开时)
  - 移动端左侧边栏：`Cancel01Icon`
- **颜色**: 使用 `text-muted-foreground`，悬停时切换至 `text-foreground` 并显示 `bg-secondary` 背景。
- **边框**: 保持无边框，或仅在需要增强对比度时使用“极细边框”。

## 5. 验证计划

### 手动测试

- 验证桌面端左侧边栏按钮（收缩/展开）。
- 验证移动端左侧边栏按钮（关闭）。
- 验证桌面端右侧边栏按钮（收缩/展开）。
- 确保图标切换速度与侧边栏整体滑动节奏协调。
