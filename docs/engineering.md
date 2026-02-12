# JustMemo 工程规范与运维

## 1. 技术栈
*   **Frontend**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS 4.
*   **UI Components**: Radix UI (Dialog/Dropdown/HoverCard), Framer Motion 12.29.
*   **Infrastructure**: Supabase 2.93 (DB/Auth/Storage), Vercel (Hosting).
*   **Extra**: `next-themes` (主题切换), `zod` (数据校验), `bcryptjs` (密码 Hash).

> 完整技术栈详见 [TECH_STACK.md](./TECH_STACK.md)。

## 2. 目录结构规范
*   `src/app`: 路由与页面组件。
*   `src/components`: UI 库与业务组件。
*   `src/actions`: **Server Actions** 逻辑目录。
*   `src/lib`: Supabase Client、工具函数、加密逻辑、**MemoCache (客户端索引)**。
*   `src/types`: 数据库类型定义。

## 2.1 客户端缓存架构 (MemoCache)
*   **目的**: 实现 `@` 引用时的零延迟搜索与建议。
*   **单例模式**: `MemoCache` 类维护全局唯一的内存索引。
*   **混合加载策略 (Hybrid Loading)**:
    1.  **Seed (Props)**: 页面加载时，利用服务端渲染传入的 `contextMemos` (最近20条) 立即初始化缓存。
    2.  **Background Fetch**: 随后在后台异步调用 `getAllMemoIndices` 拉取全量数据 (仅 ID、Content、Number)。
    3.  **Merge**: 自动去重合并，标记 `isFullyLoaded`。
*   **乐观更新**:
    - 发布新 Memo 成功后，直接写入 Cache，无需等待网络重载即可被搜索。

## 3. 环境变量 (.env)
详见根目录下的 **[.env.example](file:///home/chiperman/code/JustMemo/.env.example)**。需配置 Supabase 凭证与站点 URL。
- **Linter/Formatter**: ESLint + Prettier (针对 Tailwind 类名自动排序)。
- **原子化提交 (Atomic Commits)**:
    - **核心原则**: 每个 Commit 只做一件事（即：一个 Commit 解决一个微型任务）。
    - **联动逻辑**: 提交前必须确保对应的 `task.md` 任务已勾选。
    - **回溯性**: 确保 Commit 历史清晰，支持单点撤销。
- **COMMIT 规范 (Commitizen)**:
    - 强制采用 `type(scope): subject` 格式。
    - **所有提交内容必须使用中文**。
    - **Type 列表**: `feat` (功能), `fix` (修补), `docs` (文档), `style` (格式), `refactor` (重构), `test` (测试), `chore` (杂项)。
- **GIT HOOKS (质量守护)**:
    - **Pre-commit (Husky + lint-staged)**: 提交前自动运行 `eslint --fix`, `prettier --write` 以及针对暂存文件的代码质量检查。
    - **Commit-msg (Commitlint)**: 严格校验提交信息格式，拦截不规范的提交。
    - **Pre-push**: (推荐) 自动运行 `npm run build` 或 `npm test` 确保推送到云端的内容是稳健的。

## 3. 测试策略
*   **Unit**: Vitest 4.0 + React Testing Library。
*   **E2E**: Playwright 1.58 (重点覆盖发布与解锁流程)。

## 4. CI/CD
*   **自动化**: 关联 GitHub 仓库，Vercel 自动部署生产环境。
