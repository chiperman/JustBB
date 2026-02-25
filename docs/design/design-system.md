# JustMemo 设计系统 (Design System)

> 最后更新：2026-02-24 (新增滚动容器对齐规范)

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

> 详细的编辑器动画策略与实现细节，请参阅: [交互与动画手册](./interactions.md)

## 7. 地图组件视觉规范 (Map Component Visuals)

### 7.1 底图服务
*   **瓦片提供商**: [CartoDB Basemaps](https://github.com/CartoDB/basemap-styles)，零成本、无 API Key。
*   **可选主题**:
    | 主题 | CartoDB 变体 | 视觉风格 |
    |:---|:---|:---|
    | **浅色 (Light)** | Positron | 极简灰白底，适合日间使用 |
    | **深色 (Dark)** | Dark Matter | 深黑底配亮色路网，适合暗色模式 |
    | **彩色 (Voyager)** | Voyager | 柔和彩色，带微妙地形渲染 |
*   **标签控制**: 每个主题均支持 `_all`（含地名标注）与 `_nolabels`（纯底图）两种变体。

### 7.2 标记点 (Marker)
*   **样式**: 圆形 24×24px，主强调色填充（`var(--color-primary, #d97757)`），2px 白色边框。
*   **内部点**: 8×8px 白色圆点，居中显示。
*   **阴影**: `box-shadow: 0 2px 8px rgba(0,0,0,0.3)`。
*   **交互**: 可拖拽（编辑模式下），拖拽结束触发坐标更新。

### 7.3 悬浮预览 (Hover Preview)
*   **容器**: `rounded-2xl`，`backdrop-blur-md`，`shadow-2xl`。
*   **尺寸**: 220×150px（内嵌 MapView mini 模式）。
*   **默认风格**: `mapTheme='light'`, `showLabels=false`。

### 7.4 设置面板 (Settings Popover)
*   **触发器**: 齿轮图标（`Settings03Icon`），绝对定位于地图右上角。
*   **面板宽度**: `w-56`（224px）。
*   **开关样式**: 自定义 Toggle（`w-8 h-4` 圆角胶囊），激活态使用 `bg-primary`。

> 详细的地图功能设计，请参阅: [功能模块指南](../features/features-guide.md)

## 8. 滚动容器对齐规范 (Scroll Container Alignment)

> 最后更新：2026-02-24

### 8.1 问题背景

当页面中存在多个垂直排列的独立 `overflow-y` 容器时（如固定顶部区域 + 可滚动内容区域），若两个容器对滚动条空间的处理方式不一致，会导致内部 `max-w-*` + `mx-auto` 居中内容出现水平偏移，视觉上表现为"下方内容向左移动，与上方卡片不对齐"。

### 8.2 根本原因：`scrollbar-width: none` 会取消 `scrollbar-gutter`

CSS 的 `scrollbar-gutter: stable` 会为滚动条**始终预留一段固定宽度的空白区域**（即 gutter），使得滚动条出现/消失时内容区域宽度保持不变。

但有一个关键陷阱：

> **当 `scrollbar-width: none` 被设置时，`scrollbar-gutter: stable` 将完全失效。**

Tailwind 工具类 `scrollbar-hide` 实现如下：

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;   /* ← 这一行会取消 scrollbar-gutter */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

因此，同时使用 `scrollbar-stable`（`scrollbar-gutter: stable`）和 `scrollbar-hide` 时，后者会静默覆盖前者，gutter 预留效果为 **0px**。

### 8.3 首页布局中的具体表现

首页 `MainLayoutClient` 包含两个独立容器：

| 容器 | 类名 | `scrollbar-gutter` 实际预留 |
|:---|:---|:---|
| 顶部固定区域 | `scrollbar-stable overflow-y-auto scrollbar-hide` | **0px**（被 `scrollbar-hide` 取消） |
| 底部滚动区域 | `overflow-y-auto scrollbar-stable` | **~6px**（正常预留） |

两个 `max-w-4xl mx-auto` 内容区域的可用宽度相差约 6px，`mx-auto` 居中后底部内容整体偏左约 3px。

### 8.4 修复方案

**移除顶部容器上多余的 `scrollbar-hide`**，让 `scrollbar-stable` 在两个容器上都能正常生效：

```tsx
// 修复前（错误）
"... scrollbar-stable overflow-y-auto scrollbar-hide"

// 修复后（正确）
"... scrollbar-stable overflow-y-auto"
```

顶部 header 内容在正常情况下不会触发高度溢出，因此不会出现可见的滚动条。两个容器均通过 `scrollbar-gutter: stable` 预留相同的 gutter 空间，内容宽度完全一致。

### 8.5 通用规范

在同一页面使用多个独立滚动容器，且需要相互对齐时，必须遵守以下规则：

1. **禁止混用 `scrollbar-hide` 与 `scrollbar-stable`**：`scrollbar-width: none` 会静默取消 `scrollbar-gutter: stable`。
2. **统一 gutter 策略**：所有需要对齐的容器必须使用完全相同的 gutter 方案（要么都 `stable`，要么都不预留）。
3. **隐藏滚动条使用 webkit-only 方案**：若需视觉上隐藏滚动条但保留 gutter 空间，应仅覆盖 `::-webkit-scrollbar { display: none }` 而不设置 `scrollbar-width: none`。

