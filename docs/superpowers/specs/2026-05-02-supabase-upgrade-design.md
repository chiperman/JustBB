# Supabase 开发环境与依赖升级设计文档

> 最后更新：2026-05-02
> 状态：等待评审

## 1. 背景与目标

为了确保 JustMemo 的开发工具链与 Supabase 官方最新的安全补丁、性能优化及 API 特性保持一致，我们需要对项目中的 Supabase 相关组件进行全面升级。

本升级不仅涉及前端依赖包，还包括本地开发 CLI 及其配套的 Docker 服务环境。

## 2. 升级范围

### 2.1 NPM 依赖包 (Frontend & Server)

- **`@supabase/supabase-js`**: 核心 SDK。
- **`@supabase/ssr`**: 服务端认证与请求处理辅助库。

### 2.2 开发工具 (Dev Tooling)

- **`supabase` (CLI)**: 用于管理本地开发容器、执行迁移和生成 TypeScript 类型。

## 3. 详细设计

### 3.1 升级策略：激进同步 (Aggressive Sync)

我们将升级到最新的稳定大版本，并同步拉取最新的 Supabase 本地服务镜像。

### 3.2 实施步骤

1.  **依赖安装**：

    ```bash
    npm install @supabase/supabase-js@latest @supabase/ssr@latest supabase@latest
    ```

2.  **环境重置**：
    - 停止当前服务：`supabase stop`
    - 启动并更新镜像：`supabase start` (这会自动检查并拉取新版本的容器镜像)

3.  **类型同步**：
    - 运行 `npm run types:generate`，确保数据库 Schema 类型与最新的驱动程序兼容。

4.  **验证环节**：
    - **Session 验证**：确认 Next.js App Router 下的服务端授权依然生效。
    - **权限验证**：重点检查 `search_memos_secure` 这个 RPC 函数在最新版 SDK 下的调用是否正常，确保锁定逻辑未被穿透。

## 4. 风险与对策

| 风险                 | 对策                                                                                                                                           |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Breaking Changes** | 升级后立即运行 `npm run test:integration`。如果发现 API 变更导致编译失败，根据官方 Migration Guide 进行代码微调。                              |
| **本地数据库丢失**   | 升级前确保没有未提交到 `migrations/` 的本地 Schema 变更。升级过程中的 `supabase stop/start` 可能会导致未持久化的数据丢失（但不影响线上数据）。 |
| **类型不匹配**       | 重新运行类型生成脚本，并全局检查 TS 报错。                                                                                                     |

## 5. 验收标准

- [ ] 所有 Supabase 相关包成功更新至最新稳定版。
- [ ] 本地服务成功启动且容器版本已更新。
- [ ] `npm run test:unit` 全部通过。
- [ ] `npm run test:integration` 全部通过。
- [ ] 前端页面能正常加载数据，且能正确识别用户登录状态。
