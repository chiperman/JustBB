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

### 5.1 核心哲学 (Motion Philosophy)
*   **12 动画原则 (12 Principles of Animation)**: 全站动效需遵循迪士尼 12 动画原则（Web 适配版），重点包括：
    - **Timing (时间感)**: 用户触发的动画应在 300ms-500ms 内完成，平衡响应性与优雅感。
    - **Physics (物理特性)**: 使用 Spring (弹簧) 物理特性描述运动，赋予 UI 重量感与回弹感。
    - **Active States (点击反馈)**: 所有交互元素必须具备 `whileTap` 点击缩放反馈（推荐 `scale: 0.98`）。
    - **Follow Through (跟随动作)**: 复杂切换时，次要元素（如背景装饰）应配合主元素产生位移滞后。
*   **重于快 (Weight over Speed)**: 物体应当感觉有质量。使用较低的刚度 (Stiffness) 和较高的阻尼 (Damping)。
*   **编排感 (Orchestration)**: 元素按顺序流动 (Stagger)，引导用户的视线。
*   **触觉反馈 (Tactile Feedback)**: 交互 (Hover) 响应灵敏但扎实。
*   **氛围感 (Atmosphere)**: 背景缓慢呼吸，让空间感觉充满生机。

### 5.2 物理参数 (Physics Constants)
几乎所有的运动都使用 **Spring (弹簧)** 物理模型 (基于 Framer Motion)。

| 参数 (Parameter) | 值 | 感觉 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Snappy Spring** | `{ stiffness: 260, damping: 26 }` | 干脆、自然 | 首页卡片转换、页面核心切换。 |
| **Gentle Spring** | `{ stiffness: 200, damping: 24 }` | 柔和、延迟 | 侧滑面板、低优先级的位移。 |
| **Soft Spring** | `{ stiffness: 100, damping: 25 }` | 沉重、放松 | 主布局元素，大卡片入场。 |
| **UI Feedback** | `{ stiffness: 300, damping: 30 }` | 灵敏、反馈 | 按钮点击缩放、警告框、模态窗。 |

### 5.3 关键切换标准 (Critical Transition Standards)
为保证设计一致性，以下切换逻辑为系统核心基石，**未经深思熟虑严禁随意更改**：
*   **登录切换 (Login Transition)**:
    - 阶段一：首页全屏 $\rightarrow$ 中央卡片（Spring: Snappy）。
    - 阶段二：首页卡片向右侧偏移（Spring: Gentle） + 背景模糊。
    - 阶段三：登录面板从左侧滑入 + 元素 Stagger (50ms 延迟)。
    - **逆向过程**: 点击首页预览区域必须执行上述过程的严格对称逆转，带自然回弹。
*   **内容列表 (Memo List)**:
    - **入场编排**: 采用视口触发方案 (`whileInView`)，避免长列表累计延迟导致的空白。
    - **预加载感**: 使用 `viewport: { margin: '200px' }`。确保元素在进入屏幕前已提前开始弹性入场，实现“无感”生长。
    - **单项反馈**: 位移 (y:20) + 渐变 + 缩放 (Spring: Snappy)。
    - **流动性 (Flow)**: 强制使用 `layout` 属性配合稳定的 `memo.id` Key。当 SSR 数据与后台全量数据同步时，新旧元素应平滑位移衔接，严禁产生瞬间重置或闪烁。
*   **组件内部状态 (Internal State Transitions)**:
    - **高度稳定性**: 对于展开/收起 (Disclosure) 类组件，应使用 `AnimatePresence` 配合 `height: 0/auto`，而非 `layout`，以确保在动态加载内容时避免与外部布局容器产生弹性动效冲突。
    - **内容切换编排**: 内部状态切换（如从 Loading 到数据列表）应使用 `mode="wait"` 的 `AnimatePresence`，赋予 `opacity` 和微量位移 (y: 5) 过渡，消除闪现感。

### 5.3 交互细节
*   **统一悬停背景 (Unified Hover Background)**: 全站所有非语义化交互元素在悬停时，统一使用 `rgba(0,0,0,0.05)` (Tailwind `bg-accent`)，文字/图标颜色保持稳定。
*   **通知系统**: 采用全局 **Toast 通知** 展示操作反馈，取代原生 `alert`。
*   **对话框**: 替换为定制化的 **AlertDialog**，支持毛玻璃背景 (`backdrop-blur`)。
*   **动效**: 基于 **Framer Motion** 实现列表/卡片的错落 (Stagger) 入场，移除布局抖动。

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

## 9. 工程规范 (Engineering Standards)

### 9.1 Git 规范
*   **原子化提交 (Atomic Commits)**: 每个 Commit 只做一件事（即：一个 Commit 解决一个微型任务）。
*   **Commit 规范 (Commitizen)**: 强制采用 `type(scope): subject` 格式。主题与正文使用 **中文**。
*   **Git Hooks**: 使用 Husky + lint-staged 在提交前自动执行代码格式化（Prettier/ESLint）与规范检查。

### 9.2 客户端缓存 (MemoCache)
*   **策略**: 离线优先 (Offline-First)。使用 `localStorage` 持久化，通过 SSR 首屏直出与后台异步校验同步数据，平衡加载速度与数据新鲜度。
