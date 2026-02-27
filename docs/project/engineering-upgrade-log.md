# 工程化升级记录 (2026-02-27)

本次升级完成了从“基础开发”到“自动化工程化”的跨越，重点解决了代码质量难以持续保证和数据库维护碎片化的问题。

## 改动概览

### 1. 自动化守卫体系建立
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
