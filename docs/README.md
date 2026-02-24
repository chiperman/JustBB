# JustMemo 文档中心 (Documentation)

> 最后更新：2026-02-24 (精简重构：去除冗余，合并核心)

欢迎使用 JustMemo 开发者文档。本项目是一个追求现代圆润感、基于 Next.js 16 和 Supabase 构建的高性能私密笔记系统。

---

## 📖 核心文档索引

### 🏗️ 架构与规范 (Architecture)
*   [Logic Architecture](./architecture/logic-architecture.md)  
    **[核心]** 详解 Hybrid SPA 架构、SWR 缓存策略及纯远端分页的 Mention 逻辑。
*   [API Spec](./architecture/api-spec.md)  
    Server Actions、RPC 函数及通用响应协议。
*   [Database Schema](./architecture/database-schema.md)  
    数据库表结构设计、核心安全函数及 JSONB 定位字段说明。
*   [Security Architecture](./architecture/security-architecture.md)  
    隐私策略、解锁流程及访问控制模型。

### 🎨 设计与体验 (Design)
*   [Design System](./design/design-system.md)  
    视觉风格、配色系统及 12-8-4 核心视觉规范。
*   [Interactions & Motion](./design/interactions.md)  
    **[合并]** 专项设计：全屏编辑器交互、结构化同步 (JSON) 及登录入场动效。

### ✨ 主要功能 (Features)
*   [Features Guide](./features/features-guide.md)  
    **[整合]** 业务模块手册：涵盖画廊、地图定位、链接预览及多选批量操作。

### 🧪 质量与工程 (Engineering)
*   [Tech Stack](./project/tech-stack.md)  
    技术栈（Hugeicons, Framer Motion 等）版本说明及目录结构。
*   [Testing Strategy](./quality/testing-strategy.md)  
    E2E 测试原则与手动验收清单。

---

## 🛠️ 维护规范
1. **事实优先**：文档即系统，修改核心逻辑必须同步更新文档。
2. **KISS 原则**：保持文档简洁，及时删除过时的过程性计划。
3. **命名规范**：文件采用 `kebab-case.md`，使用 [Hugeicons](https://hugeicons.com/) 图标作为文档标识。
