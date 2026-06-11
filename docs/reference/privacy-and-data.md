# JustMemo 数据与隐私参考

> 最后更新：2026-06-10
> 状态：当前实现参考

## 1. 作用

这份文档是私密 Memo、数据库、RLS、RPC、Server Actions 和数据可见性的权威参考。凡是会影响正文、标签、搜索、导出、分享或统计口径的改动，都应先核对这里。

## 2. 私密 Memo 模型

JustMemo 的 Memo 只有两种可见性：

- `public`：公开内容，任何用户可直接查看正文。
- `private`：私密内容，作者本人可见，其他人必须输入该条 Memo 自己的口令后才能查看正文。

私密 Memo 不是：

- 登录用户可见
- 平台管理员可见
- 全站统一密码可见
- 解锁一条后整站可见

平台管理员不自动拥有查看他人私密 Memo 的能力。

## 3. 解锁规则

- 解锁按 `memo_id` 粒度生效。
- 解锁状态只允许存在于当前页面内存中。
- 不写 Cookie。
- 不写 `localStorage`。
- 不写 URL。
- 刷新或关闭页面后解锁状态失效。

客户端通过 `UnlockedMemosContext` 维护当前页面已解锁 Memo 集合。

## 4. 数据模型

`public.memos` 的核心字段包括：

| 字段                        | 说明                              |
| --------------------------- | --------------------------------- |
| `id`                        | UUID 主键                         |
| `memo_number`               | 自增展示编号                      |
| `owner_id`                  | 作者用户 ID，私密权限模型基础字段 |
| `content`                   | 正文                              |
| `tags`                      | 标签数组                          |
| `locations`                 | 定位信息 JSONB                    |
| `access_code_hash`          | 私密口令哈希                      |
| `access_code_hint`          | 私密口令提示                      |
| `is_private`                | 是否私密                          |
| `is_pinned` / `pinned_at`   | 置顶状态                          |
| `deleted_at`                | 软删除时间                        |
| `created_at` / `updated_at` | 时间戳                            |
| `word_count`                | 字数统计                          |

私密口令只能以哈希形式存储，不能明文落库。

## 5. RLS 与权限

当前策略是 owner-based 并增加了管理员角色限制：

- 公开且未删除 Memo：任何人可读。
- 已登录管理员 (Role = 'admin')：可读写删自己的全部 Memo，包括私密 Memo。
- 非作者/非管理员：不能通过普通表查询直接读取他人私密 Memo，且无权进行任何写操作（Insert/Update/Delete）。
- 插入时必须满足 `owner_id = auth.uid() AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`。
- 更新与删除时必须满足 `owner_id = auth.uid() AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`。

权限真相在数据库层。前端判断只能收敛体验，不能扩大可见范围。在 Server Actions 写操作中也进行了 `isAdmin()` 的强卡门校验。

## 6. 核心 RPC：`search_memos_secure`

当前签名：

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

核心返回字段包括：

- `id`
- `memo_number`
- `owner_id`
- `content`
- `tags`
- `access_code_hint`
- `is_private`
- `is_locked`
- `is_owner`
- `word_count`
- `locations` (JSONB)

可见性规则：

- 公开 Memo：返回正文。
- 作者本人：返回自己的私密 Memo 正文。
- `unlocked_ids` 包含该 Memo：返回该条私密 Memo 正文。
- 其他情况：按查询场景返回锁定占位或过滤掉。对于未解锁的他人私密 Memo：
  - 若原本包含定位，保留 `locations` 字段，以正常画出灰色锁定的定位图钉，但 `content` 置为空字符串。
  - 若原本包含图片，`content` 会被替换为模糊占位 Markdown `![Locked](/images/locked-placeholder.png)`，以便画廊可以展示锁定占位卡片，同时阻止原始图片的读取。

锁定占位只允许用于浏览上下文，例如主列表、地图和画廊。搜索、标签过滤、导出、分享和 AI 摘要不能消费未解锁正文。

## 7. Server Actions 边界

统一响应契约：

```ts
{
  success: boolean;
  data?: T;
  error?: string;
}
```

主要写操作：

- `createMemo`
- `updateMemoContent`
- `updateMemoState`
- `batchAddTagsToMemos`
- `verifyUnlockCode`
- `clearUnlockCode`

主要读操作：

- `getMemos`
- `searchMemosForMention`
- `getMemoByNumber`
- `getMemosWithLocations`
- `getMemoStats`
- `getTimelineStats`
- `getAllTags`
- `exportMemos`

`verifyUnlockCode` 只验证单条 Memo，成功后返回该条可读数据，不写任何持久化凭证。`clearUnlockCode` 只是兼容旧调用链的空操作。

## 8. 各场景可见性

| 场景         | 未解锁私密 Memo 行为             |
| ------------ | -------------------------------- |
| 主列表       | 可显示锁定占位                   |
| 搜索         | 不进入真实结果                   |
| Mention 搜索 | 不返回锁定占位                   |
| 标签聚合     | 不参与公共统计                   |
| 地图         | 可显示标记和锁定态               |
| 时间轴       | 以对应查询口径为准，不能暴露正文 |
| 画廊         | 当前只展示公开 Memo              |
| 导出         | 只能导出当前作者自己的 Memo      |
| 分享 / 海报  | 私密 Memo 不允许对外分享         |

## 9. 迁移与索引

数据库变更必须通过新增 migration 完成，不要改写历史 migration。

当前私密权限改造的关键迁移：

- `20260227000000_init_schema.sql`
- `20260419000000_private_memo_owner_access.sql`

推荐索引仍以迁移和实际查询计划为准。涉及标签、搜索、定位、时间线和主列表排序的索引变更，需要同步更新测试和本文档。

## 10. 动态 API 与缓存

- Server Actions 和 Server Components 中不要在业务深处散落调用 `cookies()` / `headers()`。
- 应通过底层工厂函数统一创建服务端 Supabase client。
- 页面级缓存必须区分 URL 参数、查看者身份和已解锁 Memo id。
- 新增缓存、持久化或跨页面状态同步方案时，不能把私密解锁状态做成长期凭证。
