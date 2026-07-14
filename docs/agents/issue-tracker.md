# Issue Tracker：GitHub

本仓库的需求说明和待办通过 GitHub Issues 管理，统一使用 `gh` CLI 操作。

## 常用操作

- 创建：`gh issue create --title "..." --body "..."`
- 查看：`gh issue view <编号> --comments`
- 列出：`gh issue list --state open`
- 评论：`gh issue comment <编号> --body "..."`
- 增删标签：`gh issue edit <编号> --add-label "..."` / `--remove-label "..."`
- 关闭：`gh issue close <编号> --comment "..."`

在本仓库内执行时，`gh` 会根据 Git remote 自动识别 `chiperman/JustBB`。

## PR 是否进入分诊队列

否。PR 不作为需求或缺陷的分诊入口。

## 技能约定

当技能要求“发布到 issue tracker”时，创建 GitHub Issue。
当技能要求“获取相关 ticket”时，执行 `gh issue view <编号> --comments`。
