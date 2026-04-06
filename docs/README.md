# JustMemo 文档中心 (Documentation)

> 最后更新：2026-04-06 (重组目录结构与对齐重构逻辑)

欢迎使用 JustMemo 开发者文档。本项目是一个追求现代圆润感、基于 Next.js 16 和 Supabase 构建的高性能私密笔记系统。

---

## 🏗️ 1. 核心架构 (Core)
本项目底层的逻辑基石与数据协议。

*   **[Logic Architecture](./core/architecture.md)**  
    **[核心]** 详解双容器独立滚动架构、三级嵌套对齐模型及事件驱动同步机制。
*   **[API Spec](./core/api.md)**  
    Server Actions 响应契约、Next.js 动态 API 调用范式及分层缓存建议。
*   **[Database Schema](./core/database.md)**  
    数据库表结构、核心安全函数及 JSONB 定位字段说明。
*   **[Security Architecture](./core/security.md)**  
    隐私策略、解锁逻辑及基于口令哈希的访问控制模型。

---

## 🎨 2. 界面与交互 (Interface)
视觉语言与用户体验的工程化标准。

*   **[Design System](./interface/system.md)**  
    视觉哲学、配色体系、核心圆角比例及 **scrollbar-stable** 全站对齐规范。
*   **[Interactions & Motion](./interface/interactions.md)**  
    专项设计：编辑器迟滞滑动算法、视口感应 (IntersectionObserver) 及登录转场状态机。

---

## 📖 3. 开发指南 (Guide)
工程流程与业务功能手册。

*   **[Engineering Standards](./guide/standards.md)**  
    开发 SOP、代码质量规范（Hooks 驱动、原子化设计）及极简 Git 提交准则。
*   **[Tech Stack](./guide/tech-stack.md)**  
    技术栈版本说明（Hugeicons, Framer Motion 等）及目录结构预览。
*   **[Testing Strategy](./guide/testing.md)**  
    E2E 测试原则与手动回归测试清单（含防退化 Checkpoints）。
*   **[Features Guide](./features/features-guide.md)**  
    业务模块手册：涵盖画廊、地图定位、链接预览及多选批量操作。

---

## 🛠️ 维护原则 (Docs-as-Code)
1. **事实优先**：文档即系统。核心逻辑（如布局组件）变更必须同步更新本文档库。
2. **三级嵌套准则**：在创建新视图时，必须遵循 `Container > Constraint > Padding` 嵌套逻辑，严禁产生 6px 的水平晃动。
3. **KISS 原则**：保持文档简洁，及时清理过时的临时开发记录。
