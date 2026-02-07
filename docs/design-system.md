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

## 4. 交互反馈与动效
*   **通知**: 使用 **顶部弹窗 (Toast/Popup)** 提醒。
*   **动效**: 基于 **Framer Motion** 实现瀑布流卡片的平滑加载与渐显。
