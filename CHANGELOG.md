# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## Unreleased

## 1.2.0 (2026-07-15)

### CLI

- 补齐管理员的编辑、置顶、公开/私密切换、软删除、回收站恢复、永久删除和清空回收站命令。
- 私密发布和设为私密时，访问口令改为隐藏输入两次确认，并支持可选口令提示。
- 授权页左侧终端演示改为完整的真实命令旅程，覆盖登录、发布、搜索、编辑、删除、恢复和解锁。
- CLI 登录改为仅管理员可用；普通账号的授权请求会立即被拒绝，遗留 token 只能匿名浏览公开内容。

## 1.1.0 (2026-07-11)

### 发布重点

- 现在可以直接在终端使用 JustMemo，浏览器只需确认一次身份，不需要在终端输入密码。
- 新增 `justmemo login`、`logout` 和 `whoami`，登录状态会保存在当前设备。
- 新增 Memo 的发布、搜索和查看操作，终端可以完成日常记录管理。
- 查看私密 Memo 时可以临时输入口令解锁，口令不会被保存。
- CLI 授权页面新增真实终端操作演示，帮助第一次使用的用户快速了解操作流程。
- 优化回收站入口、移动端布局和授权页面在窄屏下的排版表现。

## 1.0.0 (2026-07-08)

### 发布重点

- 将 README 重做为品牌化项目入口，加入 Logo、首页截图和更清晰的项目定位。
- 升级 Next.js、Supabase、Tiptap、Vitest 与 Supabase CLI，清理 Dependabot 依赖告警。
- 新增 Supabase 加固迁移，收紧 RLS、函数权限和公开 schema 权限。

## 0.1.0 (2026-02-04)

### Features

- **admin:** 实现数据导出(JSON/CSV)功能 ([ee8343e](https://github.com/chiperman/JustBB/commit/ee8343eda1372e2619d867c9d917d49c619b12c3))
- **logic:** 实现全局搜索功能 (URL Params + Debounce) ([4ea99f9](https://github.com/chiperman/JustBB/commit/4ea99f9be00ee2585602276d3adf8a7b5696be34))
- **logic:** 实现基于 RPC 的标签统计与 TagCloud 过滤组件 ([a09405a](https://github.com/chiperman/JustBB/commit/a09405ae8bb6b29868877406f56b5621be33ee72))
- **logic:** 实现基于 RPC 的首屏数据获取与展示 ([ca616b5](https://github.com/chiperman/JustBB/commit/ca616b5a7c512edcd10d75e5e9be1d84e24c0f3c))
- **logic:** 实现数据库连接与受控创建 Memo 的 Server Action ([01ff264](https://github.com/chiperman/JustBB/commit/01ff26420b73072f482df3b5ed28e9fdcb5f4f9d))
- **logic:** 实现编辑器标签录入与后端解析逻辑 ([0845090](https://github.com/chiperman/JustBB/commit/0845090519bf41d88794706666cf12a49ab15ef2))
- **logic:** 实装编辑器发布逻辑并对接数据库 ([9396a64](https://github.com/chiperman/JustBB/commit/9396a646dbbe01e3e9d6c825774c37b07812642a))
- **share:** 实现海报生成与二维码分享功能 ([d4e3a6a](https://github.com/chiperman/JustBB/commit/d4e3a6ad9ca5107b2d2eced67617f54254f48253))
- **ui:** 实现主体与字体切换逻辑 ([a6d8620](https://github.com/chiperman/JustBB/commit/a6d86209472facf0efc074ad36f1cdf951013734))
- **ui:** 实现前端解锁交互与口令透传 ([a94c5c3](https://github.com/chiperman/JustBB/commit/a94c5c365ea32f505371150f3fbc861e3bbc5074))
- **ui:** 实现发布器支持设置隐私与置顶属性 ([5c3a57c](https://github.com/chiperman/JustBB/commit/5c3a57c6b93d0b9526fa6ba6e744bc856523457d))
- **ui:** 实现垃圾箱页面与已删除内容展示 ([467a77e](https://github.com/chiperman/JustBB/commit/467a77efd8c5451573b009742019309ec25311ee))
- **ui:** 实现核心 MemoCard 组件与模拟数据展示 ([2289138](https://github.com/chiperman/JustBB/commit/2289138a11079a7cd72e36ce3eb647721d60e352))
- **ui:** 实现正文 REGEX 解析与图片 URL 预览渲染 ([a97fae9](https://github.com/chiperman/JustBB/commit/a97fae97c03c565b4bed9fccab4e6c14dfdac74e))
- **ui:** 实现软删除逻辑与卡片操作菜单 ([3ba9eb3](https://github.com/chiperman/JustBB/commit/3ba9eb334381f16589663b5d2fd1cc42faeee7b5))
- **ui:** 实现隐私状态与置顶状态切换 ([9e5c823](https://github.com/chiperman/JustBB/commit/9e5c82301a8716d0765a7cd696e1efd1c8bf6307))
- **ui:** 搭建三栏式核心响应式布局 ([831b25c](https://github.com/chiperman/JustBB/commit/831b25cda91d942b0615c6a55246f9d15b8c159b))
- 为按钮添加加载状态并优化toast消息处理 ([966547a](https://github.com/chiperman/JustBB/commit/966547a4329381e8a06afdf9a39437bc04804603))
- 优化UI样式，包括标签图标颜色、标签容器边距和Toast消息样式 ([3124514](https://github.com/chiperman/JustBB/commit/3124514b7c0293bc130561fb7f06f3e783c39926))
- 优化手机端标签容器样式 ([aa1785b](https://github.com/chiperman/JustBB/commit/aa1785bf758bd52baa53d09d0c66d6ee8e1f4f6f))
- 新增 Toast 提示并优化 UI/UX ([65392b3](https://github.com/chiperman/JustBB/commit/65392b34f72053110aee84d9f5c9ca9a0189e0b3))
- 统一桌面和移动端标签视图 ([232dd3e](https://github.com/chiperman/JustBB/commit/232dd3e733adc6097c4dfb42beeb0ccf5cc1ee57))
- 翻译时增加模糊效果 ([f9e0a09](https://github.com/chiperman/JustBB/commit/f9e0a09a661384d7e1cf3a73288776ee88d08a94))

### Bug Fixes

- deepLX 翻译模块引入 ([52e085a](https://github.com/chiperman/JustBB/commit/52e085ae14b8f8f0e0707b5dfd5741b3df04a056))
- **ui:** 根据 PRD 将热力图迁移至左侧边栏顶部 ([5e999ea](https://github.com/chiperman/JustBB/commit/5e999eab8f525aa7f670616df21564e4671d0fbf))
- 修复 Toast 动画的进入和退出效果 ([360362a](https://github.com/chiperman/JustBB/commit/360362a345ad3ce973e94a897e31d696351caae7))
- 确保每次点击翻译按钮都有模糊效果 ([fcea194](https://github.com/chiperman/JustBB/commit/fcea19457a72340f1f0e684b04d9a66fa7f64ad2))
