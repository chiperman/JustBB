# JustMemo 设计系统 (Design System)

> 最后更新：2026-02-19

## 1. 视觉风格
*   定调: 深度致敬 Anthropic 风格，追求纸质书写的温润感与学术优雅。

## 2. 配色系统 (Color Palette)
使用 `next-themes` 实现 浅色 (Light)、深色 (Dark) 和 系统自动 (System) 切换。

### 2.1 浅色模式 (Light Mode - Paper)
*   背景色 (Background): `#fdfcf8` (暖白纸张感)
*   前景色 (Foreground): `#191919` (柔和炭黑)
*   卡片背景: `#ffffff`

### 2.2 深色模式 (Dark Mode - Ink)
*   背景色 (Background): `#121212` (深灰墨色)
*   前景色 (Foreground): `#e5e5e5` (淡灰文字)
*   卡片背景: `#1e1e1e`

### 2.3 共享强调色 (Accents)
*   主强调 (Primary): `#d97757` (赤陶色)
*   次强调 (Secondary): `#3f6212` (深橄榄色)
*   状态色: 成功 `#40c463` / 失败 `#ff6b6b`
*   边框色: `#e5e5e0`

## 3. 排版系统 (Typography)
*   标题 (Serif): 'Times New Roman', 'Georgia', serif。
*   正文 (Sans): 'Inter', system-ui, sans-serif。
*   代码 (Mono): 'ui-monospace', 'SFMono-Regular', monospace。
*   交互逻辑: 支持用户在前端一键切换 Serif/Sans 字体。

## 4. 形状与边限 (Shapes & Borders)
*   统一全局圆角 (Unified Radius): `0.125rem` (2px / Tailwind `rounded-sm`)。
*   标准化规范: 全站所有容器（卡片）、交互元素（按钮、输入框）、标识类元素（标签、ID、提及）以及多媒体附件（图片）统一使用 2px 微圆角。

## 5. 交互反馈与动效

### 5.1 核心哲学 (Motion Philosophy)
*   12 动画原则 (12 Principles of Animation): 全站动效需遵循迪士尼 12 动画原则（Web 适配版），重点包括：
    - Timing (时间感): 用户触发的动画应在 300ms-500ms 内完成，平衡响应性与优雅感。
    - Physics (物理特性): 使用 Spring (弹簧) 物理特性描述运动，赋予 UI 重量感与回弹感。
*   坚实与稳定 (Solid & Stable): 核心伸缩交互（如编辑器收缩）应追求快速且无形变的响应。推荐参数：`Stiffness: 350`, `Damping: 40`, `Mass: 1.0`。此配置能提供极佳的确定感，避免视觉震荡。

### 5.2 关键切换标准 (Critical Transition Standards)
*   登录切换 (Login Transition):
    - 阶段一：首页全屏 $\rightarrow$ 中央卡片（Spring: Snappy）。
    - 阶段二：首页卡片向右侧偏移（Spring: Gentle） + 背景模糊。
    - 阶段三：登录面板从左侧滑入 + 元素 Stagger (50ms 延迟)。
*   内容列表 (Memo List):
    - 入场编排: 采用视口触发方案 (`whileInView`)。
    - 流动性 (Flow): 强制使用 `layout` 属性配合稳定的 `memo.id` Key，处理列表项的增删与重新排序。

### 5.4 动画技术规范 (Animation Technical Specs)

为了确保全站动效的一致性与高发，所有动画实现必须遵循以下规范。我们主要使用 `framer-motion` 作为动画库。

#### 5.4.1 标准参数 (Standard Parameters)

