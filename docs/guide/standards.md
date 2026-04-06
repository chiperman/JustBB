# JustBB 工程化标准与开发规范

> 最后更新：2026-02-28

## 1. 核心开发工作流 (SOP)

所有新功能开发或复杂需求实现必须严格遵循以下顺序，禁止跳步。

### Step 1: 构思方案 (Research & Reasoning)
- 明确问题本质与最终目标。
- 扫描代码现状，识别依赖与潜在冲突。
- 给出 1-2 个技术方案，标注已知与未知点。
- **原则**：禁止输出实现代码。

### Step 2: 提请审核 (Design Review)
- 向用户展示构思方案。
- **强制声明**：`等待审核，不进入实现阶段`。
- 必须获得用户明确授权（如回复“开始”）后方可继续。

### Step 3: 质量先行 (Test Definition / TDD)
- 定义“正确”的标准。
- 编写核心逻辑的单元测试 (Unit Tests) 或集成测试 (Integration Tests)。
- 确保测试框架已就绪。

### Step 4: 任务分解 (Task Breakdown)
- 将需求拆解为原子化的 `Task List`。
- 每个任务必须目标清晰、可独立验证。

### Step 5: 执行实现 (Implementation)
- 严格按 Task List 编码。
- 遵循 KISS 原则（简洁优先）。
- 保持与既有代码风格一致。

### Step 6: 全量验证 (Verification)
- 运行 `npm run build` 或 `tsc` 确保编译通过。
- 运行 `npm test` 确保逻辑回归正常。
- 严禁“带病入库”。

### Step 7: 文档同步 (Documentation Sync)
- 同步更新 `/docs` 下的相关文档（API、数据库、架构等）。
- 确保文档即系统。

### Step 8: 显式授权提交 (Atomic Commits)
- 检查 `git status`。
- 询问确认：`变更已就绪，是否需要执行提交（commit）？`。
- 遵循 Conventional Commits 规范执行本地 commit。

## 2. 代码质量规范
- **类型安全**：严禁使用 `any`（针对第三方库兼容性极端情况需附带 `eslint-disable` 注释及说明）。
- **错误日志**：报错必须包含上下文（message, code, hint），禁止输出空对象 `{}`。
- **环境隔离**：所有环境变量必须通过 `src/lib/env.ts` 的 Zod 强校验访问。
- **逻辑钩子化**：凡超过 300 行且包含复杂交互状态的组件，必须抽离业务逻辑至自定义 Hooks (如 `useMemoEditor`)。
- **原子组件化**：大型 UI 组件应按职责拆分为 `src/components/ui/[parent]/` 目录下的原子子组件，主文件仅负责顶层调度与模式切换。
- **数据访问一致性**：读操作优先通过 `query-builder.ts` 进行组合，严禁在多处手写重复的 `.select()` 字段列表。

## 3. Git 提交规范
- **格式**：`type(scope): subject`。
- **Subject**：中文描述，简洁明了。
- **Body**：详细说明“为什么”改动，而非“做了什么”。

## 4. UI/UX 与动画性能标准 (Animation Baseline)
为了确保极致的用户体验与性能，所有 UI 工作必须遵循以下基准：
- **属性限制**：严禁对 `width`, `height`, `top`, `left`, `margin`, `padding` 等触发重排 (Reflow) 的布局属性制作动画。
- **高性能策略**：仅允许对 `transform` 和 `opacity` 等合成层属性 (Compositor Props) 进行动画处理。
- **布局平滑化**：当需要改变布局大小时，**必须**使用 `motion/react` (Framer Motion) 的 `layoutId` 功能，通过合成变换模拟布局变化。
- **交互反馈**：
    - 入场动画应优先使用 `ease-out`。
    - 交互反馈（如按钮点击）的动画持续时间严禁超过 `200ms`。
- **无障碍与节电**：
    - 必须适配 `prefers-reduced-motion` 媒体查询。
    - 当元素移出视口 (Off-screen) 时，必须停止循环动画。
