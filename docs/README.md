# JustMemo 文档中心

> 最后更新：2026-07-11
> 状态：总入口

这份文档是 `/docs` 的统一导航页。

它只回答两件事：

- 文档按什么维度划分
- 你应该先读哪一份

具体规则、细节和边界请分别进入对应专题文档。

## 1. 推荐阅读顺序

如果你是第一次进入这个项目，建议按下面顺序阅读：

1. [架构参考](./reference/architecture.md)
2. [数据与隐私参考](./reference/privacy-and-data.md)
3. [产品能力参考](./reference/product.md)
4. [开发参考](./reference/development.md)
5. [测试参考](./reference/testing.md)

如果你更关心页面和交互，再继续看：

- [设计系统](./interface/design.md)
- [Vercel Geist 深色参考](./interface/vercel-design-dark.md)

如果你要使用 CLI，再阅读：

- [CLI 命令说明](../cli/README.md)
- [架构参考](./reference/architecture.md)
- [数据与隐私参考](./reference/privacy-and-data.md)

## 2. 文档分区

### `reference`

长期项目参考：

- [架构参考](./reference/architecture.md)
- [数据与隐私参考](./reference/privacy-and-data.md)
- [产品能力参考](./reference/product.md)
- [开发参考](./reference/development.md)
- [测试参考](./reference/testing.md)

### `interface`

视觉系统与交互规则：

- [设计系统](./interface/design.md)
- [Vercel Geist 深色参考](./interface/vercel-design-dark.md)

## 3. docs 之外的项目文档

这些文件不放在 `/docs`，但仍然属于项目文档的一部分：

- [仓库 README](../README.md)
- [变更日志](../CHANGELOG.md)
- [脚本目录说明](../scripts/README.md)
- [Supabase 本地开发说明](../supabase/README.md)

## 4. 使用原则

- `docs/README.md` 永远只做入口，不堆实现细节。
- 架构、数据、产品、开发和测试参考优先放进 `reference`。
- 视觉和交互约束优先放进 `interface`。
- 过程产物不进入 Git，统一放入 `.gitignore` 已排除的目录。