在 `framer-motion` 中通用的 `transition` 配置（代码引用自 `@/lib/animation.ts`）：

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
  fast: 0.2, // 微交互 (Hover, Click)
  default: 0.3, // 界面过渡 (Modal, Page)
  slow: 0.5 // 复杂编排 (Sequence)
};
```

#### 5.4.2 常用模式 (Common Patterns)

**1. 模态框/对话框 (Modals/Dialogs)**

-   **Enter**: Scale 0.95 -> 1, Opacity 0 -> 1 (`spring.default`)
-   **Exit**: Scale 1 -> 0.95, Opacity 1 -> 0 (`duration.fast`, `ease.in`)

**2. 列表项 (List Items)**

-   **Enter**: Opacity 0 -> 1, Y 20 -> 0 (带有 staggerChildren)
-   **Exit**: Opacity 1 -> 0, Height auto -> 0 (使用 `layout` 属性平滑布局)

**3. 侧边栏/抽屉 (Sidebar/Drawer)**

-   **Enter**: X -100% -> 0% (`spring.stiff` 此时阻尼可稍小，确保跟手)
-   **Exit**: X 0% -> -100% (`ease.in`, `duration.default`)

**4. 显隐切换 (Toggle Visibility) - *如 MemoEditor***

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

#### 5.4.3 实现检查清单 (Checklist)

-   [ ] **Layout Thrashing**: 是否在动画高频触发时读取了布局属性（offsetWidth 等）？考虑使用 `layout` prop 或 `transform`。
-   [ ] **Will Change**: 对于复杂动画，是否添加了 `will-change: transform, opacity`？
-   [ ] **Reduced Motion**: 是否尊重用户的 `prefers-reduced-motion` 设置？

### 5.5 布局稳定性规范 (Layout Stability)
*   去果冻化 (De-Jelly)：彻底移除了编辑器内部的所有 `layout` 投影属性。这一改动直接消除了 Framer Motion 在容器尺寸变化时对文字进行的拉伸补偿（即“果冻感”），确保文字在展开过程中保持绝对的视觉形态稳定。
*   物理参数 hardening：将物理模型调整为 `Stiffness: 350, Damping: 40`。这套响应更敏捷的参数大幅减少了动画末端的冗余震荡（Oscillation），使整个动效显得更加“坚硬”且具有高级感。
*   硬件加速 (GPU Acceleration)：通过 `will-change: transform, min-height, opacity` 保留了 60FPS 的极致流畅度，而不依赖于 2D 缩放投影。
*   固定尺寸驱动: 采用固定的 `padding` (例如 `pt-8 pb-4`) 和 CSS `transition` (如 `background-color`) 来处理滚动状态切换，确保物理位置在任何缩放/收缩动画下都保持绝对静止。
*   内卷化动画: 嵌套组件（如 MemoEditor）的伸缩应通过内部 animate 属性自驱动（如控制 minHeight），确保其尺寸变化被局限在组件容器内，并引入 isAnimating 状态在动画期间临时锁定 overflow 与控制遮罩 (mask-image)，以隔离渲染开销并确保长文本动效流畅。

> 详细的编辑器动画策略与防抖动实现，请参阅: [编辑器动画策略 (Editor Animation Strategy)](./editor-transitions.md)

### 5.4 交互反馈规范 (Interactive Feedback)
*   悬停可见 (Hover-Visible): 为了保持卡片视觉整洁，MemoCard 的操作按钮默认隐藏，仅在鼠标悬停在卡片区域时显现。
*   复制反馈: 代码块点击复制后，图标与文字颜色瞬间切换为 primary 橙色，提供清晰的操作回响。

## 6. 时间线规范 (Timeline System)

### 6.1 结构定义
*   Timeline: 容器，设置左边距 `ml-[11px]` 及填充 `pl-6`。
*   TimelineLine: 垂直轴线，宽 `2px`。默认颜色 `bg-border/30`，激活状态为 `bg-primary`。
*   TimelineDot: 节点圆点。宽/高 `12px`，带 `2px` 边框。
*   TimelineHeading: 时间标题。使用 Mono 字体，`text-base` 字号，加粗。

## 7. 正文节点规范 (Content Nodes)

### 7.1 提及 (@Mention) & 引用
*   样式: `font-mono`, `bg-primary/10`, `text-primary`, `px-1`, `rounded-sm` (2px)。
*   交互: Hover 时 `bg-primary/20`，支持 Popover 预览。

### 7.2 标签 (#Hashtag)
*   样式: `font-mono`, `font-medium`, `text-[#5783f7]`, `mx-0.5`。

### 7.3 代码块 (Code Blocks)
*   样式: `bg-muted/50` 柔和背景，`border-border/40` 微边框。

## 8. 工程规范 (Engineering Standards)

### 8.1 Git 规范
*   原子化提交 (Atomic Commits): 每个 Commit 只做一件事。
*   Commit 规范 (Commitizen): 强制采用 `type(scope): subject` 格式。主题与正文使用 中文。

### 8.2 客户端缓存 (MemoCache)
*   策略: 离线优先 (Offline-First)。使用 `localStorage` 持久化。
*   清除逻辑: 退出登录或手动重置时清除相关缓存。

## 9. 图标与文本对齐规范 (Icon & Text Alignment)

为了确保全站视觉的绝对严谨与和谐，所有“图标 + 文本”组合必须遵循以下对齐准则。

### 9.1 等高匹配原则 (Equal-Height Principle)
*   **核心逻辑**: 图标的像素高度应尽可能与文本的字号（Font Size）或视觉重心高度一致。
*   **标准尺寸**: 
    - 对于 `14px` (text-sm) 的正文或导航文字，图标应统一使用 `size-3.5` (14px)。
    - 对于 `16px` (text-base) 的文字，图标应使用 `size-4` (16px)。
*   **理由**: 等高匹配允许 `flex items-center` 在物理结构上实现完美的垂直居中，无需额外的 `translate-y` 微调。

### 9.2 布局实现标准
*   **容器**: 必须使用 `flex items-center`。
*   **间距 (Gap)**: 导航项推荐使用 `gap-3`，操作按钮推荐使用 `gap-2` 或 `gap-1.5`。
*   **禁用补丁**: 严禁使用魔法数字（如 `translate-y-[1px]`）进行光学校对，除非在极端字体渲染差异下且经过视觉评审。

### 9.3 典型案例
*   **Brand (JustMemo)**: 14px 图标 + 14px 加粗文字。
*   **侧边栏导航**: 14px 图标 (size-3.5) + 14px 常规文字。
*   **下拉菜单项**: 14px 图标 (size-3.5) + 14px 菜单文字。
