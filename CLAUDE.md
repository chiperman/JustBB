# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

- 这是一个基于 Next.js App Router、React 19、TypeScript 和 Supabase 的私密 Memo 系统。
- 这个仓库最重要的设计前提不是“公开社交”，而是“长期个人记录 + 私密内容按条解锁”。
- 讨论实现时，优先关注权限边界、数据可见性和状态一致性，而不是单纯的页面表现。

## 先建立的心智模型

### 1. 私密 Memo 不是登录态功能

私密 Memo 的可见性不是：

- 登录即可见
- 管理员即可见
- 全局口令解锁后全站可见

它必须始终是：

- 作者本人可直接查看
- 非作者必须按条输入该 Memo 的口令后才能查看
- 解锁只对当前页面内存态生效，刷新后失效

这是仓库里最重要的业务规则，任何新功能都不能绕开它。

### 2. 权限真相在数据库，不在组件

- `public.memos` 的核心权限字段是 `owner_id`。
- Supabase RLS 已切换到 owner-based 模型；平台管理员不自动拥有他人私密内容读取权。
- 核心 RPC 是 `search_memos_secure`，它会结合查看者身份和 `unlocked_ids` 决定返回正文、锁定占位或直接过滤。

如果某个前端功能看起来“只差一个判断”，先确认它有没有破坏数据库层已经定义好的权限模型。

### 3. 页面展示和真实数据是两层问题

这个项目故意区分：

- “这条数据是否存在于当前结果集里”
- “这条数据是否可以展示正文”

因此：

- 地图和主列表允许显示锁定占位
- 搜索、标签聚合、导出、分享等场景不能把未解锁私密内容当成真实可见数据

改动列表、地图、时间轴、统计或导出时，要先判断自己改的是“展示层语义”还是“数据可见性语义”。

## 架构骨架

### 路由与页面

- `src/app/` 是 Next.js App Router 入口。
- 主界面在 `src/app/(main)/`，地图、画廊、标签、回收站等视图都围绕这套主路由组织。
- 当前实现优先依赖 Next.js 原生路由和 URL 参数，不再走早期自定义客户端路由心智。

### 数据读写分层

- `src/actions/` 是主要数据读写入口。
- `src/features/` 按业务域组织前端实现。
- `src/components/` 放跨 feature 复用的 UI 和布局组件。
- `src/context/` 承载全局状态。
- `supabase/migrations/` 是数据库结构、RLS、RPC 的权威来源。

理解功能时，优先从“页面 -> action -> 数据库约束”这条链路看，不要只盯组件树。

### Provider / Context 体系

统一 Provider 栈会注入：

- `UserProvider`
- `UnlockedMemosProvider`
- `PageDataCacheProvider`
- `StatsProvider`
- `LayoutProvider`
- `UIProvider`
- `TagsProvider`

这意味着用户身份、解锁状态、页面缓存、统计、布局和多选状态都已经有既定承载层。新增能力时，优先复用现有状态体系，不要再造一套平行状态流。

## 关键设计约束

### 解锁状态只能是页面内存态

- 不写 Cookie
- 不写 `localStorage`
- 不扩展成跨页面持久凭证

如果一个方案让“解锁状态”变成长期状态，它大概率就是违背设计的。

### 缓存必须认识到“解锁状态”

- `PageDataCache` 的缓存键不只是 URL 条件，还包括已解锁 Memo 集合。
- 同一页面在“未解锁”和“已解锁某条 Memo”下，结果必须被当作不同缓存。

任何缓存优化如果忽略这一点，都会把私密可见性做坏。

### URL 参数是页面真相的一部分

时间轴、热力图、筛选等页面能力应尽量回落到 URL 参数，以复用主列表查询和缓存层，而不是维护独立数据真相。

### 复杂逻辑优先抽到 hooks

这个仓库偏向把复杂交互从组件中抽离到 hooks。新增复杂交互时，优先延续这种组织方式，不要把状态机继续堆进页面或大组件。

## 团队约定

### 改动时优先复用，而不是新增分支

- 涉及私密 Memo 的能力，优先复用现有可见性辅助、Action 和 Context。
- 读操作优先复用现有查询层，不要在多处重复手写字段列表和权限判断。
- 数据库变更只通过新增迁移完成，不要修改历史迁移。

### 这些改动通常要一起更新

如果改动涉及以下任一内容，通常需要同步更新代码、测试和文档：

- 私密 Memo 权限模型
- RLS / RPC / migration
- 搜索、日期、标签查询口径
- 地图、时间轴、导出、分享中的可见性规则

### 文档分工保持清晰

- `README.md`：项目入口
- `docs/core/`：系统级规则与底层事实
- `docs/features/`：功能说明
- `docs/guide/`：开发流程、测试、规范
- `docs/interface/`：视觉与交互约束

优先更新已有文档，不要为同一主题不断新建平行文档。

## 优先阅读

如果任务涉及设计或系统行为，优先读：

- `docs/core/architecture.md`
- `docs/core/security.md`
- `docs/core/api.md`
- `docs/core/database.md`
- `supabase/README.md`

如果任务涉及交互和规范，再读：

- `docs/guide/testing.md`
- `docs/guide/standards.md`
- `docs/interface/system.md`
- `docs/interface/interactions.md`