# JustMemo 设计系统 (Design System)

> 最后更新：2026-04-06 (确立双容器架构下的三级嵌套对齐标准)

## 1. 视觉风格 (Visual Philosophy)
**现代圆润感 (Modern Roundness)**：从早期的“纸质书写感”转向“极简效率主义”。强调视觉的连续性、高亲和度以及在 12px/8px 嵌套系统下的几何美感。

## 2. 配色系统 (Color Palette)
使用 `next-themes` 实现自动切换，底层采用 **OKLCH** 颜色模型。

### 2.1 基础色调 (Base Tones)
| 模式 | 背景 (Background) | 前景/文字 (Foreground) | 卡片 (Card) |
| :--- | :--- | :--- | :--- |
| **浅色 (Light)** | `oklch(0.98 0.001 286.375)` | `oklch(0.141 0.005 285.823)` | `oklch(1 0 0)` |
| **深色 (Dark)** | `oklch(0.12 0.003 285.823)` | `oklch(0.985 0 0)` | `oklch(0.18 0.004 285.885)` |

### 2.2 强调色 (Accents)
*   主强调 (Primary): `#d97757` (赤陶色)
*   次强调 (Secondary): `#3f6212` (深橄榄色)
*   状态色: 软化后的成功色 `#40c463` / 错误色 `#ff6b6b`

## 3. 排版系统 (Typography)
*   **默认正文 (Sans)**: **`Inter`, system-ui, sans-serif** —— **全局唯一默认字体**。
*   **标题 (Headings)**: 同样使用无衬线体，移除所有衬线体 (Serif) 覆盖，确保现代感。
*   **技术数据 (Mono)**: 'ui-monospace', 'SFMono-Regular', monospace —— 仅保留在统计数字、标签、代码块等需要对齐的场景。

## 4. 形状与边限 (Shapes & Borders)
这是视觉现代化的核心逻辑。

### 4.1 核心圆角体系 (Corner Radius System)
为了彻底消除实现偏差，建立极具工业美感的比例尺，采用标准的 **Tailwind 语义映射**：

| 阶层 (Level) | 物理尺寸 | Tailwind 类名 | 应用场景 (Usage) |
| :--- | :--- | :--- | :--- |
| **一级容器** | **12px** (0.75rem) | `rounded-card` | `MemoCard` (首页卡片)、侧边栏、对话框底座 |
| **二级容器** | **8px** (0.5rem) | `rounded-inner` | 编辑器嵌套、下拉菜单背景 (Popovers) |
| **原子组件** | **6px** (0.375rem) | **`rounded-md`** | **全局默认**：按钮、输入框、搜索框、菜单项、徽章 |
| **极细元素** | **2px/4px** | `rounded-sm/null` | 仅用于地图路网等底层视觉元素 |

### 4.2 比例与一致性 (Ratio & Consistency)
*   **规范优先**：全站交互元素必须使用 `rounded-md` (6px)，不再允许混合 `rounded-sm`。

## 5. 交互反馈与阴影规范 (Interactions & Elevation)

这是项目中定义“海拔高度”的核心。为了保持视觉的平面高级感，我们严格限制 3D 偏移。

### 5.1 阴影分级体系 (Shadow Elevations)

| Level 0 (Flat) | `shadow-none` | 无阴影 | **导航项** (Logo, Header按钮)、侧边栏项、基础标签 |
| Level 1 (Subtle) | `shadow-sm` | 极细阴影 (1px) | 小尺寸独立功能按钮（如：卡片内解锁/删除） |
| Level 2 (Raised) | `shadow-md` | 明显海拔 (4px) | **标准反馈**：内容卡片悬停、主操作按钮悬停 |
| Level 3 (Pop) | `shadow-xl` | 浮空海拔 (20px) | 弹出菜单、对话框、Tooltip 背景 |

### 5.2 颜色与基调
*   **中性化原则**：所有阴影使用中性灰色。严禁手动硬编码 `shadow-gray-400/20` 等非系统级阴影颜色。
*   **Header 全局一致性**：Header 内的 Logo、下拉按钮、搜索框等导航类组件，悬停时统一使用 `hover:bg-accent`且不带阴影 (Level 0)，确保海拔高度的一致性。
*   **编辑态扁平化**：为保持专注与视觉的一致性，编辑器 (MemoEditor) 及其所在的容器在聚焦或编辑模式下不使用阴影高度。采用 `ring-2` 或 `border-primary` 等边框反馈替代海拔上升。

