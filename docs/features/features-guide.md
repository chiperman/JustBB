# JustMemo 功能模块指南 (Features Guide)

> 最后更新：2026-02-24

本文档整合了项目核心业务模块的设计细节与技术实现，为跨模块协作提供统一参考。

---

## 🏗️ 核心业务模块 (Core Modules)

### 1. 🖼️ 画廊 · 浸式相册 (Gallery)
将画廊重构为纯图片沉浸式瀑布流体验。
- **数据策略**: 复用全局 `memoCache`。通过前端正则 `/!\[.*?\]\((.*?)\)/g` 实时过滤含图片的记录，实现 SPA 切换下的秒开体验。
- **多图交互**: 卡片显示首图封面 + 数量指示器。全屏 Lightbox 支持左右切换。
- **溯源能力**: 大图视图中提供“溯源”按钮，点击后弹出 Dialog 完整复用首页 `MemoCard` 展示原始上下文。

### 2. 📍 定位与地图 (Maps)
为 Memo 提供地理空间标记能力。
- **技术栈**: Leaflet + CartoDB (底图跟随应用主题自动切换 Voyager/Dark Matter)。
- **存储格式**: 内联语法 `📍[地名](lat,lng)`，结合数据库 `locations` JSONB 字段。
- **三种视图**: 
    - 编辑器：地图选点对话框。
    - 信息流：悬浮地图小窗口预览 (HoverCard)。
    - 全页视图：展示所有标记点，支持点击后弹出原 Memo 预览。

### 3. 🔗 链接预览 (Link Previews)
提升外链的上下文感知。
- **机制**: 由 `MemoContent` 组件渲染。检测到标准 URL 时，异步调用特定 Action 获取 OpenGraph 元数据。
- **视觉**: 展示标题、描述与 Favicon。背景采用半透明卡片设计以保持视觉轻量。

### 4. 🗄️ 多选与批量操作 (Batch Selection)
提高内容管理效率。
- **交互逻辑**: 长按或点击“选择”按钮进入多选模式。
- **UI 变化**: 首页标题栏瞬间切换为工具栏（置顶、删除、取消）。编辑器在多选模式下通过 CSS 强制隐藏以防止误触。
- **性能**: 采用状态追踪机制，确保多选状态切换时不触发不必要的重绘（Zero-Jank）。

---

## 🛠️ 公共逻辑规范

### 内容解析 (Content Parsing)
统一由 `src/lib/contentParser.ts` 负责：
- 优先级：Code Block (```) > Location (📍) > Image > Mention (@) > Tag (#) > Link。
- 解析后的 Tokens 供 `MemoContent` 按分支渲染。

### 缓存预热 (Cache Warming)
访问任意子页面（画廊、地图）都会优先检查 `memoCache`：
- 若缓存为空，子页面会主动触发 `getMemoIndex()`。
- 该机制利用一次拉取为后续所有的 SPA 导航提供加速。
