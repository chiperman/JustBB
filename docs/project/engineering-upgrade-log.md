# 工程化升级记录

## 2026-02-28: Calendar Pager 架构演进
- **重构背景**：原有的“混合上下文无限向上加载”方案（利用 `useLayoutEffect` 和虚拟 Buffer）带来了无法根除的滚动条跳跃和渲染生涩感。
- **架构迁移**：
  - 彻底移除了 `MemoFeed` 向上滚动的 Observer 监听和相关虚拟队列。
  - 引入**单日翻页模式 (Calendar Pager Mode)**：当点击特定日期时，系统通过 `getSingleDayMemosWithNeighbors` 并发拉取单日全量数据及真实的相邻前/后有数据的日期（通过 `limit(1)` 探针）。
  - UI 改为静态单日展示，首尾附带极为优雅的 `[View Newer]` / `[View Older]` 传送按钮，实现了完全无抖动、瞬间响应的 Timeline 浏览体验。

---

## 2026-02-27: 自动化工程化跃迁
### 1. 自动化 CI/CD 与测试补全 (新增)
- **GitHub Actions**：
  - 新增 `.github/workflows/ci.yml`，在 Push 和 PR 阶段强制进行 Lint、Test 和 Build 检查。
- **自动化集成测试**：
  - 移除了 `scripts/test-date-filter.ts` 和 `scripts/test-rls.ts` 等手动脚本。
  - 将测试逻辑全量迁入 `fetchMemos.integrated.test.ts` 和 `security.test.ts`，统一使用 Vitest + 本地 Supabase 运行。
- **环境安全网**：
  - 引入 Zod 实现运行时和构建时 (`next.config.ts`) 环境变量强校验。

### 2. 自动化守卫体系建立 (前期)
- **Husky & lint-staged**：
  - 解决了“带病代码”入库的问题。
  - 强制要求 commit 前必须通过 `next build` 校验。
- **存量错误清理**：
  - 修复了 47 个阻塞性 ESLint 错误。
  - 彻底消除了项目中广泛存在的 `any` 滥用。

### 2. 架构与状态逻辑重构
- **派生状态模式 (Derived State)**：
  - 重构了 `ClientRouter`, `MainLayoutClient`, `SearchInput` 和 `SelectionContext`。
  - 移除了冗余的 `useEffect` 同步逻辑，改为在渲染期间直接同步，提升了响应速度并符合 React 最新最佳实践。
- **类型系统统一**：
  - 新建 `src/types/stats.ts`，统一了热力图和时间轴的统计接口定义，解决了因重复定义导致的类型冲突。
  - 为 `MemoEditor` (Tiptap) 和 `MapView` (Leaflet) 提供了严格的第三方库类型集成。

### 3. 数据库维护标准化
- **Supabase CLI 集成**：
  - 初始化了 `.husky` 和 `supabase/` 目录。
  - 编写了 `20260227085542_core_functions.sql` 迁移文件，整合了 `get_timeline_stats`, `search_memos_secure` 等核心函数。
- **环境规范**：
  - 提供了 `.env.example` 模板，明确了项目运行所需的最小变量集。

### 4. 业务逻辑优化
- **用量统计增强**：优化了 Supabase 用量 API 的容错机制，增加了 SQL 回退逻辑。
- **UI 清理**：移除了冗余的 `/admin` 页面路由，改为在侧边栏设置中集成轻量化 Modal 访问。

---
**记录人**：AI Agent (via Gemini CLI)
**状态**：已完成，所有检查项均已通过。
