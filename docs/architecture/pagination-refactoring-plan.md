# 分页重构方案 (Pagination Refactoring Plan)

> 最后更新日期：2026-02-24
> 状态：设计讨论中，尚未进入实现

## 1. 问题定义

### 现状
项目通过 `getAllMemos()`（`src/actions/search.ts`）一次性拉取数据库中**全部** Memo 记录（无 `limit`），写入全局单例 `memoCache`（`src/lib/memo-cache.ts`，持久化到 `localStorage`）。以下组件依赖该全量数据：

| 组件 | 依赖方式 |
|------|----------|
| `MemoFeed.tsx` | 后台 `getAllMemos()` → `memoCache` → `clientFilterMemos` 前端过滤（标签/日期/关键词/排序） |
| `MemoEditor.tsx` | `getAllMemos()` → `memoCache` → 本地 `memoCache.search()` 做 `@` 引用即时补全 |
| `GalleryPageContent.tsx` | 独立接口 `getGalleryMemos`（或复用缓存） |
| `MapPageContent.tsx` | 独立接口获取含位置的 Memo |
| `TagsPageContent.tsx` | 读 `PageDataCache` + SWR |
| `client-filters.ts` | 纯前端过滤函数，接收全量数组 |

### 痛点
- **首次加载慢**：数据量增长后 API 响应和 JSON 解析耗时线性增加。
- **`localStorage` 5MB 限制**：大量 Memo 序列化 JSON 会突破上限。
- **内存占用**：全量数据常驻内存，对低端设备不友好。
- **带宽浪费**：每次打开应用都做全量拉取，大部分数据用户不会看到。

---

## 2. 重构目标

```
保持现有的"秒开"用户体验 + 消除全量加载的扩展性瓶颈
```

核心原则：
- **按需加载**：每个页面只请求当前视图所需的数据。
- **服务端过滤**：标签/日期/搜索等过滤逻辑下沉到数据库层。
- **轻量索引**：`@` 引用补全需要的索引数据与完整 Memo 内容解耦。
- **渐进增强**：可分阶段实施，不需要一次性全部重构。

---

## 3. 各功能改造方案

### 3.1 首页信息流 (`/`)

#### 现状
```
SSR: getMemos({ limit: 20 }) → 首屏秒开
客户端: getAllMemos() → memoCache → clientFilterMemos → 全量替换
```

#### 改造后
```
SSR: getMemos({ limit: 20, ...filters }) → 首屏秒开（不变）
客户端: 取消 getAllMemos()，改为无限滚动分页
过滤: 服务端 WHERE 条件替代 clientFilterMemos
```

#### 具体改动

##### [修改] `src/components/ui/MemoFeed.tsx`
- 移除 `getAllMemos()` 后台全量拉取。
- 新增**无限滚动**逻辑：
  - 维护 `cursor`（最后一条 Memo 的 `created_at`）。
  - 使用 `IntersectionObserver` 监听底部哨兵元素。
  - 触底时调用 `getMemos({ limit: 20, cursor, ...currentFilters })`。
  - 新数据追加到现有列表末尾。
- 过滤参数（`tag`、`date`、`query`、`sort`）直接透传给服务端接口。

##### [修改] `src/actions/fetchMemos.ts`
- `getMemos` 增加 `cursor` 参数支持（基于 `created_at` 的游标分页）。
- `search_memos_secure` RPC 需确认是否已支持游标参数，若不支持则需更新数据库函数。

##### [废弃] `src/lib/client-filters.ts`
- 过滤逻辑迁移到服务端后，该文件可废弃或仅保留离线兜底用途。

##### 时序图
```
用户打开首页
  │
  ├─ SSR: getMemos({ limit:20, tag, date, sort }) → 渲染首屏
  │
  ├─ 用户滚动到底部
  │    └─ getMemos({ limit:20, cursor: lastCreatedAt, tag, date, sort })
  │         └─ 追加到列表
  │
  └─ 用户切换标签过滤
       └─ getMemos({ limit:20, tag:'新标签', sort })
            └─ 替换列表（重新从第一页开始）
```

---

### 3.2 搜索框

#### 现状
依赖 `memoCache.search(query)` 本地模糊搜索。

#### 改造后
- 改为**服务端全文搜索**，使用已有的 `searchMemosForMention(query, offset, limit)`。
- 前端输入加 **300ms 防抖**。
- 搜索结果支持分页（无限滚动或"加载更多"按钮）。

