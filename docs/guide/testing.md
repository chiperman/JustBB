# JustMemo 测试与质量保证方案

> 最后更新：2026-04-19
> 状态：与当前测试脚本同步

## 1. 作用

这份文档说明当前仓库的测试分层、执行命令和发布前最小校验集。

## 2. 测试分层

### 2.1 单元测试

工具：

- Vitest
- React Testing Library

当前重点覆盖：

- 内容解析
- 缓存逻辑
- Hook 行为
- 轻量纯函数

典型文件包括：

- `src/lib/contentParser.test.ts`
- `src/lib/memo-cache.test.ts`
- `src/lib/memos/parser.test.ts`
- `src/features/memos/hooks/useMemoFeed.test.ts`

### 2.2 集成测试

工具：

- Vitest
- 本地 Supabase

当前重点覆盖：

- Memo 查询
- 日期过滤
- 私密权限与 RLS 语义
- 作者权限模型

典型文件包括：

- `src/server/actions/memos/query.integrated.test.ts`
- `src/server/actions/memos/security.test.ts`

### 2.3 业务回归测试

还有一类测试位于 action 层，用于验证当前业务规则是否退化，例如：

- `src/server/actions/memos/query.test.ts`
- `src/server/actions/usage/index.test.ts`

## 3. 当前命令

### 单元测试

```bash
npm run test
```

或：

```bash
npm run test:unit
```

### 监听模式

```bash
npm run test:watch
```

### 集成测试

```bash
npm run test:integration
```

### 构建校验

```bash
npm run build
```

## 4. 提交前最小校验

如果本次改动涉及功能或文档以外的代码，建议至少执行：

```bash
npm run lint
npm run test
npm run build
```

如果涉及以下内容，还应补充运行 `npm run test:integration`：

- 数据库迁移
- RLS
- 私密 Memo 权限
- 搜索 / 日期 / 标签查询逻辑

## 5. 手动回归建议

以下场景建议在重要改动后手动确认：

- 主列表搜索与筛选
- 私密 Memo 解锁与再次进入页面后的重置
- 地图中的私密标记展示
- 时间轴切换与严格区间滚动
- 多选模式切换
- 备份导出只导出当前作者数据

## 6. 文档与测试的关系

当以下规则发生变化时，测试与文档应同时更新：

- 私密 Memo 权限模型
- 搜索或标签统计口径
- 导出与备份范围
- 地图或时间轴中的可见性规则

## 7. 相关文档

- [工程化标准与开发规范](./standards.md)
- [私密 Memo 规则](../core/security.md)
- [Supabase 本地开发说明](../../supabase/README.md)
