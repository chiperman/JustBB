# 工程质量与开发规范

本文档记录了 JustBB 项目的自动化工作流、质量守卫及后续工程化完善计划。

## 1. 已建立的工作流

### 1.1 代码提交守卫 (Git Hooks)
项目已集成 `husky` 和 `lint-staged`，在执行 `git commit` 前会自动触发以下检查：
- **增量 Lint**：仅对修改的文件执行 `eslint --fix`。
- **增量测试**：仅对受影响的模块执行 `vitest`。
- **全量构建**：执行 `next build` 确保 TypeScript 类型安全且项目可生产交付。
- **环境安全网**：引入 Zod 进行运行时与构建时环境变量 Schema 验证 (见 `src/lib/env.ts` 与 `next.config.ts`)。

### 1.2 持续集成 (CI/CD)
- **GitHub Actions (`ci.yml`)**：在 Push 和 PR 触发云端 Lint 扫描、Mock 测试与全量 Next 编译运行，保障集成质量。
- **集成测试体系**：存量测试脚本已自动化转为 `fetchMemos.integrated.test.ts` 和 `security.test.ts`。

### 1.3 数据库变更管理 (Database DevOps)
- **Supabase CLI**：已初始化，数据库配置代码化。
- **迁移逻辑**：核心 SQL 函数已从脚本迁移至 `supabase/migrations`，支持版本控制。
- **脚本化命令**：
  - `npm run types:generate`：同步云端数据库类型到前端。
  - `npm run supabase:push`：推送本地变更到云端。

## 2. 后续完善计划 (Roadmap)

### 第一优先级：安全性代码化
- [ ] **RLS 策略迁移**：将云端手动配置的 Row Level Security 策略转化为 Migration 脚本。
- [ ] **存储桶权限**：代码化管理 Storage Bucket 的访问策略。

### 第二优先级：代码纯净度
- [x] **清扫 Lint 警告**：已消除 `unused-vars` 警告，保持控制台 100% 洁净。
- [x] **测试覆盖率**：已将 `scripts/` 下的手动测试逻辑整合进 `vitest` 自动化测试套件。

### 第三优先级：部署自动化
- [x] **GitHub Actions**：已配置 CI 流程，实现推送自动校验 (`ci.yml`)。
- [ ] **Preview Deploy**：配置 PR 预览环境。
