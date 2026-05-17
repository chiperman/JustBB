# 设计文档：全局对话框系统 (ConfirmContext)

## 1. 目标 (Goals)

彻底解决项目中原生 `alert`, `confirm`, `prompt` 的使用问题，统一使用基于 `radix-ui` 的交互界面。
通过 `Promise` 模式提供简洁的调用接口，替代零散的对话框状态管理。

## 2. 核心架构 (Architecture)

采用 **Promise + Context** 模式。

### 2.1 状态管理

- **位置**: `src/state/ConfirmContext.tsx`
- **Provider**: `ConfirmProvider` 包裹应用顶层。
- **状态结构**: 维护一个 `config` 对象，包含弹窗的标题、描述、类型（alert/confirm/prompt）以及控制 Promise 的 `resolve` 函数。

### 2.2 Hook 接口 (`useConfirm`)

提供三个核心方法：

- `confirm(config)`: 返回 `Promise<boolean>`。
- `alert(config)`: 返回 `Promise<void>`。
- `prompt(config)`: 返回 `Promise<string | null>`。

## 3. UI 实现 (UI Implementation)

- **基础组件**: 复用 `src/shared/ui/alert-dialog.tsx`。
- **动态渲染**:
  - `alert`: 仅显示“确认”按钮。
  - `confirm`: 显示“确认”和“取消”按钮，支持 `destructive` 变体。
  - `prompt`: 在内容区动态插入 `Input` 组件，支持回车提交。
- **视觉一致性**: 严格遵循项目现有的 Humanistic Flat 视觉语言。

## 4. 实施路径 (Implementation Path)

1. **创建 Context**: 编写 `ConfirmContext.tsx` 及配套的 `ConfirmProvider`。
2. **注册 Provider**: 在 `src/shared/layout/ClientLayoutProviders.tsx` 中注入。
3. **全局容器**: 在 `Toaster` 同级放置对话框渲染容器。
4. **代码替换**:
   - 替换 `src/shared/ui/SelectionToolbar.tsx` 中的 `window.confirm`。
   - (可选) 重构 `src/features/memos/components/MemoActions.tsx` 中的删除确认逻辑。

## 5. 验证计划 (Verification)

- **功能测试**: 验证各类型弹窗的 Promise 返回值是否符合预期（点击取消返回 false/null，确认返回 true/输入值）。
- **交互测试**: 验证回车键（确认）和 ESC 键（取消）的支持。
- **样式验证**: 检查在不同主题下的显示效果。
