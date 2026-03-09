# JustBB 代码重构追踪清单

> 目标：解耦核心逻辑、提升渲染性能、统一数据访问层。
> 状态说明：⏳ 等待中 | 🚧 进行中 | ✅ 已完成

---

## 核心任务列表

### 1. 数据访问层 (DAL) 统一重构 ⏳
- [ ] 提取 `BASE_MEMO_SELECT` 常量，统一字段选择逻辑。
- [ ] 在 `src/lib/memos/query-builder.ts` 中封装通用过滤器（隐私、回收站、标签）。
- [ ] 重构 `src/actions/memos/query.ts` 和 `trash.ts` 调用统一查询接口。

### 2. Context 状态管理优化 ⏳
- [ ] 拆分过于臃肿的 `UIContext`（分离弹窗状态与全局交互状态）。
- [ ] 对所有 Context Provider 的 `value` 进行精细的 `useMemo` 记忆化。
- [ ] 优化 `StatsContext` 的刷新频率，引入局部防抖。

### 3. 页面聚合组件瘦身 ⏳
- [ ] 从 `src/components/pages/MapPageContent.tsx` 提取 `useMapInteraction` 逻辑钩子。
- [ ] 从 `src/components/pages/TagsPageContent.tsx` 提取 `useTagFiltering` 逻辑钩子。
- [ ] 拆分页面顶部的统计条与过滤条为独立原子组件。

---

## 已完成记录 (History)

- [x] **MemoEditor 深度重构** (2026-03-09) - 拆分为 Hooks 与子组件，代码量减少 65%。
- [x] **MemoCard 深度重构** (2026-03-09) - 模式解耦，消除 useEffect 副作用报错。
- [x] **parser.ts 逻辑下沉** (2026-03-09) - 提取标签合并逻辑并增加单元测试。

---
