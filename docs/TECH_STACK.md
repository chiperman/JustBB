# JustBB 技术选型总览

> **更新日期**：2026-02-09  
> **文档目的**：明确项目所有技术选型，作为开发参考标准

---

## 1. 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| **Next.js** | 16.1.6 | 全栈 React 框架，采用 App Router 模式 |
| **React** | 19.2.3 | UI 渲染引擎 |
| **TypeScript** | ^5 | 类型安全，严格模式 |

---

## 2. 样式与 UI

| 技术 | 版本 | 说明 |
|------|------|------|
| **Tailwind CSS** | ^4 | 原子化 CSS 框架 |
| **Radix UI** | ^1.1.15+ | 无障碍组件原语（Dialog、Dropdown、HoverCard） |
| **Framer Motion** | ^12.29.2 | 动画与过渡效果 |
| **lucide-react** | ^0.563.0 | 图标库 |
| **next-themes** | ^0.4.6 | 深/浅色/系统主题切换 |
| **clsx** | ^2.1.1 | 条件类名拼接 |
| **tailwind-merge** | ^3.4.0 | Tailwind 类名合并去重 |

---

## 3. 后端与数据

| 技术 | 版本 | 说明 |
|------|------|------|
| **Supabase** | ^2.93.3 | BaaS 平台（PostgreSQL + Auth + Storage） |
| **Zod** | ^4.3.6 | 数据校验与类型推断 |
| **bcryptjs** | ^3.0.3 | 密码 Hash 处理 |
| **date-fns** | ^4.1.0 | 日期格式化与计算 |

---

## 4. 功能增强

| 技术 | 版本 | 说明 |
|------|------|------|
| **react-syntax-highlighter** | ^16.1.0 | 代码块语法高亮 |
| **qrcode.react** | ^4.2.0 | 二维码生成（分享海报） |
| **html-to-image** | ^1.11.13 | DOM 截图（海报生成） |
| **use-debounce** | ^10.1.0 | 防抖 Hook |

---

## 5. 开发工具链

| 工具 | 版本 | 说明 |
|------|------|------|
| **ESLint** | ^9 | 代码规范检查 |
| **eslint-config-next** | 16.1.6 | Next.js ESLint 配置 |
| **PostCSS** | - | CSS 后处理器（Tailwind 依赖） |
| **standard-version** | ^9.5.0 | 语义化版本与 Changelog 自动生成 |

---

## 6. 测试体系

| 工具 | 版本 | 说明 |
|------|------|------|
| **Vitest** | ^4.0.18 | 单元测试框架（替代 Jest） |
| **Playwright** | ^1.58.0 | 端到端（E2E）测试 |

---

## 7. 部署方案

| 服务 | 说明 |
|------|------|
| **Vercel** | 生产环境托管，与 GitHub 自动集成 |
| **Supabase Cloud** | 数据库与认证服务 |

---

## 8. 目录结构

```
src/
├── app/           # 路由与页面组件（App Router）
├── components/    # UI 库与业务组件
├── actions/       # Server Actions 逻辑
├── lib/           # Supabase Client、工具函数、加密逻辑
└── types/         # TypeScript 类型定义
```

---

## 9. 环境配置

详见 [.env.example](file:///home/chiperman/code/JustBB/.env.example)，需配置：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase 匿名密钥
- `NEXT_PUBLIC_SITE_URL`：站点域名

---

*详细模块文档请参考 `/docs/modules/` 目录。*
