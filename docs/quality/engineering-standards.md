# 工程质量与开发规范

本文档记录了 JustBB 项目的自动化工作流、质量守卫及后续工程化完善计划。

## 1. 已建立的工作流

### 1.1 代码提交守卫 (Git Hooks)
项目已集成 `husky` 和 `lint-staged`，在执行 `git commit` 前会自动触发以下检查：
- **增量 Lint**：仅对修改的文件执行 `eslint --fix`。
- **增量测试**：仅对受影响的模块执行 `vitest`。
- **全量构建**：执行 `next build` 确保 TypeScript 类型安全且项目可生产交付。

### 1.2 数据库变更管理 (Database DevOps)
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
- [ ] **清扫 Lint 警告**：消除剩余的 90+ 个 `unused-vars` 警告，保持控制台 100% 洁净。
- [ ] **测试覆盖率**：将 `scripts/` 下的手动测试逻辑整合进 `vitest` 自动化测试套件。

### 第三优先级：部署自动化
- [ ] **GitHub Actions**：配置 CI 流程，实现推送自动校验。
- [ ] **Preview Deploy**：配置 PR 预览环境。
