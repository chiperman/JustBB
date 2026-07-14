# JustMemo 测试参考

> 最后更新：2026-07-14
> 状态：当前测试脚本参考

## 1. 作用

这份文档说明 JustMemo 当前测试分层、执行命令和变更后的最小验证标准。

## 2. 测试分层

### 单元测试

工具：

- Vitest
- React Testing Library

重点覆盖：

- 内容解析
- 缓存逻辑
- Hook 行为
- 轻量纯函数

典型文件：

- `src/shared/lib/contentParser.test.ts`
- `src/lib/memos/parser.test.ts`
- `src/features/memos/hooks/useMemoFeed.test.ts`

### 集成测试

工具：

- Vitest
- 本地 Supabase

重点覆盖：

- Memo 查询
- 日期过滤
- 私密权限与 RLS 语义
- 作者权限模型

典型文件：

- `src/server/actions/memos/query.integrated.test.ts`
- `src/server/actions/memos/security.test.ts`

### 业务回归测试

Action 层测试用于防止业务规则退化，例如：

- `src/server/actions/memos/query.test.ts`
- `src/server/actions/usage/index.test.ts`

### CLI 测试

CLI 在 `cli/src/` 内维护命令解析、HTTP 客户端、输出和交互流程测试。涉及 CLI 改动时，使用 `npm run check:cli`，它会构建 CLI、运行 CLI 测试并检查 npm 包内容。

## 3. 当前命令

日常人工开发不需要记完整测试矩阵，通常只需要启动项目：

```bash
npm run dev
```

AI 在改代码、提交前或排障时按风险选择以下命令：

```bash
npm run check
npm run build
npm run test
npm run test:integration
npm run check:cli
```

## 4. 最小校验

文档-only 改动：

- 检查 Markdown 链接和引用路径。

普通代码改动：

```bash
npm run check
```

涉及以下内容时，加跑：

```bash
npm run test:integration
```

适用场景：

- 数据库迁移
- RLS
- 私密 Memo 权限
- 搜索、日期、标签查询逻辑
- 导出和备份范围

## 5. 手动回归

重要改动后建议手动确认：

- 主列表搜索与筛选。
- 私密 Memo 解锁与刷新后重置。
- 地图中的私密标记展示。
- 时间轴切换与严格区间滚动。
- 多选模式切换。
- 备份导出只导出当前作者数据。

## 6. 文档与测试同步

以下规则变化时，测试与文档应同时更新：

- 私密 Memo 权限模型。
- 搜索或标签统计口径。
- 导出与备份范围。
- 地图或时间轴中的可见性规则。
- URL 参数、页面缓存和解锁状态协同。

相关文档：

- [数据与隐私参考](./privacy-and-data.md)
- [开发参考](./development.md)
- [Supabase 本地开发说明](../../supabase/README.md)
