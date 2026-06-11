# Supabase 本地开发与迁移说明

> 最后更新：2026-06-11
> 状态：与当前仓库结构同步

`supabase/` 目录是 JustMemo 的数据库与本地基础设施描述目录。

这里包含：

- 本地 Supabase 配置
- SQL 迁移文件
- 本地 seed 数据

## 1. 目录结构

### `config.toml`

本地 Supabase 服务配置文件，用于定义：

- 端口
- Auth 配置
- 存储开关
- 本地开发环境行为

### `migrations/`

数据库迁移目录。

所有数据库结构、RLS、RPC 和关键 SQL 逻辑都应通过这里演进。

### `seed.sql`

本地开发种子数据。

执行 `npm run supabase:db:reset` 时会自动写入。

## 2. 本地开发流程

### 日常启动

日常开发只需要在项目根目录执行：

```bash
npm run dev
```

这个命令会先检查并启动本地 Supabase，再启动 Next.js 开发服务器。

### 只启动 Supabase

在项目根目录执行：

```bash
npm run supabase:start
```

这个入口会调用 `scripts/dev-setup.sh`，在 Docker 或 Supabase CLI 状态不一致时尝试自愈。

项目使用 `package.json` 中的本地 Supabase CLI 依赖，不要求全局安装 `supabase` 命令。

## 3. 排障命令

### 查看状态

```bash
npm run supabase:status
```

### 停止本地 Supabase

```bash
npm run supabase:stop
```

### 干净重启本地 Supabase

```bash
npm run supabase:restart:clean
```

这个命令会停止本地 Supabase 并丢弃本地备份，再重新启动。它适合处理本地容器状态异常，不等同于数据库迁移重放。

### 重放迁移和 seed

```bash
npm run supabase:db:reset
```

这个命令会：

- 重放全部迁移文件
- 重新执行 `seed.sql`

## 4. 数据库变更流程

### 创建新迁移

```bash
npx supabase migration new <name>
```

### 在迁移中编写 SQL

新文件会生成在：

- `supabase/migrations/<timestamp>_<name>.sql`

### 本地验证

```bash
npm run supabase:db:reset
```

必要时再配合运行：

```bash
npm run test:integration
```

### 推送到远端

```bash
npm run supabase:push
```

## 5. 类型生成

当数据库结构变化后，需要同步更新 TypeScript 类型：

### 生成本地类型

```bash
npm run types:generate
```

当前本地类型文件输出到：

- `src/types/database.ts`

## 6. 当前迁移关注点

当前的数据库演进重点包括：

- `owner_id` 引入
- owner-based RLS
- 私密 Memo 的单条解锁模型
- `search_memos_secure` 的 `unlocked_ids` 语义

对应说明请看：

- [数据与隐私参考](../docs/reference/privacy-and-data.md)

## 7. 开发守则

- 不要直接修改已经进入生产历史的旧迁移文件
- 新变更一律通过新增迁移完成
- 表级权限必须显式考虑 RLS
- 涉及私密 Memo 的查询与权限调整，必须同时更新文档与测试

## 8. 相关文档

- [仓库 README](../README.md)
- [数据与隐私参考](../docs/reference/privacy-and-data.md)
- [测试参考](../docs/reference/testing.md)
