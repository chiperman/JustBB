# JustMemo 交互与动画手册 (Interactions & Motion)

> 最后更新：2026-02-24

本文档定义了 JustMemo 的核心交互逻辑与动画规范，旨在确保全站操作的流畅性、一致性与响应感。

---

## 1. 编辑器转场策略 (Editor Transitions)

为了解决编辑器展开时的抖动，我们采用 **非对称动画** 与 **全局同步** 策略。

### 1.1 动画参数
*   **展开 (Expand)**: 使用 `ease.out` (Quintic)。避免展开初期的物理计算抖动。
    - `duration: 0.4, ease: [0.22, 1, 0.36, 1]`
*   **收缩 (Collapse)**: 使用 `spring.default`。提供极佳的物理回弹手感。
    - `stiffness: 350, damping: 40`

### 1.2 稳定性保障
*   **CSS 显隐模式**: 在多选模式切换时，通过 CSS 类控制编辑器可见性而非条件渲染（Re-mount），确保**零抖动**切换。
*   **防抖动处理**: 针对短内容页面，滚动触发收缩会减少页面高度并引发快速往复抖动。通过在 `handleScroll` 中增加 `scrollableHeight > 300` 的阈值判断以及 100px/50px 的迟滞区间，确保只有在内容充足且操作明确时才触发状态切换。
*   **捕捉层技术**: 在收缩状态下覆盖透明层，解决 Tiptap 在极小尺寸下点击聚焦不灵敏的问题。

---

## 2. 全屏编辑交互 (Fullscreen Editor)

### 2.1 结构化同步 (JSON Sync)
为了彻底解决换行丢失问题，草稿同步从 Text 模式升级为 **JSON 模式**。
- 存储：`localStorage` 存储 `editor.getJSON()`。
- 恢复：自动检测并回退至 Plain Text 以保证向下兼容。

### 2.2 选区与焦点
- **全域背景聚焦**: 点击边缘空白区域强制调用 `editor.commands.focus('end')`。
- **页脚焦点锁定**: 点击操作按钮（私密、置顶）时 `preventDefault`，防止编辑器失焦导致非预期收缩。

---

## 3. 登录与入场动效 (Login Experience)

### 3.1 状态机设计 (Three-Stage State Machine)
登录页采用三段式状态机，通过 `LayoutContext` 的 `viewMode` 驱动，模拟从“灵感画廊”进入“个人空间”的过程：
- `HOME_FOCUS`: **全屏沉浸模式**。首页占据 100% 宽度，无边框圆角，模糊度 0。
- `CARD_VIEW`: **中间过渡态 (transient state)**。首页收缩为带有 24px 圆角的卡片（停留 400ms）。此状态是动画衔接的“心跳”，负责根据 `prevViewMode` 决定下一步是推向 `SPLIT_VIEW`（入场）还是回退回 `HOME_FOCUS`（退场）。
- `SPLIT_VIEW`: **双卡片对等模式 (Dual-Card)**。
  - **右侧首页卡片**: 缩放至 0.9，位移至 45% (x轴)，增加 4px 模糊，降低亮度。
  - **左侧登录面板**: 从 -100% 位移至 0%，占据左侧 50% 空间，与右侧卡片镜像对称。

### 3.2 自动导航逻辑 (Automatic Heartbeat)
为了保证动画的一致性，系统在 `LoginTransitionWrapper` 中维护了 `prevViewModeRef` 和一个带 400ms 延时的 `useEffect`。禁止在业务代码中直接从 `HOME_FOCUS` 跳过 `CARD_VIEW` 进入 `SPLIT_VIEW`，否则会破坏几何衔接的连贯性。
---

## 4. 复合型交互组件 (Interactive Components)

### 4.1 邮件点击与复制 (Email Interaction)
- **悬浮展开**: 复制按钮采用 `w-0` 到 `w-6` 的宽度过渡。
    - `duration: 0.3, ease: 'easeInOut'`
- **状态反馈**: 点击后按钮图标切换为 Checkmark 并停留 2000ms，配合 Toast 提示。

### 4.2 地图状态指示器 (Map Zoom Indicator)
- **触发逻辑**: 仅在用户进行缩放操作（`zoomstart`, `zoom`）时显示。
- **自动隐藏**: 停止操作 1.5 秒后平滑淡出。
    - 动画：`opacity: 0` (300ms)。

---

## 5. 地图高级交互 (Map Advanced Interactions)

### 5.1 聚合点探索 (Cluster Navigation)
- **最佳包含缩放**: 点击聚合点时不再使用固定级数累加，而是通过 `flyToBounds` 自动计算足以展示所有子节点的最小范围。
- **蜘蛛腿 (Spiderfy)**: 当到达极限缩放层级（Zoom 20）仍存在重合点时，触发蜘蛛腿展开。

---

## 6. 防退化检查 (Regression Checklist)
- [ ] **展开/收缩**: 整体平稳，无晃动，无“果冻效应”。
- [ ] **多选切换**: 编辑器瞬间出现/消失，内容绝对静止。
- [ ] **全屏同步**: 关闭全屏后，首页编辑器内容完整且结构正确。
- [ ] **登录流 (Login Flow)**:
    - [ ] **完整序列**: 点击登录 -> 首页缩回卡片 -> 延时 -> 登录面板滑入（禁止直接跳转）。
    - [ ] **双卡片对称**: `SPLIT_VIEW` 下左侧登录面板与右侧首页卡片应具有相同的 `scale(0.9)` 和 `borderRadius(24px)`。
    - [ ] **自动恢复**: 登录成功后调用 `setViewMode('CARD_VIEW')` 必须能触发 400ms 后自动恢复全屏（`HOME_FOCUS`）。
    - [ ] **退场对称**: 点击右侧模糊卡片应先触发收缩到中心，再平滑展开回全屏。
