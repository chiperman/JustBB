# JustMemo 业务逻辑架构 (Logic Architecture)

> 最后更新：2026-02-22 (现代化视觉风格重构)

本文档描述了 JustMemo 的核心业务逻辑，重点阐述其**SPA（单页应用）化架构**、**缓存优先策略**以及**无感导航机制**。

---

## 1. 核心架构模式 (Core Architecture)

我们采用 **"Hybrid SPA" (服务端首屏 + 客户端路由)** 模式，结合了 Next.js 的 SSR 优势与原生应用的流畅体验。

### 1.1 路由系统 (Client-Side Routing)
放弃了 Next.js 的默认路由跳转（会导致页面硬刷新），转而在客户端实现了一套轻量级路由系统：

- **ViewContext**: 全局管理 `currentView` 状态。
- **History API**: 使用 `window.history.pushState` 和 `popstate` 事件管理浏览器历史记录，保证后退/前进按钮正常工作。
- **ClientRouter**: 根据 `currentView` 动态渲染页面组件 (`MemoFeed`, `Gallery`, `TagsPage` 等)，实现**无刷新 (No-Refresh)** 的视图切换。
- **Link 劫持**: 所有内部链接（Sidebar, Tags）均拦截点击事件，调用 `ViewContext.setView` 而非触发浏览器跳转。

### 1.2 数据加载策略 (Data Loading)

JustMemo 采用 **"SSR + 客户端分页"** 的混合渲染模式，确保极致的直开速度与流畅的无限滚动体验。

1. **分页数据流**:
   - **首页/聚合页**: 采用 SSR 预取首屏数据 (前 20 条) 并注入客户端。后续数据的获取（如首页搜索、标签过滤或无限滚动）均通过 `getMemos` 接口直接调用远端分页 RPC 实现。
   - **引用与搜索 (@ Mention)**: 同样为纯远端分页模式。编辑器触发时不再依赖本地缓存，而是实时请求远端接口，支持滚动加载更多。

2. **全局缓存与同步 (`memoCache`)**:
   - **乐观更新**: 当用户发布新 Memo 后，系统通过 `memoCache.addItem` 瞬间更新本地状态。
   - **UI 响应**: 列表组件通过订阅该缓存实现无需页面刷新即可展示新内容，提升交互的即时感。

3. **"Cache-First" (缓存优先)**:
   - 首页在站内 SPA 导航切换时，会优先展示已存在于内存/Context 中的数据，彻底消灭骨架屏。

---

## 2. 布局架构 (Layout Shell)

全站采用全屏固定布局 (Fixed Layout)，各区域独立滚动：

1. **结构**:
   - **Main Layout**: `h-screen overflow-hidden`。
   - **LeftSidebar**: 独立滚动，SPA 切换时不重绘，保持滚动位置。
   - **RightSidebar**: 独立滚动，SPA 切换时不重绘，保持状态（如时间轴展开状态）。
   - **Content Area**: 包含 `MemoEditor` (固定顶部) 和 `ClientRouter` (动态内容)。

2. **组件持久化**:
   - 侧边栏 (`LeftSidebar`, `RightSidebar`) 在路由切换时**不会卸载**。这意味着用户的交互状态（如折叠的菜单、滚动位置）在整个会话期间保持不变。

---

## 3. 核心状态流 (Context Map)

| Context | 管理职责 | 关键特性 |
| :--- | :--- | :--- |
| **ViewContext** | 客户端路由核心 | 管理 `currentView`，拦截浏览器历史记录，提供 `navigate()` 方法 |
| **PageDataCache** | 页面数据缓存 | 实现“一次加载，会话级复用”，支持路径级缓存隔离 |
| **UserContext** | 用户身份与权限 | SSR 注入初始状态，确保存并鉴权 |
| **SelectionContext** | 多选模式状态 | 跨页面（如 /trash）自动激活/重置选择模式 |
| **TimelineContext** | 时间轴状态 | 独立于路由，但在不同 View 下可能有不同表现（如只在首页显示） |

