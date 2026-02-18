# JustMemo 技术选型总览

> **最后更新日期**：2026-02-18

---

## 1. 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| **Next.js** | 15.x | 全栈 React 框架，采用 App Router 模式 |
| **React** | 19.x | UI 渲染引擎 |
| **TypeScript** | ^5 | 类型安全，严格模式 |

---

## 2. 样式与 UI

| 技术 | 版本 | 说明 |
|------|------|------|
| **Tailwind CSS** | ^4 | 原子化 CSS 框架 |
| **Radix UI** | ^1.x | 无障碍组件原语 |
| **Framer Motion** | ^12.x | 动画与过渡效果 |
| **lucide-react** | ^0.5xx | 图标库 |
| **next-themes** | ^0.4 | 深/浅色/系统主题切换 |

---

## 3. 后端与数据

| 技术 | 版本 | 说明 |
|------|------|------|
| **Supabase** | ^2.x | BaaS 平台（PostgreSQL + Auth + Storage） |
| **Zod** | ^4.x | 数据校验与类型推断 |
| **bcryptjs** | ^3.x | 密码 Hash 处理 |
| **date-fns** | ^4.x | 日期格式化与计算 |

---

## 4. 目录结构

```
src/
├── app/           # 路由与页面组件（App Router）
├── components/    # UI 库与业务组件
├── actions/       # Server Actions 逻辑
├── lib/           # Supabase Client、工具函数、加密逻辑
└── types/         # TypeScript 类型定义
```

---

## 5. 部署方案

| 服务 | 说明 |
|------|------|
| **Vercel** | 生产环境托管，与 GitHub 自动集成 |
| **Supabase Cloud** | 数据库与认证服务 |

---

*详细模块文档请参考 `/docs/` 目录。*
