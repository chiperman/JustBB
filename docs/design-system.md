# JustMemo 设计系统 (Design System)

> **最后更新日期**：2026-02-18

## 1. 视觉风格
*   **定调**: 深度致敬 Anthropic 风格，追求纸质书写的温润感与学术优雅。

## 2. 配色系统 (Color Palette)
使用 `next-themes` 实现 **浅色 (Light)**、**深色 (Dark)** 和 **系统自动 (System)** 切换。

### 2.1 浅色模式 (Light Mode - Paper)
*   **背景色 (Background)**: `#fdfcf8` (暖白纸张感)
*   **前景色 (Foreground)**: `#191919` (柔和炭黑)
*   **卡片背景**: `#ffffff`

### 2.2 深色模式 (Dark Mode - Ink)
*   **背景色 (Background)**: `#121212` (深灰墨色)
*   **前景色 (Foreground)**: `#e5e5e5` (淡灰文字)
*   **卡片背景**: `#1e1e1e`

### 2.3 共享强调色 (Accents)
*   **主强调 (Primary)**: `#d97757` (赤陶色)
*   **次强调 (Secondary)**: `#3f6212` (深橄榄色)
*   **状态色**: 成功 `#40c463` / 失败 `#ff6b6b`
*   **边框色**: `#e5e5e0`

## 3. 排版系统 (Typography)
*   **标题 (Serif)**: 'Times New Roman', 'Georgia', serif。
*   **正文 (Sans)**: 'Inter', system-ui, sans-serif。
*   **代码 (Mono)**: 'ui-monospace', 'SFMono-Regular', monospace。
*   **交互逻辑**: 支持用户在前端一键切换 Serif/Sans 字体。

## 4. 形状与边限 (Shapes & Borders)
*   **统一全局圆角 (Unified Radius)**: `0.125rem` (2px / Tailwind `rounded-sm`)。
*   **标准化规范**: 全站所有容器（卡片）、交互元素（按钮、输入框）、标识类元素（标签、ID、提及）以及多媒体附件（图片）统一使用 2px 微圆角。

## 5. 交互反馈与动效

### 5.1 核心哲学 (Motion Philosophy)
*   **12 动画原则 (12 Principles of Animation)**: 全站动效需遵循迪士尼 12 动画原则（Web 适配版），重点包括：
    - **Timing (时间感)**: 用户触发的动画应在 300ms-500ms 内完成，平衡响应性与优雅感。
    - **Physics (物理特性)**: 使用 Spring (弹簧) 物理特性描述运动，赋予 UI 重量感与回弹感。
*   **响应性与反馈 (Fast & Rebound)**: 核心交互（如编辑器收缩）应追求快速响应。推荐参数：`Stiffness: 300`, `Damping: 20`, `Mass: 0.8`。这种配置提供极快的触发感，并伴有轻微的物理回弹（Overshoot），增强视觉活力。

### 5.2 关键切换标准 (Critical Transition Standards)
*   **登录切换 (Login Transition)**:
    - 阶段一：首页全屏 $\rightarrow$ 中央卡片（Spring: Snappy）。
    - 阶段二：首页卡片向右侧偏移（Spring: Gentle） + 背景模糊。
    - 阶段三：登录面板从左侧滑入 + 元素 Stagger (50ms 延迟)。
*   **内容列表 (Memo List)**:
    - **入场编排**: 采用视口触发方案 (`whileInView`)。
    - **流动性 (Flow)**: 强制使用 `layout` 属性配合稳定的 `memo.id` Key，处理列表项的增删与重新排序。

### 5.3 布局稳定性规范 (Layout Stability)
*   **物理隔离 (Physical Isolation)**: 对于吸顶 (Sticky) 的全局 UI 元素（如 Brand、搜索框），**禁止使用** Framer Motion 的 `layout` 属性。
*   **固定尺寸驱动**: 采用固定的 `padding` (例如 `pt-8 pb-4`) 和 CSS `transition` (如 `background-color`) 来处理滚动状态切换，确保物理位置在任何缩放/收缩动画下都保持绝对静止。
*   **内卷化动画**: 嵌套组件（如 `MemoEditor`）的伸缩应通过内部 `animate` 属性自驱动，确保其尺寸变化被局限在组件容器内，不干扰父级布局投影。

## 6. 时间线规范 (Timeline System)

### 6.1 结构定义
*   **Timeline**: 容器，设置左边距 `ml-[11px]` 及填充 `pl-6`。
*   **TimelineLine**: 垂直轴线，宽 `2px`。默认颜色 `bg-border/30`，激活状态为 `bg-primary`。
*   **TimelineDot**: 节点圆点。宽/高 `12px`，带 `2px` 边框。
*   **TimelineHeading**: 时间标题。使用 **Mono 字体**，`text-base` 字号，加粗。

## 7. 正文节点规范 (Content Nodes)

### 7.1 提及 (@Mention) & 引用
*   **样式**: `font-mono`, `bg-primary/10`, `text-primary`, `px-1`, `rounded-sm` (2px)。
*   **交互**: Hover 时 `bg-primary/20`，支持 Popover 预览。

### 7.2 标签 (#Hashtag)
*   **样式**: `font-mono`, `font-medium`, `text-[#5783f7]`, `mx-0.5`。

### 7.3 代码块 (Code Blocks)
*   **样式**: `bg-muted/50` 柔和背景，`border-border/40` 微边框。

## 8. 工程规范 (Engineering Standards)

### 8.1 Git 规范
*   **原子化提交 (Atomic Commits)**: 每个 Commit 只做一件事。
*   **Commit 规范 (Commitizen)**: 强制采用 `type(scope): subject` 格式。主题与正文使用 **中文**。

### 8.2 客户端缓存 (MemoCache)
*   **策略**: 离线优先 (Offline-First)。使用 `localStorage` 持久化。
