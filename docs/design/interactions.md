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

### 3.1 状态机设计
登录页采用三段式状态机，模拟从“灵感画廊”进入“个人空间”的过程：
- `HOME_FOCUS`: 全屏预览主页，模糊度 0。
- `CARD_VIEW`: 首页收缩为带有 12px 圆角的卡片（停留 600ms）。
- `SPLIT_VIEW`: 首页向右位移并模糊，登录表单从左侧滑入。

### 3.2 视觉隐喻
- 强调空间的流动性与平滑的几何衔接。
- 动画参数统一遵循 [Design System](design-system.md) 规范。
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
- [ ] **登录流**: 进入/退出登录状态时，背景卡片的缩放与位移衔接顺滑。
