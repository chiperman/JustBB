# 工程化终极优化任务清单 (TODO)

用于追踪 JustBB 项目的深度工程化进度。

## 🛡️ 安全性与数据库 (Priority: High)
- [x] **RLS 策略迁移**：将 `memos` 表的 Row Level Security 权限逻辑代码化，存入 Migration。
- [x] **初始化建表脚本**：补全 `init_schema.sql`，确保本地环境一键从零重建。
- [ ] **存储桶访问控制**：代码化定义 Storage Bucket 的访问策略。

## 🧹 代码洁癖与规范 (Priority: Medium)
- [x] **全量警告清扫**：已完成 ESLint 全量清理（包含 `next/image` 优化和冗余代码移除）。
- [x] **环境变量校验**：已在构建时增加硬性校验拦截逻辑 (`next.config.ts`)。

## 🧪 自动化测试 (Priority: Medium)
- [x] **权限回归测试**：已将 RLS 校验逻辑迁入 `security.test.ts`。
- [x] **数据过滤测试**：已将日期过滤逻辑迁入 `fetchMemos.integrated.test.ts`。

## 🚀 持续集成 (Priority: Low)
- [x] **GitHub Actions**：已配置基础 CI 流水线 (`ci.yml`)。
