# JustMemo 文档中心

> 最后更新：2026-05-06
> 状态：总入口

这份文档是 `/docs` 的统一导航页。

它只回答两件事：

- 文档按什么维度划分
- 你应该先读哪一份

具体规则、细节和边界请分别进入对应专题文档。

## 1. 推荐阅读顺序

如果你是第一次进入这个项目，建议按下面顺序阅读：

1. [文档体系与维护规范](./guide/documentation.md)
2. [业务逻辑架构](./core/architecture.md)
3. [私密 Memo 规则](./core/security.md)
4. [接口与数据访问](./core/api.md)
5. [数据库设计](./core/database.md)

如果你更关心页面和交互，再继续看：

- [功能模块总览](./features/features-guide.md)
- [设计系统](./interface/design.md)

## 2. 文档分区

### `core`

系统级事实与底层约束：

- [业务逻辑架构](./core/architecture.md)
- [接口与数据访问](./core/api.md)
- [数据库设计](./core/database.md)
- [私密 Memo 规则](./core/security.md)

### `features`

业务模块和页面能力：

- [功能模块总览](./features/features-guide.md)
- [时间轴与归档](./features/timeline.md)
- [地图功能](./features/map.md)
- [画廊功能](./features/gallery.md)
- [内容体验](./features/content-experience.md)
- [多选与批量操作](./features/selection.md)
- [Supabase 用量监控](./features/usage-monitoring.md)

### `interface`

视觉系统与交互规则：

- [设计系统](./interface/design.md)

### `guide`

开发、测试、技术栈与文档治理：

- [文档体系与维护规范](./guide/documentation.md)
- [工程化标准与开发规范](./guide/standards.md)
- [技术选型总览](./guide/tech-stack.md)
- [测试与质量保证方案](./guide/testing.md)

## 3. docs 之外的项目文档

这些文件不放在 `/docs`，但仍然属于项目文档的一部分：

- [仓库 README](../README.md)
- [变更日志](../CHANGELOG.md)
- [脚本目录说明](../scripts/README.md)
- [Supabase 本地开发说明](../supabase/README.md)

## 4. 使用原则

- `docs/README.md` 永远只做入口，不堆实现细节。
- 系统规则优先放进 `core`。
- 业务能力优先放进 `features`。
- 视觉和交互约束优先放进 `interface`。
- 流程、测试、技术栈和文档治理优先放进 `guide`。
