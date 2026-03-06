# Supabase 本地开发与部署指南

本目录是 JustBB 项目的“基础设施即代码 (IaC)”核心。通过 Supabase CLI，我们实现了数据库结构的本地模拟、版本控制及类型安全。

---

## 🚀 快速开始 (本地开发)

本地运行 Supabase 需要安装 **Docker**。

### 1. 启动本地服务
在项目根目录下运行，启动包括数据库、认证、存储等在内的全套 Supabase 栈：
```bash
npx supabase start
```
启动成功后，控制台会输出 `API URL`、`DB URL` 以及本地控制台 **Studio** 的地址（默认为 `http://localhost:54323`）。

### 2. 初始化数据库与数据
将本地数据库重置为最新状态（执行所有 `migrations` 文件夹下的脚本，并运行 `seed.sql` 填充测试数据）：
```bash
npx supabase db reset
```

### 3. 停止服务
暂时关闭本地环境以节省资源：
```bash
npx supabase stop
```

---

## 🛠️ 数据库迁移工作流 (Migrations)

严禁直接在云端控制台手动修改生产环境。请遵循以下标准链路：

### 1. 创建新变更
生成一个新的带时间戳的迁移文件：
```bash
npx supabase migration new <name>
```
在生成的 `supabase/migrations/<timestamp>_<name>.sql` 中编写 SQL。

### 2. 在本地测试
运行 `reset` 确保脚本在干净的环境中可运行：
```bash
npx supabase db reset
```

### 3. 推送到云端 (Deploy)
当本地测试通过后，将变更同步至远程生产数据库：
```bash
npm run supabase:push
```

---

## 🧬 类型安全 (Type Safety)

每当数据库结构发生变化，必须更新前端的 TypeScript 类型：

```bash
npm run types:generate
```
> **注意**：该命令依赖环境变量 `SUPABASE_PROJECT_ID`。它会扫描云端结构并重写 `src/types/database.ts`，确保你在 `.tsx` 中获得完美的自动补全。

---

## 📂 核心文件说明

- **`config.toml`**：本地服务的配置中心（端口、Auth 设置、存储开关等）。
- **`seed.sql`**：本地开发用的初始数据（种子数据），每次 `db reset` 时会自动注入。
- **`migrations/`**：按时间顺序排列的 SQL 脚本，记录了数据库的每一次进化。

---

## 💡 常用命令速查

| 命令 | 用途 |
| :--- | :--- |
| `npx supabase status` | 查看本地服务运行状态及各种密钥 |
| `npx supabase db pull` | 从云端同步手动修改（慎用，仅用于紧急修复同步） |
| `npx supabase link` | 将本地代码库关联至特定的远程 Supabase 项目 |
| `npx supabase login` | 登录 Supabase 账号以获得云端管理权限 |

---

## ⚠️ 开发守则

1.  **不可逆性**：Migration 文件一旦提交并推送到生产环境，**严禁修改旧文件**。任何变更必须通过新建 Migration 文件完成。
2.  **安全 (RLS)**：所有表必须启用 RLS (Row Level Security)，并显式编写安全策略。
3.  **本地优先**：习惯于在本地 Studio (54323 端口) 调试 SQL，确认无误后再执行 `push`。
