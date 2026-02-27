# Supabase 用量监控 (Supabase Usage Monitoring)

> 最后更新：2026-02-27

本文档详细说明了管理员端的用量监控功能。该功能旨在提供 Supabase 免费层级指标的透明度，帮助管理员预防因配额超限导致的服务中断。

---

## 🏗️ 功能概览

本功能为管理员提供一个实时仪表盘（基于 Modal 弹窗），展示 Supabase 项目的关键资源配额使用情况。

### 核心能力：
- **双模态数据获取**: 支持通过 Management API 获取全量指标，或在未配置时回退至基于 SQL 的基础统计。
- **全方位指标监控**: 覆盖数据库、存储、Auth、Realtime 及流量。
- **视觉反馈**: 通过进度条颜色（绿/黄/红）直观展示风险状态。
- **交互控制**: 支持手动实时刷新指标。

---

## 🛠️ 技术实现

### 1. 数据采集 (Data Acquisition)

系统优先调用 **Supabase Management API**。

#### A. 全量版 (Management API)
- **Endpoint**: `GET /v1/projects/{ref}/usage`
- **采集指标**:
  - `db_size`: 数据库存储大小（配额 500MB）。
  - `db_egress`: 数据库出站流量。
  - `storage_size`: 文件存储总量（配额 1GB）。
  - `storage_egress`: 存储出站流量。
  - `monthly_active_users`: 月活用户数（配额 50,000）。
  - `realtime_peak_connections`: 实时通道连接峰值。

#### B. 基础版 (SQL Fallback)
若环境未配置 API Key，系统将执行内部 SQL：
- `pg_database_size()`: 获取数据库总字节数。
- `auth.users`: 统计总注册用户数。

### 2. UI/UX 规范

- **入口位置**: `管理员页面 -> 系统配置 -> [查看项目用量]` 按钮。
- **展示容器**: `UsageModal` (采用原生 `Dialog` + `framer-motion` 动画)。
- **进度条逻辑**:
  - `< 70%`: 🟢 健康 (Success)
  - `70% - 90%`: 🟡 预警 (Warning)
  - `> 90%`: 🔴 风险 (Destructive)
- **单位处理**: 所有存储指标统一转换为 MB/GB，流量指标转换为 GB，确保可读性。

---

## 🔒 权限与安全

1. **访问控制**: 接口与 UI 仅对具备 `admin` 角色的已认证用户可见。
2. **凭据安全**: 
   - `SUPABASE_MANAGEMENT_API_KEY` 仅存储在服务端环境变量中。
   - 所有的 API 请求通过 Server Actions 执行，禁止从前端浏览器直接访问外部 API。

---

## 📍 后续路线

- [ ] 增加用量超限的自动邮件提醒（基于 Cron 或 Edge Functions）。
- [ ] 统计数据的本地快照，用于生成历史增长轨迹图。
