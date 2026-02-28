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
- **交互优化**: 
    - 聚合点点击：采用最佳包含算法 (flyToBounds) 精确缩放。
    - 状态指示：底部增加实时缩放层级指示器（带自动隐藏逻辑）。

### 3. 🔗 链接预览 (Link Previews)
提升外链的上下文感知。
- **机制**: 由 `MemoContent` 组件渲染。检测到标准 URL 时，异步调用特定 Action 获取 OpenGraph 元数据。
- **视觉**: 展示标题、描述与 Favicon。背景采用半透明卡片设计以保持视觉轻量。

### 4. 🗄️ 多选与批量操作 (Batch Selection)
提高内容管理效率。
- **交互逻辑**: 长按或点击“选择”按钮进入多选模式。
- **UI 变化**: 首页标题栏瞬间切换为工具栏（置顶、删除、取消）。编辑器在多选模式下通过 CSS 强制隐藏以防止误触。
- **性能**: 采用状态追踪机制，确保多选状态切换时不触发不必要的重绘（Zero-Jank）。

### 5. 📧 邮件地址处理 (Email Handling)
增强正文中的联系方式互动性。
- **自动解析**: 实时识别正文中的邮件地址并转换为 `mailto:` 链接。
- **快捷复制**: 悬浮邮件地址时显示带有平滑动画的复制按钮。
- **视觉优化**: 采用 14px 图标确保在高分屏下的亚像素渲染清晰度。

### 6. 📊 Supabase 用量监控 (Usage Monitoring)
提供项目配额透明度。
- **采集**: 通过 Management API 抓取全量指标（DB, Storage, MAU, Egress），支持 SQL 基础回退。
- **展示**: 实时变色进度条 + 模态框仪表盘。
- **位置**: 管理员设置页面。
- **详情**: 参见 [usage-monitoring.md](./usage-monitoring.md)。

### 7. 📅 时间轴与单日翻页 (Calendar Pager)
重塑了 JustBB 核心的 Timeline 导航体验，用极其简洁克制的“单页闭环”代替了易产生物理抖动的“混合上下文向上滚动”。
- **三种独立浏览模式**:
    1. **热力图模式 (Heatmap Hard Filter)**: 点击热力图单元格，触发 URL Date 参数变化（如 `/?date=2024-05-18`）。这是一种“强制过滤”，页面变为该日的专属归档视图，没有上下翻页器。
    2. **时间轴模式 (Timeline Soft Teleport)**: 在普通首页往下无限翻时，点击右侧时间轴的某一天。页面 **URL 不变**，执行原地时空跳跃。
        - 列表瞬间清屏，仅展示被点击日期当天的全部日记。
        - **Calendar Pager 导航器**: 在列表的顶部和底部分别生成优雅的 `[View Newer]` / `[View Older]` 翻页按钮。
    3. **标准瀑布流模式 (Infinite Scroll)**: 在没有任何日期参数、也不处于单日翻页上下文时，首页默认行为为极其顺滑的单向（向下）无限瀑布流加载。
- **并发探针技术 (Cursor Probing)**: 
    - 支撑“单日翻页模式”的核心 API 是 `getSingleDayMemosWithNeighbors`。
    - 当用户传送到某一天时，后端并发执行 3 组查询：抓取当日数据、利用 `limit(1)` 叠加 `lt` 过滤出过去最近的一天（作为 View Older 游标）、利用 `gt` 过滤出未来最近的一天（作为 View Newer 游标）。
- **零抖动体验 (Zero-Jank Strategy)**:
    - 废弃了所有基于 IntersectionObserver 触发向上抓取未来数据、以及 `useLayoutEffect` 尝试锚定滚动条物理位置的技术债。
    - 每一次 Teleport 或 Pager 交互，都转化为彻底的清屏与单日重绘，极大提升了渲染的确定性与手感。

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
