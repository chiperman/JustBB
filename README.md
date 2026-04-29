# JustMemo

> 最后更新：2026-04-29
> 状态：主入口文档

JustMemo 是一个基于 Next.js 16、React 19 和 Supabase 构建的私密 Memo 系统。

它的核心目标不是做公开社交，而是提供一个更轻、更私密、更适合长期记录的个人表达空间。

## 1. 你可以在这里找到什么

这份 `README` 只负责回答三个问题：

- 这个项目是什么
- 如何在本地启动
- 应该从哪份文档继续往下读

更详细的系统说明统一收口到：

- [文档中心](./docs/README.md)

## 2. 项目概览

### 技术栈

| 分类       | 技术                                   |
| ---------- | -------------------------------------- |
| 前端框架   | Next.js 16.1.6 + React 19 + TypeScript |
| 样式与动效 | Tailwind CSS 4 + Framer Motion         |
| 编辑器     | Tiptap 3                               |
| 地图       | Leaflet                                |
| 后端       | Supabase                               |
| 部署       | Vercel                                 |

完整说明请看：

- [技术选型总览](./docs/guide/tech-stack.md)

### 核心能力

- 公开与私密 Memo
- 单条私密解锁
- 标签、搜索、地图与时间轴浏览
- 画廊视图
- 多选与批量操作
- 作者维度备份导出

私密 Memo 的规则说明请看：

- [私密 Memo 规则](./docs/core/security.md)

## 3. 快速开始

### 环境准备

- Node.js 20+
- Docker Desktop
- Supabase CLI
- 项目根目录下的 `.env.local`

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

这个命令会先执行：

- `npm run supabase:start`
- 再启动 Next.js 开发服务器

其中 `scripts/dev-setup.sh` 内置了 Supabase 本地环境的自愈逻辑，用于修复 Docker 异常关停后 CLI 与容器状态不同步的问题。

### 常用命令

```bash
npm run lint
npm run test
npm run test:integration
npm run build
npm run supabase:status
```

数据库与本地 Supabase 工作流请看：

- [Supabase 本地开发说明](./supabase/README.md)

## 4. 文档地图

### 仓库级文档

- [文档中心](./docs/README.md)
- [变更日志](./CHANGELOG.md)
- [脚本目录说明](./scripts/README.md)
- [Supabase 目录说明](./supabase/README.md)

### 核心系统文档

- [业务逻辑架构](./docs/core/architecture.md)
- [接口与数据访问](./docs/core/api.md)
- [数据库设计](./docs/core/database.md)
- [私密 Memo 规则](./docs/core/security.md)

### 功能文档

- [功能模块总览](./docs/features/features-guide.md)
- [时间轴与归档](./docs/features/timeline.md)
- [地图功能](./docs/features/map.md)
- [画廊功能](./docs/features/gallery.md)
- [内容体验](./docs/features/content-experience.md)
- [多选与批量操作](./docs/features/selection.md)

## 5. 开发与提交流程

项目的工程规范、测试策略和文档维护规则统一写在：

- [工程化标准与开发规范](./docs/guide/standards.md)
- [测试与质量保证方案](./docs/guide/testing.md)
- [文档体系与维护规范](./docs/guide/documentation.md)

提交前建议至少执行：

```bash
npm run lint
npm run test
npm run build
```

## 6. 参考与致谢

本仓库最早基于 [daibor/nonsense.fun](https://github.com/daibor/nonsense.fun) 的思路演化而来，后续围绕私密记录、作者权限模型、地图和时间轴体验做了持续重构。