##### [修改] `src/components/ui/FeedHeader.tsx`（或搜索组件）
- 搜索触发方式：`onChange` + debounce → 调用 `searchMemosForMention(query, 0, 20)`。
- 搜索结果展示在当前 Feed 区域，或独立的搜索结果面板。

##### 注意事项
- 数据库全文搜索依赖 `search_memos_secure` RPC 的 `query_text` 参数。
- 需确认该 RPC 是否支持中文分词。如不支持，考虑启用 PostgreSQL 的 `pg_jieba` 或 `pgroonga` 扩展，或者退而使用 `ILIKE '%关键词%'` 模糊匹配。

---

### 3.3 编辑器 `@` 引用补全

#### 现状
```
MemoEditor 挂载
  └─ getAllMemos() → 全量 Memo 写入 memoCache
       └─ 用户输入 @query
            └─ memoCache.search(query) → 本地即时匹配（<100ms）
```

#### 核心矛盾
`@` 补全需要**瞬间响应**（< 100ms）。如果每次都发网络请求，延迟会经常超过 300ms，补全体验会明显劣化。

#### 改造方案：轻量索引 + 远程搜索并行（已确认）

> [!IMPORTANT]
> 经讨论确认采用此方案。纯轻量索引（截断 content）会导致按内容搜索时匹配不全；IndexedDB 虽解决存储上限但仍需全量下载。本方案是最优平衡点。

##### 核心思路
用户输入 `@query` 时，**同时执行两条路径**：
1. **本地索引**：瞬间返回 `memo_number` 编号匹配的结果（< 50ms）。
2. **远程搜索**：后台请求 `searchMemosForMention(query)` 做数据库全文搜索（~300ms 返回）。

UI 先展示本地编号匹配结果，远程内容搜索结果到达后**合并去重追加**到列表。

##### [新增] 轻量索引接口 `getMemoIndex()`
```typescript
// src/actions/search.ts
export async function getMemoIndex(): Promise<MemoIndexItem[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('memos')
        .select('id, memo_number, created_at')  // 不取 content 全文
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    return data || [];
}
```

- 与 `getAllMemos` 的区别：**不包含 `content` 全文**，体积缩减到原来的 ~1/10。
- 仅用于 `memo_number` 编号匹配，不做内容搜索。

##### [修改] `src/lib/memo-cache.ts`
- 缓存简化为只存储**轻量索引** `{ id, memo_number, created_at }`。
- 去除对完整 `content` 的本地存储依赖。
- `search(query)` 方法改为**仅匹配 `memo_number`**

##### [修改] `src/components/ui/MemoEditor.tsx`
```
MemoEditor 挂载
  ├─ 优先从 localStorage 恢复旧的轻量索引（秒恢复）
  ├─ 后台: getMemoIndex() → 更新轻量索引缓存
  │
  └─ 用户输入 @query
       ├─ 本地：索引中筛选 memo_number 匹配项 → 瞬间展示（<50ms）
       ├─ 远程：searchMemosForMention(query, 0, 10) → ~300ms 返回
       └─ 合并：远程结果去重后追加到列表末尾
```

##### 体验对比
| 场景 | 全量模式 | 轻量索引+远程并行 |
|------|---------|------------------|
| `@123`（编号引用） | 瞬间 | 瞬间 ✅ |
| `@某段话`（内容搜索） | 瞬间 | ~300ms（可接受） ✅ |
| 首次加载 | 全量下载（慢） | 轻量索引下载（快 10x） ✅ |

##### 体积对比估算
| 字段 | 平均大小 | 1000 条 Memo |
|------|---------|-------------|
| 全量 `content` | ~500B | ~500KB |
| 轻量索引 `id + memo_number + created_at` | ~60B | ~60KB |

轻量索引方案下 `localStorage` 压力降低 ~90%。

---

### 3.4 编辑器 `#` 标签补全

#### 结论：无需改动
`getAllTags()` 返回的是聚合统计数据 `{ tag_name, count }[]`，天然轻量（几十到几百条，总计 < 10KB）。保持现状即可。

---

### 3.5 画廊 (`/gallery`)

#### 改造后
- 使用独立接口 `getGalleryMemos({ limit: 30, cursor })`。
- 数据库层 `.ilike('content', '%![%](%)%')` 过滤含图片的 Memo。
- 前端**瀑布流无限滚动**：触底加载更多图片卡片。

