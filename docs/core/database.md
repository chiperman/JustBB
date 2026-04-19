# JustMemo 数据库设计

> 最后更新：2026-04-19
> 状态：与当前迁移和权限模型同步

## 1. 作用

这份文档描述 JustMemo 当前数据库层的关键事实，包括：

- `memos` 的核心字段
- owner-based RLS
- `search_memos_secure` 的当前语义
- 标签与聚合口径
- 迁移与索引约束

## 2. 数据模型 (`public.memos`)

核心字段如下：

* `id`: uuid，主键
* `memo_number`: serial/identity，自增展示编号
* `owner_id`: uuid，作者用户 ID，引用 `auth.users(id)`
* `content`: text，正文
* `tags`: text[]，标签数组
* `locations`: jsonb，定位信息数组
* `access_code_hash`: text，私密口令哈希
* `access_code_hint`: text，私密口令提示
* `is_private`: boolean，是否私密
* `is_pinned`: boolean，是否置顶
* `pinned_at`: timestamptz，置顶时间
* `deleted_at`: timestamptz，软删除时间
* `created_at`: timestamptz，创建时间
* `updated_at`: timestamptz，更新时间
* `word_count`: integer，字数统计

其中 `owner_id` 是私密 Memo 权限模型的基础字段。私密内容是否可见，不再由“是否管理员”决定，而是由“是否作者 / 是否已解锁该条 Memo”决定。

## 3. 行级权限策略 (RLS)

当前策略已经切换到 owner-based 模型：

* 公开且未删除 Memo：任何人可读。
* 已登录作者：可读写删自己的全部 Memo，包括私密 Memo。
* 非作者：不能通过普通表查询直接读取他人私密 Memo。
* 插入时必须满足 `owner_id = auth.uid()`。
* 更新与删除时必须满足 `owner_id = auth.uid()`。

这意味着平台管理员不会因为站点管理身份而自动拥有他人私密 Memo 的读取权。

## 4. 核心安全函数 `search_memos_secure`

当前 RPC 签名：

```sql
search_memos_secure(
  query_text TEXT DEFAULT '',
  unlocked_ids UUID[] DEFAULT '{}'::UUID[],
  limit_val INT DEFAULT 20,
  offset_val INT DEFAULT 0,
  filters JSONB DEFAULT '{}'::JSONB,
  sort_order TEXT DEFAULT 'newest'
)
```

返回字段：

```sql
(
  id UUID,
  memo_number INT,
  owner_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  tags TEXT[],
  access_code_hint TEXT,
  is_private BOOLEAN,
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ,
  is_locked BOOLEAN,
  is_owner BOOLEAN,
  word_count INT
)
```

### 3.1 可见性规则

RPC 内部遵循以下判断：

* 公开 Memo：直接返回正文。
* 作者本人：直接返回自己的私密 Memo 正文。
* `unlocked_ids` 包含该 Memo：返回该条私密 Memo 正文。
* 其他情况：根据当前查询场景决定返回锁定占位，或直接过滤掉。

### 3.2 锁定占位的出现条件

为了支持主列表和地图中的“可见锁定卡片”体验，RPC 只会在浏览上下文中保留私密 Memo 占位：

* `query_text = ''`
* 且没有 `tag` / `year` / `month` 过滤

这时未解锁私密 Memo 会以：

* `content = ''`
* `tags = []`
* `word_count = 0`
* `is_locked = true`

的形式返回。

在搜索、标签过滤等需要真实匹配内容的场景下，未解锁私密 Memo 不会进入结果集。

### 3.3 支持的 `filters`

| 参数 | 类型 | 说明 |
|------|------|------|
| `tag` | string | 按标签过滤 |
| `num` | number | 按 Memo 编号精确匹配 |
| `date` | string (YYYY-MM-DD) | 按本地日期过滤 |
| `year` | number | 按年份过滤 |
| `month` | number | 按月份过滤 |
| `before_date` | timestamp | 游标：获取此时间之前的数据 |
| `after_date` | timestamp | 游标：获取此时间之后的数据 |
| `exclude_pinned` | boolean | 结果中排除置顶项 |

## 5. 标签与聚合函数

### 4.1 `get_distinct_tags`

当前实现只统计公开 Memo：

```sql
SELECT unnest(tags) AS tag_name, count(*)::BIGINT AS count
FROM memos
WHERE deleted_at IS NULL AND is_private = FALSE
GROUP BY tag_name
ORDER BY count DESC;
```

这保证私密 Memo 不会进入标签页公共统计。

### 4.2 统计信息

热力图、时间轴和导出目前主要在 Server Action 层完成聚合，而不是完全依赖数据库函数。原因是这些结果需要结合当前查看者身份进行裁剪：

* 公开 Memo 始终参与统计
* 作者本人的私密 Memo 参与统计
* 他人的未解锁私密 Memo 不参与统计

## 6. 迁移说明

本轮私密权限改造的关键迁移文件：

* `20260227000000_init_schema.sql`: 在初始 schema 中纳入 `owner_id`
* `20260419000000_private_memo_owner_access.sql`: 回填 `owner_id`、重建 RLS、替换 `search_memos_secure`

其中 `20260419000000_private_memo_owner_access.sql` 做了三件关键事情：

1. 为历史数据补齐 `owner_id`，并将该字段设为 `NOT NULL`
2. 删除旧的管理员中心策略，改为作者中心策略
3. 将 RPC 从“全局输入口令”模式改为“按条传入 `unlocked_ids`”模式

## 7. 推荐索引

当前依然建议保留以下索引用于性能优化：

```sql
CREATE INDEX idx_memos_tags ON memos USING GIN (tags);
CREATE INDEX idx_memos_search_content ON memos USING gin (content gin_trgm_ops);
CREATE INDEX idx_memos_locations ON memos USING gin (locations);
CREATE INDEX idx_memos_timeline_optimization ON memos (created_at) WHERE deleted_at IS NULL AND is_private = FALSE;
CREATE INDEX idx_memos_main_flow ON memos (is_pinned DESC, created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_memos_number ON memos (memo_number);
```

## 8. 相关文档

- [接口与数据访问](./api.md)
- [私密 Memo 规则](./security.md)
- [Supabase 本地开发说明](../../supabase/README.md)
