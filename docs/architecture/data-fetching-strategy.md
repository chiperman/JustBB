# 数据获取架构讨论 (Data Fetching Strategy)

> 最后更新日期：2026-02-24
> 状态：讨论记录，供后续审查

## 背景
在画廊功能重构的讨论中，我们对项目的数据获取策略进行了深入分析。核心问题是：**各页面（首页、画廊、标签、地图）应该各自独立请求数据，还是共享一份全局缓存？**

## 现有架构事实

### 全量加载机制
经代码核查，项目**已经采用了全量加载**策略：

| 组件 | 调用 | 说明 |
|------|------|------|
| `MemoFeed.tsx` | `getAllMemos()` | 首页信息流后台全量刷新，然后通过 `clientFilterMemos` 做本地过滤 |
| `MemoEditor.tsx` | `getAllMemos()` | `@` 引用补全，全量数据灌入 `memoCache` 做即时本地搜索 |

### `getAllMemos()` 实现 (`src/actions/search.ts`)
```typescript
const { data, error } = await supabase
    .from('memos')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
// 无 limit —— 真正的全量拉取
```

### `memoCache` 单例 (`src/lib/memo-cache.ts`)
- **全局单例模式**：`MemoCache.getInstance()` 确保全应用共享同一实例。
- **LocalStorage 持久化**：数据存入 `MEMO_DATA_CACHE_V1`，刷新页面后仍可秒恢复。
- **订阅机制**：`memoCache.subscribe(listener)` 允许任意组件监听数据变化，实现跨页面实时同步。
- **合并策略**：`mergeItems()` 基于 ID 去重，按置顶 → 创建时间排序。

### 首页数据流时序
```
1. SSR 阶段：getMemos({ limit: 20 }) → 首屏秒开（仅 20 条）
2. 客户端挂载：initialMemos 写入 memoCache
3. 后台刷新：getAllMemos() → 全量数据写入 memoCache → 替换显示
4. 前端过滤：clientFilterMemos(allMemos, { tag, date, query... })
```

## 讨论要点

### 为什么不做分页？
在本项目的语境下（个人 Memo 应用），全量加载是合理的：
- **搜索**：`MemoEditor` 的 `@` 引用需要在本地做即时模糊搜索，必须有全量数据索引。
- **标签过滤**：`MemoFeed` 使用 `clientFilterMemos` 在前端做标签/日期/关键词过滤，依赖全量数据。
- **数据规模**：个人 Memo 应用的数据量通常在数百至数千条，全量加载的性能开销可控。

### 潜在的扩展性风险
如果未来数据量增长到万级以上：
- `localStorage` 的 5MB 限制可能成为瓶颈。
- 全量 JSON 解析的 CPU 开销会影响低端设备性能。
- **建议的演进路径**：引入 IndexedDB 替代 `localStorage`，或采用服务端搜索 API + 分页机制。

### 各页面的数据来源统一方案
既然全量数据已经存在于 `memoCache` 中，各子页面应**统一复用**而非独立请求：

| 页面 | 现有方式 | 建议方式 |
|------|----------|----------|
| 首页 (`/`) | `getAllMemos()` → `memoCache` → `clientFilterMemos` | ✅ 保持不变 |
| 画廊 (`/gallery`) | 独立接口 `getGalleryMemos` (`.ilike`) | ❌ → 改为读 `memoCache` + 前端正则过滤 |
| 标签 (`/tags`) | 读 `PageDataCache['/']` + SWR | 可进一步改为读 `memoCache` |
| 地图 (`/map`) | 独立接口获取含位置的 Memos | 可进一步改为读 `memoCache` + 位置字段过滤 |

### 边界场景处理
**直接通过 URL 访问子页面**（未经过首页）：
- `memoCache` 的 `localStorage` 持久化在大多数情况下能提供旧缓存兜底。
- 如果 `localStorage` 为空（首次访问或清除缓存），子页面组件应自行触发 `getAllMemos()` 填充缓存。
- 该策略同时为其他页面做了缓存预热，访问任一页面后全局均可秒开。

## 相关文档
- [分页重构方案](./pagination-refactoring-plan.md) — 如果未来需要放弃全量加载，各功能的改造路径和分阶段实施计划。

## 待定决策
1. **是否统一所有子页面的数据源到 `memoCache`？** — 画廊优先实施，其他页面后续考虑。
2. **是否废弃 `getGalleryMemos` 等独立接口？** — 与画廊重构一起进行。
3. **是否需要为 `memoCache` 增加 TTL（过期时间）策略？** — 目前的 SWR 后台刷新已够用。
4. **`localStorage` 5MB 限制的应对方案？** — 当前数据量无风险，未来可迁移至 IndexedDB。
