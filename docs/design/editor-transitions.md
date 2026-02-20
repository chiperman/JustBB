# 编辑器动画策略 (Editor Animation Strategy)

> ⚠️ **重要**：本文件记录了 `MemoEditor` 及其相关组件（如 `FeedHeader`）的动画实现细节。
> 在修改相关代码前，请务必阅读本文，以防止再次引入“抖动”、“果冻效应”或“布局偏移”。

## 1. 核心原则：全局同步 (Global Synchronization)

为了解决编辑器展开时的整体抖动和内容不协调问题，我们采用了 **全局同步** 策略。即编辑器内外所有层级（容器、内容区、工具栏）必须使用 **完全一致** 的动画参数。

### 1.1 关键参数

我们采用 **非对称** 动画策略：

*   **展开 (Expand)**: 使用 `ease.out` (Quintic)。
    *   **原因**: 从 `height: 0` 到 `height: auto` 的计算对浏览器来说是昂贵的。使用确定性的 `ease` 曲线比物理模拟 (`spring`) 更稳定，能有效避免展开初期的计算抖动。
    *   **配置**: `duration: duration.default, ease: ease.out`
*   **收缩 (Collapse)**: 使用 `spring.default`。
    *   **原因**: 收缩时起始高度已知，物理回弹能提供极佳的交互手感（“啪”地合上）。
    *   **配置**: `stiffness: 350, damping: 40`

### 1.2 禁用 Layout 属性

*   🚫 **禁止** 在 `MemoEditor` 的 `motion.section` 上使用 `layout` 属性。
*   **原因**: `layout` 属性会尝试在尺寸变化时平滑子元素的布局，但在高度从 0 剧烈变化时，会导致文字和容器的“果冻效应”（拉伸变形）。显式的高度动画 (`height`/`minHeight`) 已经足够。

---

## 2. 模式切换策略 (Mode Switching)

针对多选模式 (`Selection Mode`) 的进入与退出，我们采取了特定的策略以确保 **绝对稳定**。

### 2.1 FeedHeader：瞬间切换 (Instant Switch)

*   **策略**: 多选工具栏与默认头部之间 **不使用任何过渡动画**。
*   **实现**: 基于状态 (`isSelectionMode`) 的简单条件渲染或三元运算符切换。
*   **原因**: 用户需要极速的响应。任何淡入淡出都会被视为拖沓。

### 2.2 MemoEditor：CSS 显隐 (CSS Toggle)

*   **问题**: 如果使用条件渲染 (`{isAdmin && !isSelectionMode && <MemoEditor />}`)，取消多选时编辑器会 **重新挂载 (Re-mount)**。这会强制触发 `initial={{ height: 0 }}` $\rightarrow$ `animate` 的展开动画，导致页面内容的瞬间重排和抖动。
*   **策略**: **始终渲染** 编辑器，通过 CSS 类控制可见性。
*   **实现**:
    ```tsx
    // MainLayoutClient.tsx
    <MemoEditor
        className={isSelectionMode ? "hidden" : ""}
        // ...
    />
    ```
*   **效果**: 取消多选时，编辑器 `display: block` 瞬间出现，保留了之前的布局和输入状态，**零抖动**。

---

## 3. 防退化检查清单 (Regression Testing)

在修改编辑器或头部代码后，请按以下步骤验证：

1.  [ ] **展开测试**: 点击编辑器，确认整体平稳滑出，无晃动。
2.  [ ] **收缩测试**: 点击取消，确认有物理回弹感。
3.  [ ] **多选切换**:
    *   进入多选：头部瞬间变身，编辑器瞬间消失（不留白，不占位）。
    *   **退出多选（关键）**: 头部瞬间复原，编辑器 **瞬间** 出现，且内容 **绝对静止**，无任何位置跳动或重排。

---

## 4. 全屏编辑交互 (Fullscreen Editor Interaction)

全屏模式不仅是尺寸的放大，还涉及复杂的焦点管理和内容同步逻辑。

### 4.1 焦点管理与选区保护 (Focus & Selection)

为了平衡“易用性”与“精准性”，我们实现了复合点击逻辑：

*   **全域背景聚焦**: 点击全屏容器的非正文区域（边缘空白）时，通过 `editor.commands.focus('end')` 强制聚焦，确保用户无需寻找光标。
*   **选区保护**: 为了防止由于释放鼠标导致的误触发，增加了选区检测。
    ```tsx
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return; // 保护已有选区
    ```
*   **视觉选区锁定**: 统一使用 `selection:bg-primary/30`，禁止使用带透明背景的模糊效果，以确保在任何背景下选中状态均清晰可见。

### 4.3 灵敏展开捕捉 (Expansion Trigger)

在收缩状态（Collapsed）下，为了确保 100% 的触发展开成功率，我们引入了“捕捉层”技术：

*   **实现**: 在收缩状态下，在编辑器表面覆盖一个绝对定位的 `.editor-full-height-trigger` 透明层。
*   **逻辑**: 任何落在捕捉层上的点击都会直接触发 `editor.commands.focus('end')`。
*   **优势**: 解决了 Tiptap 在极小尺寸下事件捕获不灵敏的问题。

### 4.4 页脚焦点锁定 (Footer Focus Lock)

为了防止点击底部功能按钮（私密、置顶、全屏）时触发编辑器的失焦（Blur）并导致非预期收缩：

*   **实现**: 为底部的 `motion.div` 容器添加 `onMouseDown={(e) => e.preventDefault()}`。
*   **效果**: 在鼠标按下瞬间阻断焦点转移，使编辑器始终维持 `isFocused` 状态，确保按钮功能正常触发且不伴随跳动的收缩动画。

### 4.2 结构化同步 (Structured Synchronization)

为了彻底解决全屏模式切换导致的换行丢失问题，同步逻辑从 **Text 模式** 升级为 **JSON 模式**。

*   **存储引擎**: `localStorage` 中存储的不再是 `editor.getText()`，而是 `editor.getJSON()`。
*   **兼容性回退**: 同步逻辑会自动检测字符串是否为 JSON，若解析失败则回退至 Plain Text 模式，确保数据迁移顺滑。
*   **双向同步**: 首页编辑器订阅 `isFullscreen` 状态，当全屏关闭时，自动从 `localStorage` 重载最新的结构化 JSON 内容。

## 5. 组件规范清单 (Component Standards)

*   [x] **背景实色化**: 弹窗（@/#）必须使用 `bg-background`（100% 实色），禁止使用 `bg-popover`（带 5% 透明），以防止在全屏背景下产生视觉干扰。
*   [x] **高度穿透**: 全屏模式下 `max-height` 设为 `none`，`height` 设为 `100%`。
*   [x] **选区对比度**: 选区背景不透明度统一为 `30%`。

---

## 6. 代码参考

```typescript
// Content Reload Logic in MemoEditor.tsx
if (!hideFullscreen && !isFullscreen && mode === 'create' && editor) {
    const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY);
    // ... JSON parse & editor.commands.setContent(json)
}
```
