# JustMemo 设计系统 (Design System)

> 最后更新：2026-02-22 (重构：全面转向现代化圆润视觉风格)

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
*   **默认正文 (Sans)**: **`Inter`, system-ui, sans-serif** —— 全局默认，提升现代感。
*   **标题 (Serif)**: 可选模式下使用 'Times New Roman', 'Georgia', serif。
*   **代码 (Mono)**: 'ui-monospace', 'SFMono-Regular', monospace。

## 4. 形状与边限 (Shapes & Borders)
这是视觉现代化的核心逻辑。

### 4.1 核心圆角体系 (Corner Radius System)
为了彻底消除实现偏差，建立可预测的样式尺度，我们采用标准的 **Tailwind 语义映射** 方案来实现 **12 - 8 - 4 - 2** 的阶梯：

| 阶层 (Level) | 物理尺寸 | Tailwind 类名 | 应用场景 (Usage) |
| :--- | :--- | :--- | :--- |
| **一级容器** | **12px** (0.75rem) | `rounded-card` | `MemoCard` (首页卡片)、侧边栏容器 |
| **二级容器** | **8px** (0.5rem) | `rounded-inner` | 编辑器嵌套、对话框、下拉菜单背景 |
| **原子组件** | **4px** (0.25rem) | **`rounded`** | 按钮、输入框、菜单悬停高亮、导航项背景 |
| **极微元素** | **2px** (0.125rem) | **`rounded-sm`** | 标签 (`Badge`)、极小图标容器 |

### 4.2 比例与一致性 (Ratio & Consistency)
*   **语义优先**：开发者应优先使用 `rounded` (4px) 处理交互元素，仅在大尺寸卡片封装时使用自定义的 `rounded-card`。
*   **留白基准**: 主体留白保持在 **24px** (`p-6`)，确保与 12px 外圆角形成稳健的学术骨架感。

## 5. 交互反馈与动效 (Interactions & Motion)

### 5.1 阴影与海拔 (Elevation)
*   **Level 1 (Card)**: `shadow-md` (扩散范围比旧版更广，模拟自然环境光)。
*   **Level 2 (Active)**: `shadow-xl`。
*   **玻璃态**: 所有浮层统一使用 `backdrop-blur-xl bg-popover/80`。

### 5.4 动画参数 (Motion Specs)
详见核心动效定义：
*   **坚实稳定 (Stable)**: `Stiffness: 350`, `Damping: 40` —— 用于高度/尺寸变化。
*   **响应敏捷 (Snappy)**: `Stiffness: 500`, `Damping: 30` —— 用于模态框、侧边栏弹出。

## 6. 图标与文本对齐规范 (Icon & Text Alignment)

### 6.1 等高匹配原则
*   **核心逻辑**: 图标高度必须与文本高度完全一致。
*   **标准尺寸**: 14px (text-sm) 文字配 14px 图标 (`size-3.5`)。
*   **图标库**: 全面选用 **Hugeicons** (`@hugeicons/react`)，风格倾向于 Soft 或 Rounded 系列。

> 详细的编辑器动画策略与实现细节，请参阅: [编辑器动画策略](./editor-transitions.md)
