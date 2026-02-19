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

## 4. 代码参考

```typescript
// transition configuration in MemoEditor.tsx
transition={{
    height: isActuallyCollapsed ? spring.default : { duration: duration.default, ease: ease.out },
    minHeight: isActuallyCollapsed ? spring.default : { duration: duration.default, ease: ease.out },
    opacity: { duration: duration.fast }
}}
```