##### [修改] `src/actions/fetchMemos.ts`
```typescript
export async function getGalleryMemos(cursor?: string, limit = 30) {
    const supabase = await createClient();
    let query = supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .ilike('content', '%![%](%)%')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (cursor) {
        query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    return data || [];
}
```

##### [修改] `src/components/gallery/GalleryGrid.tsx`
- 增加底部哨兵 + `IntersectionObserver`。
- 触底时调用 `getGalleryMemos(lastCursor)` 追加新卡片。

---

### 3.6 地图 (`/map`)

#### 改造后
- 新增**专属轻量接口** `getMapMemos()`：

```typescript
export async function getMapMemos() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('memos')
        .select('id, memo_number, content, created_at, latitude, longitude')
        .is('deleted_at', null)
        .eq('is_private', false)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });
    return data || [];
}
```

- 只取有定位的 Memo，且只取渲染地图标记需要的字段。
- 有定位的 Memo 通常远少于总量，此接口天然轻量。
- 未来如定位数据暴增，可引入**视窗范围查询**（根据地图可视区域 `lat/lng bounds` 做 `BETWEEN` 过滤）。

---

### 3.7 标签页 (`/tags`)

#### 改造后
- 标签列表：继续使用 `getAllTags()`（轻量，无需改动）。
- 按标签筛选 Memo：改为服务端过滤 `getMemos({ tag: 'xxx', limit: 20, cursor })`。

---

## 4. 需要新增/修改的数据库资源

| 资源 | 类型 | 说明 |
|------|------|------|
| `search_memos_secure` RPC | 修改 | 增加 `cursor` 游标参数支持 |
| `memo_index` 视图（可选） | 新增 | `SELECT id, memo_number, LEFT(content, 80) as snippet, created_at FROM memos` |

---

## 5. 实施路线图（分阶段）

### 阶段一：轻量索引（风险最低，收益最高）
**目标**：消除 `@` 引用补全对全量 `content` 的依赖。
- 新增 `getMemoIndex()` 接口。
- 改造 `memoCache` 为双层结构（索引层 + 内容层）。
- `MemoEditor` 切换为轻量索引。
- **预期收益**：`localStorage` 占用减少 80%，初始化速度提升 5-10x。

### 阶段二：首页分页
**目标**：首页 `MemoFeed` 不再做全量加载。
- 实现游标分页 + 无限滚动。
- 过滤逻辑迁移到服务端。
- 废弃 `clientFilterMemos`。
- **预期收益**：首次加载从"全量数据传输"降至"20 条数据传输"。

### 阶段三：子页面独立化
**目标**：画廊、地图、标签页各自使用独立的轻量接口。
- 画廊分页 + 无限滚动。
- 地图专属轻量接口。
- 标签页服务端过滤。
- **预期收益**：每个页面只加载自己需要的数据。

### 阶段四：废弃全量加载
**目标**：彻底移除 `getAllMemos()` 和全量 `memoCache`。
- 确认所有功能已脱离全量依赖。
- 删除 `getAllMemos()`。
- `memoCache` 简化为仅存储轻量索引。
- **预期收益**：代码简化，消除扩展性隐患。

---

## 6. 风险与取舍

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| `@` 补全延迟增加 | 轻量索引加载中时补全响应变慢 | `localStorage` 缓存旧索引秒恢复 + 远程搜索兜底 |
| 搜索质量下降 | 服务端 `ILIKE` 不如本地全文匹配灵活 | 后续引入 `pg_trgm` 或 `pgroonga` 增强模糊搜索 |
| 离线体验退化 | 分页模式下离线无法浏览全部数据 | `localStorage` 保留最近 N 条 + Service Worker 缓存 |
| 分页跳跃感 | 用户切换过滤条件时列表重置 | 加入淡入/淡出过渡动画平滑切换 |

---

## 7. 总结

当前全量加载模式在个人应用的小数据量场景下运行良好，但存在理论上的扩展性瓶颈。本方案提供了**渐进式迁移路径**，允许按阶段实施，每个阶段都是独立可交付的改进，不需要一次性推翻现有架构。

**推荐的启动时机**：当 `localStorage` 开始接近 5MB 限制，或者首次加载延迟明显大于 2 秒时。
