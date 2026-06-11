# JustMemo

> 最后更新：2026-06-10
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

- [开发参考](./docs/reference/development.md)

### 核心能力

- 公开与私密 Memo
- 单条私密解锁
- 标签、搜索、地图与时间轴浏览
- 画廊视图
- 多选与批量操作
- 作者维度备份导出

私密 Memo 的规则说明请看：

- [数据与隐私参考](./docs/reference/privacy-and-data.md)

## 3. 快速开始

### 环境准备

- Node.js 20+
- Docker Desktop
- **配置环境变量**：复制 `.env.example` 为 `.env.local` 并根据需要修改（项目内置了 Zod 驱动的严格环境变量校验，缺失核心变量将无法启动）。

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

日常开发只需要记这个命令。它会：

- 检查并启动本地 Supabase
- 启动 Next.js 开发服务器

如果要连接远程数据库进行开发，请使用：

```bash
npm run dev:remote
```

本地 Supabase 由项目依赖里的 CLI 提供，不要求全局安装 `supabase` 命令。`scripts/dev-setup.sh` 内置了 Supabase 本地环境的自愈逻辑，用于修复 Docker 异常关停后 CLI 与容器状态不同步的问题。

### 命令怎么记

你日常只需要记一个命令：

```bash
npm run dev
```

提交、push、发版、数据库迁移和完整校验默认交给 AI 按需执行。需要你自己判断问题时，可以按下面的分层看：

| 场景         | 命令                 | 谁常用        |
| ------------ | -------------------- | ------------- |
| 日常启动     | `npm run dev`        | 你            |
| 远程库调试   | `npm run dev:remote` | 你偶尔用      |
| 代码格式化   | `npm run format`     | AI 或你偶尔用 |
| 提交前检查   | `npm run check`      | AI            |
| 单元测试     | `npm run test`       | AI            |
| 构建验证     | `npm run build`      | AI            |
| 完整核心验证 | `npm run verify`     | AI            |
| 生产构建     | `npm run build:prod` | 发布时用      |

本地 Supabase 排障时再看这些：

```bash
npm run supabase:status
npm run supabase:stop
npm run supabase:restart:clean
npm run supabase:db:reset
```

数据库与本地 Supabase 工作流请看：

- [Supabase 本地开发说明](./supabase/README.md)

## 4. 文档地图

### 仓库级文档

- [文档中心](./docs/README.md)
- [脚本目录说明](./scripts/README.md)
- [Supabase 目录说明](./supabase/README.md)

### 核心系统文档

- [架构参考](./docs/reference/architecture.md)
- [数据与隐私参考](./docs/reference/privacy-and-data.md)

### 产品与开发文档

- [产品能力参考](./docs/reference/product.md)
- [开发参考](./docs/reference/development.md)
- [测试参考](./docs/reference/testing.md)
- [设计系统](./docs/interface/design.md)

## 5. 开发与提交流程

项目的工程规范、测试策略和文档维护规则统一写在：

- [开发参考](./docs/reference/development.md)
- [测试参考](./docs/reference/testing.md)

提交前建议至少执行：

```bash
npm run check
npm run test
npm run build
```

## 6. 参考与致谢

本仓库最早基于 [daibor/nonsense.fun](https://github.com/daibor/nonsense.fun) 的思路演化而来，后续围绕私密记录、作者权限模型、地图和时间轴体验做了持续重构。
