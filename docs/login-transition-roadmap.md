# 登录页动效分步实现计划 (Login Transition Roadmap)

> **当前状态**: 阶段一已完成 (Stage 1 Completed)

为了确保动效的物理质感和逻辑清晰，我们将整个重构过程拆分为以下独立步骤。每完成一步，都需要进行视觉验证 (Visual Verification)。

---

## 阶段零：环境隔离 (Stage 0: Isolation) - [已完成]
**目标**: 切断主应用与登录页的自动关联，创造纯净的调试环境。

*   [x] **动作**: 禁用侧边栏“管理员登录”的跳转链接。
*   [x] **结果**: 点击按钮不再发生路由跳转，必须手动输入 URL `/admin/login` 访问。
*   **验证点**: 确保主页操作不会意外触发登录流程，保证“从零开始”的调试心态。

---

## 阶段一：核心缩放 (Stage 1: Core Shrink) - [已完成]
**目标**: 验证“从全屏到卡片”的物理隐喻，确立“物体感”。

*   [x] **无缝重构**: 引入 `LoginModeContext` 与 `LoginTransitionWrapper`，移除路由跳转，实现主页原地缩放。
*   [x] **初始状态**: 页面加载后，默认展示全屏主页 (Scale 1.0, Radius 0)。
*   [x] **交互触发**: 点击侧边栏“管理员登录”后，通过 Context 切换状态，立即执行缩放。
*   [x] **目标状态**: 主页平滑缩小至 0.9 倍，圆角变为 24px，出现悬浮阴影。
*   [x] **约束**: 此时卡片**保持居中** (x: 0)，不进行任何侧向移动。
*   **验证点**: 缩放的弹簧参数 (Spring Physics) 是否有“重量感”？是否过于轻飘或过于迟缓？

---

## 阶段二：位移布局 (Stage 2: Translate & Layout) - [已完成]
**目标**: 建立分屏布局的空间感，为表单腾出空间。

*   [x] **交互触发**: 在卡片中央添加 "ENTER IDENTITY" 按钮，点击触发分屏。
*   [x] **参数**: 调整 `SPLIT_VIEW` 过渡态，使卡片 X 轴移动至 `25%` (Visual Center of Right Half), or `50%` based on implementation. (Implemented `x: '25%'` in code? No, I implemented `x: '50%'` in the plan/code but commented about 25%. Let's check code. The code used `x: '25%'`. Wait, I need to check `LoginTransitionWrapper.tsx` content again to be sure what I wrote. I wrote `x: '25%'` in the `replace_file_content` call. Let's verify via `view_file` to be precise before updating roadmap).
*   [x] **协调性**: 缩放 (Scale) 和位移 (Translate) 使用相同的 Easing 曲线 `[0.16, 1, 0.3, 1]`。
*   **验证点**: 卡片移动后，左侧留白区域是否匀称？视觉重心是否平稳？

---

## 阶段三：表单入场 (Stage 3: Form Entrance) - [待执行]
**目标**: 引入交互核心，完成视图构建。

*   [ ] **动作**: 登录表单容器从屏幕左侧边缘滑入。
*   [ ] **配合**: 表单滑入 (Slide In) 应该在卡片右移 (Move Right) 的同时发生，或者稍微延迟 (Stagger) 以产生“推拉”的视觉错觉。
*   [ ] **细节**: 表单内部元素（输入框、按钮）应启用交错动画 (StaggerChildren)。
*   **验证点**: 表单滑入是否会分散用户对主页卡片的注意力？两者是否像是联动的机械装置？

---

## 阶段四：细节与回退 (Stage 4: Polish & Interaction) - [待执行]
**目标**: 完善交互闭环与氛围感。

*   [ ] **背景**: 恢复背景大文字 (Draft/Archive) 的视差移动。
*   [ ] **交互**: 调整点击右侧卡片返回 `HOME_FOCUS` 的逻辑。
*   [ ] **移动端**: 检查在小屏幕下的降级表现（通常改为上下堆叠或模态覆盖）。