---

## 4. 视觉与动画策略 (Visual & Animation)

### 4.1 去骨架屏设计 (No-Skeleton Policy)
我们认为骨架屏虽然缓解了焦虑，但仍然是一种“加载中”的状态。通过 **PageDataCache**，我们力求让用户感觉页面是**瞬间就绪**的。除了极其罕见的冷启动延迟，用户在站内跳转时不应看到任何 Loading 状态。

### 4.2 零抖动挂载 (Zero-Jank Mounting)
- **MemoEditor**: 设置 `initial={false}`。在页面刷新或路由切换回来时，编辑器直接以最终状态（展开/折叠）渲染，**不播放**从 `height: 0` 开始的入场动画，防止视觉跳变。
- **MemoFeed**: 同样采用 `initial={false}`，保留列表项的布局动画（如删除/新增），但跳过列表整体的入场动画。

### 4.3 组件级重置模式 (Component Reset Pattern)
为了处理 `framer-motion` 物理状态（如 `useSpring`）的残留问题，我们在 `ImageZoom` 等复杂交互组件中推广了 **Key-based Reset** 模式：
- 将复杂状态封装在独立子组件。
- 父组件通过动态 `key` 强制触发子组件的完整卸载与重新挂载。
- 确保每次交互开始时，UI 的物理状态均处于基准线（居中、原位）。

### 4.4 编辑模式即时切换 (Instant Edit Mode)
移除了 `MemoCard` 切换编辑模式时的 `layoutId` 和 `AnimatePresence`，取消形变过渡以提升交互速度。编辑模式的进入/退出采用瞬间切换，不播放任何过渡动画。

---

## 5. 关键组件逻辑

### 5.1 MemoEditor
- **高度管理**: 基于内容行数自动伸缩，通过 `isAnimating` 锁住 `overflow` 防止动画中的文字裁剪。
- **滚动阈值**: 页面向下滚动 >100px 时自动收缩为迷你模式，减少对阅读的干扰。

### 5.2 Timeline (RightSidebar)
- **路由感知**: 监听 `ViewContext`。仅在 `currentView === '/'` 时显示，从其他页面切回时状态（展开年份）保持不变。
- **滚动联动**: 点击年份/月份自动滚动 Timeline 到视口中心。

### 5.3 ImageZoom
- **架构**: 采用父子分离架构（`ImageZoom` / `PreviewContent`）。
- **生命周期**: 使用 `openCount` 作为 `key` 管理预览生命周期，实现物理偏移量的原子级清零。
- **0ms 响应**: 移除 `layoutId` 共享布局过渡，点击缩略图瞬间挂载大图。

---

### 5.4 提及与引用 (Mentions)
在 `MemoEditor` 中输入 `@` 触发的引用逻辑已经过重构，从**全量索引匹配**转向**纯远端分页**模式：

1. **零冷启动延迟**: 移除了首屏下载数千条 Memo 索引的逻辑。
2. **流式增量加载**: 
   - 触发时并行发起 `offset=0` 的请求获取最新 20 条。
   - 列表底部的滚动事件触发后续页码的异步补全。
3. **编号精确匹配补丁**: 针对数字查询（如 `@66`），后端 Action 会强制执行一次全表编号匹配并置顶结果，弥补全文索引对低频数字权重计算的不足。
4. **统一展示方案**: 列表始终展示正文预览片段（Snippet）并高亮关键词，代替了原本单一的编号展示。

---

## 6. 图标工程 (Icon Engineering)
- **Hugeicons 统一化**: 全站放弃 `lucide-react`，迁移至 `Hugeicons` (@hugeicons/react)。
- **包装器组件**: 使用核心 `HugeiconsIcon` 组件对所有图标进行二次包装。这解决了：
    1. **垂直对齐**: 修复了不同图标间微小的重心差异。
    2. **属性继承**: 统一处理 `aria-hidden`、尺寸控制与颜色样式。
    3. **性能**: 通过命名导入减少了无用代码打包。

