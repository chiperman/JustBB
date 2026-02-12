# JustMemo 设计系统 (Design System)

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
*   **标准化规范**: 全站所有容器（卡片）、交互元素（按钮、输入框）、标识类元素（标签、ID、提及）以及多媒体附件（图片）统一使用 2px 微圆角。严禁出现多种圆角弧度并存的情况，确保视觉上的绝对一致性与几何严整感。所有高亮背景类元素（如选中的导航项、标签云、记录中的提及）统一遵循此规则。

## 5. 交互反馈与动效
*   **统一悬停背景 (Unified Hover Background)**: 全站所有非语义化（非删除/危险操作）的交互元素在悬停时，统一使用 `rgba(0,0,0,0.05)` (Tailwind `bg-accent`) 作为背景色，且保持文字/图标颜色稳定，不产生额外跳动。
*   **通知系统**: 采用全局 **Toast 通知** 展示操作反馈（成功/警告/错误），取代原生 `alert`。
*   **对话框**: 所有 `confirm` 与 `prompt` 逻辑均替换为定制化的 **AlertDialog** 与 **PromptDialog**，支持毛玻璃背景 (`backdrop-blur`)。
*   **动效**: 基于 **Framer Motion** 实现瀑布流卡片的平滑加载与渐显，移除冗余布局抖动。

## 6. 组件规范 (Component Standards)

### 6.1 下拉菜单 (Dropdowns & Selects)
*   **统一质感**: 所有浮层菜单（DropdownMenu, SelectContent）必须保持一致的 "Premium" 质感。
    *   **圆角 (Radius)**: `rounded-sm` (2px)。
    *   **背景 (Background)**: `bg-popover/90` 配合 `backdrop-blur-md` (毛玻璃效果)。
    *   **阴影 (Shadow)**: `shadow-2xl` (深邃阴影)。
    *   **边框 (Border)**: `border-border/40` (柔和边框)。
*   **极简触发器 (Minimalist Trigger)**: 对于上下文明确的选择器（如年份切换），推荐使用 `variant="ghost"` 的无边框文本样式，通过排版（大字号/加粗）来体现层级，而非传统的输入框样式。
## 7. 时间线规范 (Timeline System)

### 7.1 结构定义
*   **Timeline**: 容器，设置左边距 `ml-[11px]` 及填充 `pl-6`，为轴线预留空间。
*   **TimelineLine**: 垂直轴线，宽 `2px`。默认颜色 `bg-border/30`，激活状态为 `bg-primary`。具备 `300ms` 颜色过渡动效。
*   **TimelineDot**: 节点圆点。宽/高 `12px`，带 `2px` 边框，背景色同页面背景，具备 `ring-4` 悬停/激活光效。
*   **TimelineHeading**: 时间标题。使用 **Mono 字体**，`text-base` 字号，加粗。

### 7.2 高度对齐
*   所有节点与轴线必须像素级对齐，确保垂直感官连贯。
*   文字内容与圆点中心在水平线上对齐。

## 8. 正文节点规范 (Content Nodes)

### 8.1 提及 (@Mention) & 引用
*   **样式**: `font-mono`, `bg-primary/10`, `text-primary`, `px-1`, `rounded-sm` (2px)。
*   **交互**: Hover 时 `bg-primary/20`，支持 Popover 预览。

### 8.2 标签 (#Hashtag)
*   **样式**: `font-mono`, `font-medium`, `text-[#5783f7]` (标准外链蓝), `mx-0.5`。
*   **交互**: Hover 下划线反馈，点击进入标签过滤。

### 8.3 代码块 (Code Blocks)
*   **样式**: `bg-muted/50` 柔和背景，`border-border/40` 微边框。
*   **字体**: `font-mono`, `text-sm`。
