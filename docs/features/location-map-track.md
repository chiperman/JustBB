# 定位与地图功能 — 开发追踪 (Track)

> 最后更新：2026-02-23
> 关联设计文档：[location-map.md](./location-map.md)

---

## 阶段一：数据层基础

### Step 1: 数据库 Migration
- [ ] 在 Supabase 执行 ALTER TABLE 新增 `locations` JSONB 字段
- [ ] 验证字段已成功添加（`SELECT * FROM memos LIMIT 1`）

### Step 2: TypeScript 类型更新
- [ ] `src/types/database.ts` — Memo Row/Insert/Update 新增 `locations`
- [ ] `src/types/memo.ts` — Memo interface 新增 `locations`

---

## 阶段二：内容解析与渲染

### Step 3: 内容解析器扩展
- [ ] `src/lib/contentParser.ts` — ContentToken 联合类型新增 `location`
- [ ] `src/lib/contentParser.ts` — 正则新增 `📍[name](lat,lng)` 匹配模式
- [ ] `src/lib/contentParser.test.ts` — 新增 location 解析测试用例
- [ ] 运行 `npm run test` 确认通过

### Step 4: 内容渲染组件
- [ ] `src/components/ui/MemoContent.tsx` — 新增 `case 'location'` 渲染分支

---

## 阶段三：地图组件

### Step 5: 安装依赖
- [ ] `npm install leaflet react-leaflet`
- [ ] `npm install -D @types/leaflet`

### Step 6: MapView 封装组件
- [ ] 新建 `src/components/ui/MapView.tsx`
- [ ] 实现 mini 模式（200×150px，用于悬浮预览）
- [ ] 实现 full 模式（用于地图全页视图）
- [ ] 处理 Leaflet CSS 引入与 SSR 兼容（dynamic import）

### Step 7: LocationHoverPreview 悬浮预览
- [ ] 新建 `src/components/ui/LocationHoverPreview.tsx`
- [ ] 基于 Radix HoverCard，嵌入 MapView mini 模式
- [ ] 集成到 Step 4 的 MemoContent 渲染分支

---

## 阶段四：编辑器集成

### Step 8: LocationPickerDialog 选点对话框
- [ ] 新建 `src/components/ui/LocationPickerDialog.tsx`
- [ ] 实现全尺寸地图选点界面
- [ ] 实现地名搜索功能（Nominatim 免费 Geocoding API）
- [ ] 确认选点后返回 `{ name, lat, lng }` 数据

### Step 9: 编辑器工具栏集成
- [ ] `src/components/ui/MemoEditor.tsx` — 新增「📍定位」按钮
- [ ] 按钮点击打开 LocationPickerDialog
- [ ] 确认后向编辑器插入 `📍[name](lat,lng)` 文本

### Step 10: Server Actions 更新
- [ ] `src/actions/memos.ts` — CreateMemoSchema 新增 locations，createMemo 写入
- [ ] `src/actions/update.ts` — updateMemoContent 同步更新 locations
- [ ] 发布时从 content 中解析 locations 数组（复用 contentParser 逻辑）

---

## 阶段五：地图全页视图

### Step 11: 新增地图 Server Action
- [ ] 新建 `src/actions/locations.ts` — `getMemosWithLocations()`

### Step 12: 地图页面组件
- [ ] 新建 `src/components/pages/MapPageContent.tsx`
- [ ] 使用 MapView full 模式渲染所有标记点
- [ ] 点击标记弹出 Memo 摘要弹窗

### Step 13: 侧边栏与路由
- [ ] `src/components/layout/LeftSidebar.tsx` — navItems 新增「地图」
- [ ] `src/components/layout/ClientRouter.tsx` — 新增 `/map` 路由

---

## 阶段六：文档与收尾

### Step 14: 文档更新
- [ ] `docs/architecture/database-schema.md` — 新增 locations 字段
- [ ] `docs/architecture/api-spec.md` — 新增 getMemosWithLocations
- [ ] `docs/project/roadmap.md` — 新增定位与地图功能条目

### Step 15: 集成测试与验收
- [ ] 创建包含定位的 Memo，验证渲染正确
- [ ] 验证悬浮预览地图显示正确
- [ ] 验证地图页面标记点展示与交互
- [ ] 验证编辑器插入定位流程完整

---

## 进度统计

| 阶段 | Steps | 状态 |
|:---|:---|:---|
| 数据层基础 | Step 1-2 | 待开始 |
| 内容解析与渲染 | Step 3-4 | 待开始 |
| 地图组件 | Step 5-7 | 待开始 |
| 编辑器集成 | Step 8-10 | 待开始 |
| 地图全页视图 | Step 11-13 | 待开始 |
| 文档与收尾 | Step 14-15 | 待开始 |
