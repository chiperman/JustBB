# JustMemo 文档中心 (Documentation)

欢迎使用 JustMemo 开发者文档。本项目是一个深度致敬 Anthropic 风格、基于 Next.js 15 和 Supabase 构建的高性能私有笔记系统。

---

## 📖 核心文档索引

### 🚀 概览与规划
*   [**Roadmap & Feature List**](./roadmap.md)  
    项目开发路线图、核心功能清单及当前进度追踪。
*   [**Tech Stack**](./tech-stack.md)  
    项目技术栈选型、版本说明及目录结构。

### 🏗️ 架构与规范
*   [**Logic Architecture**](./logic-architecture.md)  
    全站数据加载策略、SSR 预拉取机制及跨组件状态同步逻辑。
*   [**API Spec**](./api-spec.md)  
    Server Actions、RPC 函数及通用响应协议。
*   [**Database Schema**](./database-schema.md)  
    数据库表结构设计、核心安全函数及索引建议。
*   [**Security Architecture**](./security-architecture.md)  
    隐私策略、解锁流程、鉴权逻辑及写操作保护。

### 🎨 设计与体验
*   [**Design System**](./design-system.md)  
    视觉风格、配色系统、排版规范及交互动画哲学。
*   [**Design: Login Transition**](./design-login-transition.md)  
    专项设计：登录页/主页平滑切换动效的实现逻辑。

### 🧪 质量保证
*   [**Testing Strategy**](./testing-strategy.md)  
    单元测试、集成测试、端到端测试方案及手动验收清单。

---

## 🛠️ 维护规范
1. **命名规范**：所有文档文件采用 `kebab-case.md`。
2. **更新频率**：每当新增功能或修改核心架构时，必须同步更新相关文档。
3. **内容风格**：保持简洁、事实优先，并在文档顶部标注“最后更新日期”。
