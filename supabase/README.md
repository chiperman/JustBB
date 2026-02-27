# Supabase 数据库工程化管理指南

本目录是 JustBB 项目的“基础设施即代码 (IaC)”核心。通过 Supabase CLI，我们实现了数据库结构的版本控制、自动化同步及类型安全。

---

## 📂 目录结构说明

- **`config.toml`**：Supabase 本地控制中心。包含 API 端口、Auth 配置及服务设置。
- **`migrations/`**：数据库进化史。按时间戳排序的 `.sql` 文件，记录了所有表、函数、索引和安全策略的变更。
- **`.gitignore`**：自动忽略本地生成的敏感密钥和临时数据库状态。

---

## ⚙️ 核心工作流 (Standard Workflow)

严禁直接在云端控制台手动修改生产环境。请遵循以下标准链路：

### 1. 编写变更 (Develop)
在 `supabase/migrations/` 下创建或编辑 SQL 脚本。
> **Tip**: 使用 `npx supabase migration new <name>` 快速生成带时间戳的新文件。

### 2. 同步云端 (Push)
确认脚本无误后，将本地逻辑推送到远程数据库：
```bash
npm run supabase:push
```

### 3. 同步类型 (Synchronize)
数据库结构变更后，必须同步更新前端的 TypeScript 类型说明书：
```bash
npm run types:generate
```
这会重写 `src/types/database.ts`，确保你在写 `.tsx` 代码时获得最新的自动补全。

---

## 🛠️ 常用命令手册

| 命令 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| `npm run supabase:push` | 将本地 Migration 应用到云端 | 完成开发，准备上线变更 |
| `npm run types:generate` | 联网扫描云端结构并生成 TS 类型 | 数据库增加字段后，修复代码报错 |
| `npx supabase db pull` | 反向操作：拉取云端手动修改到本地 | 在控制台紧急修补后，同步回本地代码库 |
| `npx supabase db reset` | 重置本地数据库并重新执行所有脚本 | 本地实验环境搞乱后，一键还原 |

---

## ⚠️ 安全与维护准则

1.  **不可逆性**：一旦 Migration 文件被 `push` 且提交到 Git，**严禁修改或删除**旧文件。如需变更，请新建一个 Migration 文件。
2.  **安全性 (RLS)**：所有的权限逻辑必须写在 `security_policies.sql` 类文件中，禁止在代码中硬编码敏感逻辑。
3.  **类型第一**：Husky 守卫会检查类型一致性。如果你改了数据库没跑 `types:generate`，你将无法提交代码。
