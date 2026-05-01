# Login Transition Smoothing Design

**Problem**

首页点击登录按钮后，当前交互会经历 `HOME_FOCUS -> CARD_VIEW -> SPLIT_VIEW` 两段式切换，并通过 `setTimeout(400)` 推进第二段动画。用户感知上会出现明显停顿，同时首页容器在大面积区域上同时动画 `scale`、`x`、`borderRadius`、`boxShadow`，导致流畅度和优雅感都不足。

**Goal**

保留现有“首页缩成右侧卡片，左侧露出登录面板”的空间叙事，但把过渡收敛为一次完成的轻量动画，让打开和关闭都更顺、更安静。

## Interaction Model

- 布局状态收敛为两态：
  - `HOME_FOCUS`：首页正常占满。
  - `SPLIT_VIEW`：首页右移缩小，登录面板显示。
- 打开登录：直接从 `HOME_FOCUS` 进入 `SPLIT_VIEW`。
- 关闭登录：直接从 `SPLIT_VIEW` 回到 `HOME_FOCUS`。
- 登录成功后：直接回到 `HOME_FOCUS`，不再经过中间态。

## Motion Rules

- 首页主面板仅动画 `transform` 和少量 `opacity`。
- 登录面板仅动画 `transform` 和 `opacity`，避免从屏幕外做长距离滑入。
- 不在全屏大容器上继续插值 `boxShadow`。
- 不再使用基于定时器的自动推进状态机。
- 关闭分屏时走与打开一致的反向路径。
- 分屏态首页 hover 动效弱化，避免主动画结束后继续制造抖动感。

## Visual Constraints

- 保留现有 Humanistic Flat 基调。
- 继续保留纸张背景和装饰文字，但它们只做极轻的透明度变化，不参与主运动。
- 不新增新的视觉语言，不把登录改成抽屉或模态。

## Files In Scope

- `src/state/LayoutContext.tsx`
- `src/shared/layout/LoginTransitionWrapper.tsx`
- `src/shared/layout/SidebarSettings.tsx`
- `src/features/auth/components/LoginPanel.tsx`
- `src/shared/layout/LoginTransitionWrapper.test.tsx`（新增）

## Testing

- 增加一个针对登录切换状态机的单元回归测试，确保：
  - 不再出现 `CARD_VIEW` 中间态。
  - `LoginTransitionWrapper` 不再依赖定时器推进登录动画。
- 运行与本次改动直接相关的 Vitest 用例。
