# JustMemo 业务逻辑架构

> 最后更新：2026-04-19
> 状态：与当前代码同步

## 1. 作用

这份文档描述 JustMemo 当前的前端业务架构，重点回答：

- 页面是如何组织的
- 数据如何加载与缓存
- 各个 Context 分别负责什么
- 主列表、地图、时间轴和私密解锁如何协同

## 2. 架构总览

JustMemo 当前采用的是：

- Next.js App Router 负责页面与路由
- Server Components 负责首屏数据注入
- Client Components 负责交互、缓存复用和局部刷新

这不是早期那套基于 `ViewContext` 的自定义客户端路由结构。当前主导航已经回到 Next.js 路由与 `pathname` / `router.push` 驱动模型。

## 3. 页面与布局结构

### 3.1 Layout Provider 栈

客户端布局统一经过 `ClientLayoutProviders` 注入以下状态层：

- `UserProvider`
- `UnlockedMemosProvider`
- `PageDataCacheProvider`
- `StatsProvider`
- `LayoutProvider`
- `UIProvider`
- `TagsProvider`

这意味着：

- 用户身份
- 私密解锁状态
- 页面数据缓存
- 统计与标签数据
- 布局与多选状态

都在统一的布局入口处初始化，而不是散落在各页面中。

### 3.2 主界面结构

首页主界面由 `MainLayoutClient` 负责，整体分为两块：

- 顶部固定区
- 底部滚动区

顶部固定区承载：

- `FeedHeader`
- `MemoEditor`

底部滚动区承载：

- `MemoFeed`

这样做的目的，是把“创建内容”和“浏览内容”在视觉上连成一体、在滚动行为上解耦。

## 4. 数据加载策略

### 4.1 首屏与后续拉取

- 首屏由服务端预取关键数据并注入布局。
- 后续筛选、搜索、分页与解锁后的刷新，都通过 Server Actions 拉取。

主列表的核心读取入口是：

- `getMemos`

### 4.2 页面级缓存

`PageDataCache` 用于缓存已经访问过的页面结果。

缓存键由以下信息共同组成：

- 当前 URL 参数
- 当前已解锁 Memo 集合

这让系统可以区分：

- 同一个页面的不同搜索条件
- 同一个页面在“未解锁 / 已解锁某条 Memo”下的不同数据结果

### 4.3 全局轻量缓存

`memoCache` 仍承担轻量索引和局部同步职责，主要用于：

- 发布新 Memo 后的即时更新
- 某些子页面的缓存预热

它不是权限判断来源，也不是私密内容长期存储层。

## 5. 私密 Memo 的前后端协作

### 5.1 可见性来源

私密 Memo 的最终可见性由三部分共同决定：

- 数据库中的 `owner_id`
- 当前查看者身份
- 当前页面中已解锁的 Memo ID 集合

### 5.2 客户端解锁状态

`UnlockedMemosContext` 只在当前页面内存中保存已解锁 Memo：

- 不写 Cookie
- 不写 `localStorage`
- 刷新或关闭页面后失效

### 5.3 查询侧补丁

对于普通 RLS 无法直接表达的展示场景，例如：

- 地图中的锁定占位
- 按编号获取单条 Memo

系统会在查询结果上统一叠加可见性辅助，而不是让各组件自己写权限分支。

## 6. 关键 Context

| Context | 职责 |
|------|------|
| `UserContext` | 当前用户身份与权限 |
| `UnlockedMemosContext` | 当前页面已解锁 Memo 集合 |
| `PageDataCache` | 按页面条件缓存查询结果 |
| `StatsContext` | 热力图与统计数据 |
| `TagsContext` | 标签集合与计数 |
| `LayoutContext` | 登录转场、布局状态 |
| `UIContext` | 多选与批量操作状态 |

## 7. 关键页面协同

### 7.1 主列表

主列表是所有规则的基线场景：

- 搜索
- 标签
- 日期过滤
- 私密占位
- 已解锁后的即时可见

都在这里汇合。

### 7.2 时间轴与热力图

时间轴和热力图不维护自己的数据真相，而是统一落回 URL 参数：

- `?date=`
- `?year=`
- `?month=`

这样可以直接复用主列表和 `PageDataCache`。

### 7.3 地图

地图页使用包含锁定占位语义的数据源：

- 公开 Memo 可直接展示
- 私密 Memo 可显示标记
- 非作者点击后仍需单条解锁

### 7.4 画廊

画廊不是独立数据模型，而是同一批 Memo 的图片优先视图。

## 8. 组件组织方式

当前前端代码主要遵循两条拆分原则：

### 8.1 Hooks 驱动

复杂状态从组件中抽离到 Hook：

- `useMemoEditor`
- `useMemoFeed`
- `useEditorSuggestions`
- `useMapMemos`
- `useSidebarNavigation`

### 8.2 原子子组件

复杂 UI 再按功能继续拆为子组件，例如：

- `memo-card/*`
- `components/layout/*`
- `components/ui/*`

这样做的目的是降低单组件复杂度，并让文档与代码结构更容易对应。

## 9. 当前重点约束

- 路由与页面切换优先依赖 Next.js 原生路由能力
- 缓存必须按页面条件与解锁状态隔离
- 私密可见性必须统一走作者 / 单条解锁模型
- 新的页面能力应尽量复用现有 Context 和查询层，而不是再发明一套并行状态体系

## 10. 相关文档

- [接口与数据访问](./api.md)
- [数据库设计](./database.md)
- [私密 Memo 规则](./security.md)
- [功能模块总览](../features/features-guide.md)