### 5.3 毛玻璃与通透度规范 (Glassmorphism)
为了营造现代、通透且具有层级感的 UI，全站悬浮元素统一遵循以下规范。

| 参数项目 | 规范值 | 说明 |
| :--- | :--- | :--- |
| **不透明度 (Opacity)** | **88%** | 平衡背景穿透感与文字易读性的“甜点位” |
| **模糊度 (Blur)** | **24px (`backdrop-blur-xl`)** | 营造奶油般化开的厚重玻璃质感 |
| **边缘强化** | `border-border/40` | 细微的边缘高亮，增强海拔感 |
| **背景变量** | `--glass-bg` | 映射至 `bg-background/88` 或 `bg-card/85` |

**适用范围**：
*   所有弹出对话框 (Dialog, Alert Dialog)
*   所有下拉菜单与选择器 (Dropdown, Select)
*   所有浮动提示与命令面板 (Command, Tooltip)
*   地图交互气泡 (Map Popups)

### 5.4 动画参数 (Motion Specs)
详见核心动效定义：
*   **坚实稳定 (Stable)**: `Stiffness: 350`, `Damping: 40` —— 用于高度/尺寸变化。
*   **响应敏捷 (Snappy)**: `Stiffness: 500`, `Damping: 30` —— 用于模态框、侧边栏弹出。

## 6. 图标与文本对齐规范 (Icon & Text Alignment)

### 6.1 等高匹配原则
*   **核心逻辑**: 图标高度必须与文本高度完全一致。
*   **标准尺寸**: 14px (text-sm) 文字配 14px 图标 (`size-3.5`)。
*   **图标库**: 全面选用 **Hugeicons** (`@hugeicons/react`)，风格倾向于 Soft 或 Rounded 系列。
*   **亚像素清晰度**: 针对 `14px` 等小尺寸图标（如邮件复制按钮），采用 `Two-Tone` 或特定的亚像素对齐逻辑，避免渲染模糊。

> 详细的编辑器动画策略与实现细节，请参阅: [交互与动画手册](./interactions.md)

## 7. 地图组件视觉规范 (Map Component Visuals)

### 7.1 底图服务
*   **瓦片提供商**: [CartoDB Basemaps](https://github.com/CartoDB/basemap-styles)
*   **主题方案**: Positron (Light) / Dark Matter (Dark) / Voyager (Color)

## 8. 对齐工程学与滚动规范 (Alignment & Scrollbar Specs)

### 8.1 核心对齐矛盾：滚动条占位 (Gutter)
在独立滚动容器（如固定头部与滚动内容区）共存的场景下，滚动条的出现与消失会挤压内容宽度（通常为 6px），导致使用 `mx-auto` 居中的内容产生视觉晃动 (Jank)。

### 8.2 三级嵌套对齐模型 (Triple-Nesting Model)
全站所有涉及水平对齐的容器必须严格遵守以下嵌套结构，禁止将 Padding 提升至 Constraint 层级之上。

| 层级 (Level) | 职责 | 关键类名与规则 |
| :--- | :--- | :--- |
| **1. Container** | 占位与滚动环境 | `w-full overflow-y-auto scrollbar-stable` |
| **2. Constraint** | 宽度约束与居中 | `max-w-screen-md mx-auto` |
| **3. Padding** | 内缩缓冲 (安全区) | **`px-4 sm:px-6`** |

> **核心法则**：Padding 必须位于 Constraint 的**内部**。这样当滚动条 Gutter 渲染时，它只会挤压 Container 到 Constraint 之间的空隙，而不会触碰受 Padding 保护的内容主体，从而保证上下容器内容绝对对齐。

### 8.3 滚动条策略 (Scrollbar Policy)
1. **强制预留 (Stable Gutter)**: 除非是侧边栏等特殊区域，否则所有主容器必须声明 `scrollbar-stable`。
2. **禁止静默取消**: 严禁在同一元素上混用 `scrollbar-hide` 和 `scrollbar-stable`，因为 `scrollbar-width: none` 会导致 Gutter 空间瞬间清零。
3. **视觉隐藏方案**: 若需隐藏滚动条但保留对齐 Gutter，需使用 `::-webkit-scrollbar { display: none }` 的非侵入式方案。

---

## 9. 响应式适配规范 (Responsive Breakpoints)
*   **Mobile (<640px)**: 侧边栏自动收缩，内边距降至 `px-4`。
*   **Tablet/Desktop (>640px)**: 侧边栏保持常驻或悬浮，内边距升至 `px-6`。
*   **Max Width**: 核心内容区上限固定为 `screen-md` (768px)，以保证沉浸式阅读体验。
