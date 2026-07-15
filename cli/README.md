# justmemo-cli

JustMemo 的终端客户端。

## 当前能力

```bash
justmemo login
justmemo whoami
justmemo logout
justmemo publish 今天的记录 #日记
justmemo search
justmemo search 工作 旅行 --tag 旅行 --page 2
justmemo show 123
justmemo show 123 --unlock
justmemo edit 123
justmemo show 123 --pin
justmemo show 123 --unpin
justmemo show 123 --private
justmemo show 123 --public
justmemo show 123 --delete
justmemo trash
justmemo trash 123 --restore
justmemo trash 123 --purge
justmemo trash --empty
```

未登录也可以搜索和查看公开 Memo；CLI 登录仅限管理员，管理员可发布和管理自己的 Memo。`search` 与 `trash` 默认显示第 1 页的 20 条结果，可通过 `--limit`（1-100）和 `--page`（1-10000）调整。私密 Memo 只会显示锁定状态和口令提示；使用 `--unlock` 时，口令只在当前命令中使用，不会保存。

`publish` 不加正文时会优先读取 stdin，否则打开 `$VISUAL` 或 `$EDITOR`。正文中任意位置的 `.jpg/.jpeg/.png/.gif/.webp` 链接都会进入图片字段，其他链接保留在正文中。`edit` 会在系统编辑器中同时展示正文与图片 URL。

私密发布或把已有 Memo 改为私密时，CLI 会隐藏输入访问口令两次，并可填写口令提示。`--purge` 和 `--empty` 不可恢复，默认要求确认；自动化时使用 `--yes`。

开发环境可以通过 `JUSTMEMO_API_URL` 覆盖 API 地址，普通安装不需要配置地址。

## 安装

当前包名为 `justmemo-cli`，安装后使用 `justmemo` 命令：

```bash
npm install -g justmemo-cli
```

CLI 要求 Node.js 20 或更高版本。

## 本地开发

在仓库根目录执行：

```bash
npm run cli:build
npm run cli:test
npm run cli:pack
```

`cli:pack` 只检查 npm 发布包内容，不会发布到 npm。

## 当前版本

当前版本为 `0.2.1`。

## 发布状态

本目录是独立 npm 包，发布时单独维护版本号和变更记录。CLI 不直接访问 Supabase，普通安装也不需要配置 API 地址。
