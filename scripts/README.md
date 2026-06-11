# scripts 目录说明

> 最后更新：2026-06-11
> 状态：与当前仓库内容同步

`scripts/` 目录只存放少量脚本型辅助文件，不承载主要业务逻辑。

## 1. 当前文件

### `dev-setup.sh`

用途：

- 为本地 Supabase 环境提供“智能启动”能力
- 在 `npm run dev` 前自动检查本地端口与容器状态
- 当 Supabase CLI 与 Docker 容器状态不一致时，尝试自动修复并重新启动

对应入口：

- `package.json` 中的 `supabase:start`
- 日常开发入口仍然是 `npm run dev`

### `rpc-search-memos.sql`

用途：

- 保留早期 `search_memos_secure` 的 SQL 草稿与历史参考

说明：

- 当前生产与本地真实数据库结构，应以 `supabase/migrations/` 中的迁移文件为准
- 这个脚本更适合作为历史参考，而不是当前权威来源

### `rpc-get-timeline.sql`

用途：

- 保留早期时间轴统计 SQL 的独立脚本版本

说明：

- 当前时间轴相关逻辑同样应优先以 `supabase/migrations/` 和 `src/server/actions/memos/analytics.ts` 为准

## 2. 使用原则

- 新的数据库变更不要继续写进 `scripts/*.sql`
- 应统一通过 `supabase/migrations/*.sql` 管理
- 新的本地辅助脚本可以放在这里，但必须保证：
  - 文件职责单一
  - 能从 `package.json` 找到入口，或在本文件中说明调用方式

## 3. 何时更新本文件

以下情况需要同步更新：

- 新增了脚本文件
- 删除了旧脚本
- `package.json` 的脚本入口发生变化
- 某个脚本从“当前入口”变成了“历史参考”

## 4. 相关文档

- [仓库 README](../README.md)
- [Supabase 本地开发说明](../supabase/README.md)
- [数据与隐私参考](../docs/reference/privacy-and-data.md)
