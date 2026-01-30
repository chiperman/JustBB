# JustMemo 重构需求文档 (PRD) v4.0

## 1. 项目概览
本仓库为 `JustMemo` 的全新重构版本，旨在将数据迁移至 Supabase，并利用 Next.js 15 实现高性能、人文质感的碎片化记录工具。

## 2. 文档索引 (模块化拆分)
为了方便维护与阅读，详细需求已拆分为以下模块：

*   🎨 **[设计系统 (Design System)](./modules/design-system.md)**: 视觉风格、配色方案、字体排版。
*   🚀 **[功能模块与体验 (UX)](./modules/features.md)**: 布局结构、热力图、标签云、发布框逻辑。
*   🛡️ **[安全与隐私架构](./modules/security.md)**: Supabase RPC 隔离方案、解锁流程、鉴权逻辑。
*   🛠️ **[工程规范与运维](./modules/engineering.md)**: 技术栈、Git 流程、测试策略、CI/CD。
*   💾 **[数据库设计与 SQL](./modules/database.md)**: 数据模型定义、核心 RPC 函数实现。
*   🔌 **[接口设计规范 (API Spec)](./modules/api.md)**: Server Actions 与数据契约。
*   🧪 **[测试与质量保证方案](./modules/testing.md)**: 单元测试、E2E 与验收清单。

## 3. 核心验收标准 (Final UAT)
1.  所有 Anthropic 视觉变量完美还原，支持字体实时切换。
2.  即使在 Network 抓包，也无法在未解锁时看到隐私正文。
3.  搜索功能支持关键词与标签组合检索，响应时间 < 200ms。
4.  PWA 安装后支持离线开启。

---
*记录日期：2026-01-30*
