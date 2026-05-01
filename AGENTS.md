# AGENTS.md

本文件是本仓库给 Claude Code、Codex 和其他 agent 使用的统一工作指令。`AGENTS.md` 是唯一维护的权威版本；`CLAUDE.md` 只是兼容入口。

## 项目心智模型

- 这是一个基于 Next.js App Router、React、TypeScript 和 Supabase 的私密 Memo 系统。
- 核心不是公开社交，而是长期个人记录、私密内容按条解锁、权限与可见性正确。
- 涉及界面时，遵循现有 Humanistic Flat 视觉语言；具体规范见 `docs/interface/design.md`。

## 不可违反的规则

- 私密 Memo 不是登录态功能：作者可直接查看；非作者必须用该 Memo 自己的口令逐条解锁。
- 解锁状态只允许存在于当前页面内存中；不要写入 Cookie、`localStorage`、URL 或任何跨页面凭证。
- 权限真相在数据库层：以 `public.memos.owner_id`、RLS、RPC 和数据库约束为准，前端判断不能扩大可见范围。
- `search_memos_secure` 是核心可见性入口：它决定返回正文、锁定占位，还是完全不返回。
- 结果存在不等于正文可见：列表、地图、时间轴可显示锁定占位；搜索、标签聚合、导出、分享、AI 摘要不能消费锁定正文。
- 涉及 Memo 内容的缓存必须区分已解锁 Memo id；筛选、搜索、时间轴、热力图和地图应把 URL 参数视为页面状态真相。

## 快速导航

- 隐私、搜索、导出、分享：先看 `src/server/actions/`，再核对 `search_memos_secure` 和 `supabase/migrations/`。
- UI、交互、视觉一致性：先看对应 `src/features/` 或 `src/shared/ui/`，必要时读 `docs/interface/design.md`。
- 权限、认证、数据可见性：先确认 RLS/RPC 和 migration，再看前端条件判断。
- 复杂客户端状态：优先查 `src/state/`、`src/shared/hooks/` 和既有 feature hooks。
- 脚本、工具或批处理：先查 `scripts/`、`src/shared/lib/`、`src/server/services/`。

理解功能时，优先沿着 `page -> action -> RPC/RLS -> tests/docs` 这条链路看，不要只盯组件树。

## 代码地图

- `src/app/`：Next.js 路由、页面入口和布局。
- `src/server/`：服务端逻辑，包含 `actions/`（数据读写）和 `services/`（外部集成）。
- `src/features/`：按业务领域（如 memos, auth）组织的 UI、hooks 和局部逻辑。
- `src/shared/`：共享基础设施，包含 `ui/`（原子组件）、`layout/`（布局壳）、`hooks/`（通用钩子）和 `lib/`（纯工具）。
- `src/state/`：应用级全局状态 (Context)。
- `supabase/migrations/`：schema、RLS、RPC 和数据库权限的权威来源。
- `e2e/`、`vitest.config.ts`、`playwright.config.ts`：测试入口与配置。

## 工作规则

- 优先复用现有 actions、context、hooks、工具函数和可见性辅助逻辑。
- 复杂客户端逻辑优先抽成 hooks，不要持续堆大页面组件。
- 数据库变更必须通过新增 migration 完成，不要改写历史 migration。
- 行为变更如果影响隐私、搜索语义、时间轴、地图、导出、分享或 RLS/RPC，必须同步考虑测试和文档。
- 不要为了兼容旧实现添加临时 shim；能安全删除的废弃代码应直接删除。
- 不要主动创建新分支、提交、推送或执行破坏性 Git 操作，除非用户明确要求。

## 验证规则

- 优先运行与变更最相关的现有测试；需要更广验证时再扩大范围。
- 前端或交互变更在环境支持时，应实际验证关键 UI 路径。
- 不要修复与当前任务无关的失败测试；只在最终说明中标出。
- 具体测试约定见 `docs/guide/testing.md`。

## 按需阅读

保持 agent 上下文尽量小，只在任务需要时继续读更多文档。

- 仓库背景不清楚时，读 `README.md`。
- 涉及系统行为或数据规则时，读 `docs/core/architecture.md`、`docs/core/security.md`、`docs/core/api.md`、`docs/core/database.md` 和 `supabase/README.md`。
- 涉及开发流程或质量要求时，读 `docs/guide/testing.md` 和 `docs/guide/standards.md`。
- 涉及 UI、交互或视觉一致性时，读 `docs/interface/design.md`。
