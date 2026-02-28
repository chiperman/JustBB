# JustMemo 技术选型总览

> 最后更新日期：2026-02-27 (工程化升级：增强安全校验与性能优化)

---

## 1. 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.1.6 | 全栈 React 框架，采用 App Router 模式 |
| React | 19.x | UI 渲染引擎与 Context API 状态管理 |
| TypeScript | ^5 | 类型安全，严格模式 |
| Hybrid SPA Routing | Custom | 基于 ViewContext + History API 的客户端路由，实现无刷新导航 |

---

## 2. 样式与 UI

| 技术 | 版本 | 说明 |
|------|------|------|
| Tailwind CSS | ^4 | 原子化 CSS 框架 |
| Radix UI | ^1.x | 无障碍组件原语 |
| Framer Motion | ^12.x | 动画与过渡效果 |
| Hugeicons | ^1.1.5 | **[唯一图标库]** 配合自研 Wrapper 确保全站图标视觉对齐。 |
| Tiptap | ^2.x | 富文本编辑器核心，支持 JSON 结构化存储。 |
| Leaflet | ^1.9 | 轻量级地图 SDK，配合 CartoDB 提供深浅色底图。 |
| next-themes | ^0.4 | 深/浅色/系统主题切换 |
| next/image | Built-in | **[图片优化]** 全量迁移至 `next/image`，实现 WebP 自动转换与延迟加载。 |

---

## 3. 后端与数据

| 技术 | 版本 | 说明 |
|------|------|------|
| Supabase | ^2.x | BaaS 平台（PostgreSQL + Auth + Storage） |
| Zod | ^4.x | **[安全守卫]** 核心用于运行时与构建时环境变量强校验 (`src/lib/env.ts`)。 |
| bcryptjs | ^3.x | 密码 Hash 处理 |
| date-fns | ^4.x | 日期格式化与计算 |

---

## 4. 目录结构

```
src/
├── app/           # 路由与页面组件（App Router）
├── components/    # UI 库与业务组件
├── actions/       # Server Actions 逻辑
├── context/       # React Context 全局状态管理 (View, PageDataCache, User, Selection, Tags, Stats, Timeline, LoginMode)
├── lib/           # Supabase Client、工具函数、加密逻辑、环境校验 (env.ts)
└── types/         # TypeScript 类型定义
```

---

## 5. 部署方案

| 服务 | 说明 |
|------|------|
| Vercel | 生产环境托管，与 GitHub 自动集成 |
| Supabase Cloud | 数据库与认证服务 |

---

## 6. 工程规范 (Engineering Standards)

### 6.1 Git 规范
*   原子化提交 (Atomic Commits)：每个 Commit 只做一件事。
*   Commit 规范 (Commitlint)：强制采用 `type(scope): subject` 格式。主题与正文使用 中文。
*   自动化守卫：通过 Husky 触发 `pre-commit` 钩子，执行全量类型检查与构建校验。

### 6.2 环境变量安全
*   **强校验机制**：基于 Zod 定义 `envSchema`。在 `next.config.ts` 中集成校验，缺失必要变量将直接中止构建，防止“带病上线”。

---

*详细模块文档请参考 `/docs/` 目录。*
