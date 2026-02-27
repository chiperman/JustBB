# 工程化终极优化任务清单 (TODO)

用于追踪 JustBB 项目的深度工程化进度。

## 🛡️ 安全性与数据库 (Priority: High)
- [x] **RLS 策略迁移**：将 `memos` 表的 Row Level Security 权限逻辑代码化，存入 Migration。
- [x] **初始化建表脚本**：补全 `init_schema.sql`，确保本地环境一键从零重建。
- [ ] **存储桶访问控制**：代码化定义 Storage Bucket 的访问策略。

## 🧹 代码洁癖与规范 (Priority: Medium)
- [x] **全量警告清扫**：已完成 ESLint 全量清理（包含 `next/image` 优化和冗余代码移除）。
- [ ] **环境变量校验**：增加构建时环境变量存在性检查逻辑。

## 🧪 自动化测试 (Priority: Medium)
- [ ] **权限回归测试**：将 `scripts/test-rls.ts` 转化为自动化测试用例。
- [ ] **数据过滤测试**：将 `scripts/test-date-filter.ts` 转化为自动化测试用例。

## 🚀 持续集成 (Priority: Low)
- [ ] **GitHub Actions**：配置全自动 CI 流程。
