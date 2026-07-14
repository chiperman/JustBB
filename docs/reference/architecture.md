# JustMemo 架构参考

> 最后更新：2026-07-14
> 状态：当前实现参考

## 1. 作用

这份文档说明 JustMemo 的页面组织、状态层、缓存和核心页面协同。涉及私密 Memo、RLS、RPC、数据库字段和 Server Actions 的细节，请看 [数据与隐私参考](./privacy-and-data.md)。

## 2. 架构总览

JustMemo 当前基于：

- Next.js App Router 负责页面与路由
- Server Components 负责首屏用户与轻量数据注入
- Client Components 负责交互、缓存复用和局部刷新
- Supabase 承载认证、数据库、RLS 和 RPC

主导航使用 Next.js 路由与 `pathname` / `router.push` 驱动，不再依赖旧版自定义客户端路由模型。

## 3. 页面与状态层

`src/app/(main)/layout.tsx` 在服务端预取当前用户和标签；`ClientLayoutProviders` 负责客户端状态和交互层：

| 状态层                  | 职责                     |
| ----------------------- | ------------------------ |
| `UserProvider`          | 当前用户身份             |
| `UnlockedMemosProvider` | 当前页面已解锁 Memo 集合 |
| `PageDataCacheProvider` | 按页面条件缓存查询结果   |
| `StatsProvider`         | 热力图与统计数据         |
| `TagsProvider`          | 标签集合与计数           |
| `LayoutProvider`        | 登录转场与布局状态       |
| `UIProvider`            | 多选与批量操作状态       |
| `ExportProvider`        | 备份导出流程状态         |
| `ConfirmProvider`       | 全局确认对话框状态       |
| `ShortcutProvider`      | 全局快捷键注册与生命周期 |

首页主界面由 `MainLayoutClient` 组织：

- 顶部固定区：`FeedHeader`、`MemoEditor`
- 底部滚动区：`MemoFeed`

这样可以让创建内容和浏览内容在视觉上连贯，同时在滚动行为上解耦。

## 4. 数据加载与缓存

- 服务端布局只预取用户信息和标签等轻量数据；统计数据由客户端按需加载。
- 主列表 Memo 数据由客户端初始化后通过 Server Actions 拉取。
- 筛选、搜索、分页和解锁后的刷新统一回到查询入口。
- 主列表核心读取入口是 `getMemos`。

`PageDataCache` 的缓存键必须区分：

- 当前 URL 参数
- 当前查看者身份
- 当前已解锁 Memo 集合

这保证同一页面在不同筛选、不同用户、不同解锁状态下不会复用错误内容。

`memoCache` 只承担轻量索引和局部同步职责，例如发布新 Memo 后即时更新或子页面缓存预热。它不是权限判断来源，也不是私密内容长期存储层。

## 5. 页面协同

### 主列表

主列表是搜索、标签、日期过滤、私密占位和已解锁可见性的基线场景。

### 时间轴与热力图

时间轴和热力图通过 URL 参数表达页面状态：

- `?date=`
- `?year=`
- `?month=`

这样可以复用主列表查询和 `PageDataCache`。

### 地图

地图页读取带坐标的 Memo。地图允许展示私密 Memo 的锁定占位，但点击后仍必须遵守单条解锁规则。

### 画廊

画廊是同一批 Memo 的图片优先视图，不是独立数据模型。当前查询口径详见 [产品能力参考](./product.md)。

### CLI

`cli/` 是独立 npm 包，通过 `/api/cli/v1` 调用服务端，不直接访问 Supabase，也不调用 Server Actions。命令和发布边界见 [`cli/README.md`](../../cli/README.md)。

## 6. 组件组织

- 复杂状态优先抽到 Hook，例如 `useMemoEditor`、`useMemoFeed`、`useMapMemos`。
- 复杂 UI 继续拆为子组件，例如 `memo-card/*`、`shared/layout/*`、`shared/ui/*`。
- 新页面能力应复用现有 Context、查询层和缓存语义，避免另起并行状态体系。

## 7. 重点约束

- 路由与页面切换优先依赖 Next.js 原生能力。
- 缓存必须按页面条件、查看者身份和解锁状态隔离。
- 私密可见性不能由组件自行扩权。
- 影响页面状态真相的筛选、搜索、时间轴、地图参数应优先落到 URL。
