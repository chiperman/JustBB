---

## 阶段 0：准备工作与测试基准

- [x] 制定分页重构方案文档 (`pagination-refactoring-plan.md`)
- [x] 制定分页重构任务清单 (`pagination-refactoring-tasks.md`)
- [x] 制定重构测试方案文档 (`pagination-test-plan.md`)
- [ ] 编写 BDD 基准测试脚本 (Playwright) 并运行，记录重构前状态

---

## 阶段一：轻量索引（`@` 引用改造）

### 后端
- [ ] 新增 `getMemoIndex()` 接口（`src/actions/search.ts`）
  - 只返回 `id, memo_number, created_at`，不含 `content`
- [ ] 验证 `searchMemosForMention()` 接口可正常远程搜索（已存在，需确认功能完整性）

### 前端缓存层
- [ ] 重构 `memoCache`（`src/lib/memo-cache.ts`）
  - 缓存数据结构改为轻量索引 `{ id, memo_number, created_at }`
  - `search()` 方法改为仅匹配 `memo_number`
  - 保留 `localStorage` 持久化（体积从 ~500KB 降至 ~60KB / 千条）
  - 保留 `subscribe()` 订阅机制

### MemoEditor 改造
- [ ] 修改 `MemoEditor.tsx` 的缓存初始化逻辑
  - `initCache` 改为调用 `getMemoIndex()` 替代 `getAllMemos()`
  - `contextMemos` seed 逻辑简化为只取索引字段
- [ ] 实现 `@` 补全的**双路径并行搜索**
  - 本地：`memoCache` 中按 `memo_number` 瞬间匹配
  - 远程：`searchMemosForMention(query, 0, 10)` 防抖 300ms
  - 合并：远程结果按 ID 去重后追加到本地结果末尾
- [ ] 验证 `@123` 编号引用 → 瞬间出结果
- [ ] 验证 `@某段话` 内容搜索 → ~300ms 出结果

### 收尾
- [ ] 阶段一完成后提交代码并验证全功能回归

---

## 阶段二：首页分页

### 后端
- [ ] `getMemos()` 增加游标参数 `cursor`（基于 `created_at`）
  - 确认 `search_memos_secure` RPC 是否支持，不支持则修改 SQL 函数
- [ ] 过滤参数（`tag`、`date`、`query`、`sort`）在服务端 WHERE 条件中处理

### MemoFeed 改造
- [ ] 移除 `MemoFeed.tsx` 中的 `getAllMemos()` 后台全量拉取
- [ ] 实现**无限滚动分页**
  - 底部哨兵元素 + `IntersectionObserver`
  - 触底调用 `getMemos({ limit: 20, cursor, ...filters })`
  - 新数据追加到列表末尾
- [ ] 过滤切换（标签/日期/排序）时重置列表，从第一页重新请求
- [ ] 保留 SSR 首屏 20 条秒开逻辑不变

### 废弃清理
- [ ] 评估 `clientFilterMemos`（`src/lib/client-filters.ts`）是否可废弃
- [ ] `MemoFeed` 中移除对 `memoCache` 的全量写入和订阅

### 收尾
- [ ] 阶段二完成后提交代码并验证：首页加载、滚动加载、标签过滤、日期过滤、搜索

---

## 阶段三：子页面独立化

### 画廊 (`/gallery`)
- [ ] 保留 `getGalleryMemos` 接口，增加游标分页支持
- [ ] `GalleryGrid` 实现瀑布流无限滚动
- [ ] 实现多图提取、Lightbox、溯源对话框（参见 [gallery.md](../features/gallery.md)）

### 地图 (`/map`)
- [ ] 新增 `getMapMemos()` 专属轻量接口
  - 只取 `id, memo_number, content, created_at, latitude, longitude`
  - 只取有定位的 Memo（`NOT NULL latitude AND longitude`）
- [ ] `MapPageContent` 切换为使用新接口

### 标签页 (`/tags`)
- [ ] 标签列表 `getAllTags()` 保持不变（天然轻量）
- [ ] 按标签筛选 Memo 改为服务端过滤 `getMemos({ tag, limit: 20, cursor })`

### 收尾
- [ ] 阶段三完成后提交代码并验证：画廊、地图、标签页功能正常

---

## 阶段四：废弃全量加载

- [ ] 确认所有页面和组件已不再调用 `getAllMemos()`
- [ ] 删除 `getAllMemos()` 函数（`src/actions/search.ts`）
- [ ] 精简 `memoCache`：移除全量相关逻辑，仅保留轻量索引功能
- [ ] 清理 `localStorage` 中的旧全量缓存键 `MEMO_DATA_CACHE_V1`
- [ ] 更新相关文档（`data-fetching-strategy.md`、`logic-architecture.md`）
- [ ] 最终全功能回归验证
