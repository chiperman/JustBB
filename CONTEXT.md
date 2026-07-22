# JustMemo 项目上下文

> 本文件用于记录项目的稳定背景、术语和已经确认的产品决策。当前文件根据此前讨论恢复；实现细节仍以代码、数据库 migration 和测试为准。

## 1. 项目定位

- 产品名称：JustMemo。
- 当前仓库目录仍为 `JustBB`。
- 这是一个基于 Next.js App Router、React、TypeScript 和 Supabase 的私密 Memo 系统。
- 核心目标是长期个人记录、按条保护私密内容，以及从网页和 Terminal 快速发布、搜索和查看记录；不是公开社交产品。

## 2. Memo 与隐私模型

- Memo 的作者可以直接查看自己的内容。
- 非作者不能因为登录就自动看到私密正文；必须使用该 Memo 自己的访问口令逐条解锁。
- 解锁状态只存在当前页面或当前 CLI 进程内存中，不写入 Cookie、`localStorage`、URL 或其他跨页面凭证。
- 数据库权限、RLS、RPC 和服务端 action 是权限真相，前端条件判断不能扩大可见范围。
- `search_memos_secure` 是主要可见性入口：返回公开正文、锁定占位，或完全不返回内容。
- 锁定正文不能被搜索、标签聚合、导出、分享或 AI 摘要消费。
- 未登录用户和普通用户可以搜索、查看公开 Memo；普通用户不能发布、编辑、删除、恢复或查看回收站。
- 发布、编辑、删除、恢复、置顶以及设置公开/私密等管理操作只开放给管理员/所有者角色。

## 3. 编辑器与内容规则

- CLI 输入正文是纯文本，不要求用户编写 Markdown；CLI 不做 Markdown 图片语法解析。
- 网页编辑器保留现有内容语法和渲染能力，内容解析层会识别定位、图片、标签、链接、Mention 等 token。不能因为 CLI 简化输入而改变网页编辑器的既有行为。
- 标签直接写在正文中，例如 `#manual`；网页和 CLI 都沿用同一套 inline `#标签` 识别逻辑，不单独要求输入 tag 参数。
- 普通链接保留在正文中。
- 图片可以通过网页图片控件上传，也可以直接在正文中粘贴图片 URL。
- 上传图片会存入 R2，并把图片地址写入 Memo 的 `images` 字段。
- 粘贴可识别的图片 URL 时，发布前会从正文中提取到图片模式，最终地址也进入 `images`；普通链接仍保留为正文链接。
- 图片链接只需要以 URL 形式展示，不在 CLI 中渲染。当前 CLI 发布前置解析识别 `jpg`、`jpeg`、`png`、`gif`、`webp`；新增格式时要同步更新网页解析、CLI 解析和测试。

## 4. CLI 的目标与边界

CLI 是独立的 npm 包 `justmemo-cli`，命令名为 `justmemo`。它通过 JustMemo HTTP API 工作：

- CLI 不直接连接 Supabase。
- CLI 不使用 Server Action。
- CLI 不携带 service-role key。
- API 边界为 `/api/cli/v1`。
- 生产 API 地址内置在 CLI；`JUSTMEMO_API_URL` 仅用于开发和测试覆盖。
- CLI 发布包位于 `cli/`，与根项目的 Web 发布流程分开。
- CLI 的命令、帮助、提示、成功和错误输出统一使用英文；网页的标题、说明、按钮等面向人的界面文案使用中文，命令字符串保持英文；其中的 `REAL CLI OUTPUT` 终端演示必须逐行展示英文 CLI 输出。

主要使用场景是管理员在任意电脑登录后快速发布内容，也可以搜索和查看公开 Memo。CLI 登录仅限管理员：普通账号在浏览器登录后会被拒绝授权，且不会获得 CLI 会话；普通用户或未登录用户无需登录即可浏览公开内容，但不能通过 CLI 绕过 Web 的权限模型。

## 5. CLI 登录与授权

采用一次性设备授权，不要求用户在 Terminal 输入账号密码：

1. 用户执行 `justmemo login`。
2. CLI 创建一次性设备授权请求并显示 `/cli/authorize` 链接；用户按 Enter 后才尝试打开本机浏览器。
3. 用户可在当前电脑或手机浏览器打开授权链接，登录网页账号并确认设备。
4. CLI 同时显示 6 位字母+数字授权码并轮询授权状态。
5. 授权成功后 CLI 自动保存会话并继续工作。

普通账号的授权请求会被标记为 `denied`，终端立即显示管理员限定错误并退出；历史普通账号本地会话在刷新被拒后会删除本地凭证，公开 `search`/`show` 自动退回匿名访问。
即使普通账号保留了未过期的历史 bearer token，公开读取接口也会主动按匿名身份查询，不能借此扩大 Memo 可见范围。

CLI 会先输出授权 URL 和六码，再提示 `Press ENTER to open in your browser...`；只有用户按下 Enter 才尝试打开本机浏览器。

授权码规则：

- 只使用大写字母和数字。
- 排除容易混淆的 `0/O`、`1/I`。
- 当前字符集为 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`。
- 有效期 10 分钟，只能使用一次。

会话规则：

- 服务端保存加密后的 CLI 会话。
- 本地会话暂存于 `~/.config/justmemo/session.json`，权限为 `0600`。
- 后续可以再接入操作系统 Keychain，但不能把 token 写入仓库或打印到终端。

授权页面：

- `/cli/authorize`：CLI 使用指南页；展示常用命令和终端操作预览，并链接到完整命令页。
- `/cli/authorize?request=<uuid>`：具体设备授权页。
- `/cli/commands`：完整命令参考页，区分访客/普通账号与管理员的可用命令。
- 页面应同时适配桌面端和移动端；移动端打开链接也能完成授权。
- 视觉语言沿用 JustMemo 的 Humanistic Flat 风格。左侧展示 CLI 使用路径和终端步骤，右侧展示授权卡片；授权码使用单字符格子，不显示 `000000` 等误导性占位值。

## 6. 当前 CLI 命令约定

命令顺序统一为 `justmemo <command> <value> [options]`，不混用 `show 123 --delete` 与 `trash --restore 123` 这类不同顺序。

```text
justmemo login
justmemo logout
justmemo whoami

justmemo publish [正文...] [--private] [--pin] [--json]
justmemo search [关键词...] [--tag 标签] [--num 编号] [--limit 数量] [--page 页码] [--json]
justmemo show <编号> [--unlock|--edit|--pin|--unpin|--private|--public|--delete] [--json]
justmemo edit <编号> [--json]
justmemo trash [<编号>] [--restore|--purge|--empty] [--yes] [--limit 数量] [--page 页码] [--json]
```

- `publish` 不强制拆分正文、tag、链接和图片；输入的纯文本直接发布，inline `#tag` 由服务端/既有内容逻辑识别。
- `publish` 不带正文时进入终端编辑器；支持 `--private` 和 `--pin`。
- 私密发布或设为私密时，访问口令需隐藏输入两次确认；口令提示可留空。
- `search` 默认最多查看 20 条，支持关键词、tag、Memo 编号、分页和 JSON 输出。
- `show` 只需要 Memo 编号；私密 Memo 使用 `--unlock`，提示输入该 Memo 的口令，口令只在当前 CLI 进程中使用。
- `--json` 用于脚本和自动化场景，输出原始结构化响应，不改变普通用户的文本展示。
- `edit` 和 `show <编号> --edit` 都通过系统编辑器编辑正文与图片 URL 分区；保存后整体更新。
- `--pin`、`--unpin`、`--private`、`--public` 与 `--delete` 都以 `show <编号> [操作参数]` 的统一顺序执行。
- `trash` 查看回收站；`trash <编号>` 查看单条；`--restore` 恢复；`--purge` 与 `--empty` 默认确认，自动化时使用 `--yes`。

## 7. Web 与 CLI 的权限一致性

- CLI 只是另一个客户端，不能成为权限绕过入口。
- 普通用户不能因为登录 CLI 而发布或管理 Memo，也不能看到不属于自己的回收站。
- 未登录用户可以搜索和查看公开 Memo；私密 Memo 仍必须按 Memo 口令逐条解锁。
- Web 端回收站入口和数据查询也必须按角色/所有者收紧，不能仅靠隐藏按钮实现权限控制。

## 8. 开发与验证约定

- 页面入口在 `src/app/`，服务端读写在 `src/server/`，业务 UI 在 `src/features/`，数据库权威来源在 `supabase/migrations/`。
- 涉及权限、搜索、私密内容、回收站或 CLI API 时，沿着 `page -> action/API -> RPC/RLS -> tests` 检查完整链路。
- 数据库变更只能新增 migration，不修改历史 migration。
- CLI 的构建、测试和打包应使用 `cli/` 自己的脚本；打包前使用：

  ```bash
  cd cli && npm pack --dry-run
  ```

- 根项目的测试应覆盖 CLI 相关测试；正式发布前还要单独验证 CLI build、pack 和发布包内容。

## 9. 当前实现状态

- CLI 已具备设备登录、发布、搜索、查看、解锁、登出和身份查看的基础实现。
- Web 授权页同时承担指南页和具体授权页两种状态。
- 发布内容支持正文、inline `#tag`、普通链接以及图片链接；图片 URL 应保留可追踪的 `images` 数据。
- CLI 已支持编辑、状态切换、软删除和完整回收站操作；所有管理操作均要求管理员且仅限自己的 Memo。

## 10. Web 页面与产品能力地图

| 页面/能力        | 作用                             | 关键约束                                            |
| ---------------- | -------------------------------- | --------------------------------------------------- |
| `/`              | 首页时间流、编辑器、热力图和筛选 | 公开/锁定占位遵守安全查询                           |
| `/map`           | 带定位 Memo 的地图浏览           | 私密 Memo 可显示锁定图钉，不显示正文                |
| `/gallery`       | 图片优先浏览                     | 未解锁私密图片只能使用安全占位                      |
| `/tags`          | 标签聚合与筛选                   | 不能通过聚合结果泄露私密标签                        |
| `/trash`         | 操作者自己的回收站               | 非操作者不能仅靠改 URL 进入或读取                   |
| `/share/[id]`    | 单条公开 Memo 分享               | 只允许真实公开 Memo，私密或无效 id 返回 404/noindex |
| `/cli/authorize` | CLI 使用指南和设备授权           | 无 request 是指南页，有 request 是授权流程          |
| `/cli/commands`  | CLI 完整命令参考                 | 区分访客/普通账号与管理员权限                       |

- **公开分享页**：`/share/[id]` 的访客阅读页面；只消费真实公开 Memo，保持 404/noindex 与可见性规则。
- **分享海报**：管理员从单条 Memo 生成的图片预览与导出界面；可选择主题并独立显示或隐藏品牌、日期和二维码，不等同于公开分享页。
- **海报内容规则**：分享海报保留完整正文，最多渲染一张 Memo 图片；按正文出现顺序取首图，正文没有内嵌图片时才回退到附件列表首图。
- **海报临时资源**：为生成单次分享海报而获取的公开外链图片、链接封面或 favicon；仅在导出请求期间提供，不写入 R2、不改写 Memo 原始内容，且必须经受限校验。
- **海报交付操作**：支持图片剪贴板的浏览器复制生成的 PNG；不支持或权限被拒绝时，明确引导用户使用“保存海报”，不自动触发下载。

首页的时间状态主要通过 URL 表达：

- `?date=YYYY-MM-DD`
- `?year=YYYY`
- `?year=YYYY&month=MM`

有日期边界时，列表只在对应日期、月份或年份范围内分页，不应滚出筛选区间。无筛选时使用全局时间倒序信息流。

网页目前还包含设置、导入、导出、用量统计、图片上传和多选批量操作等能力；它们都必须复用既有权限和查询入口，不能另建一套可见性判断。

## 11. Web 架构与状态边界

Next.js App Router 负责路由和页面；Server Components 负责用户与轻量首屏数据；Client Components 负责交互、缓存复用和局部刷新；Supabase 负责 Auth、Postgres、RLS 和 RPC。

主要 Provider：

- `UserProvider`：当前用户。
- `UnlockedMemosProvider`：当前页面内存中的已解锁 Memo id。
- `PageDataCacheProvider`：按 URL 条件、查看者身份和解锁集合隔离缓存。
- `StatsProvider` / `TagsProvider`：统计和标签数据。
- `LayoutProvider` / `UIProvider`：布局转场、多选和批量操作状态。
- `ExportProvider` / `ConfirmProvider`：导出流程和全局确认框。

缓存规则：

- `PageDataCache` 的 key 必须区分 URL 参数、当前用户和已解锁 Memo 集合。
- `memoCache` 只负责轻量索引、发布后的即时同步和页面预热，不是权限来源，也不是私密正文的长期存储层。
- 搜索、标签、时间轴、地图和画廊如果改变可见性或筛选条件，必须回到统一查询入口，不能只在前端过滤一份可能已经脱敏的数据。

## 12. 数据库与服务端边界

`public.memos` 的核心字段：

| 字段                                    | 说明                                 |
| --------------------------------------- | ------------------------------------ |
| `id`                                    | UUID 主键，内部使用                  |
| `memo_number`                           | 面向用户的稳定展示编号；CLI 只暴露它 |
| `owner_id`                              | 作者 id，owner-based 权限基础        |
| `content`                               | 正文                                 |
| `tags`                                  | 解析出的标签数组                     |
| `locations`                             | 定位 JSONB                           |
| `images`                                | 图片 URL 数组                        |
| `image_metadata`                        | 图片尺寸等元数据                     |
| `access_code_hash` / `access_code_hint` | 私密口令哈希和提示                   |
| `is_private`                            | 公开/私密                            |
| `is_pinned` / `pinned_at`               | 置顶状态                             |
| `deleted_at`                            | 软删除时间                           |
| `created_at` / `updated_at`             | 时间戳                               |
| `word_count`                            | 正文长度统计                         |

统一 action/API 响应形态为：

```ts
{ success: boolean; data?: T; error?: string | null }
```

核心服务端入口包括：

- 查询：`getMemos`、`getMemoByNumber`、`getMemosWithLocations`、`getMemoStats`、`getTimelineStats`、`getAllTags`。
- 写入：`createMemo`、`updateMemoContent`、`updateMemoState`、批量标签和批量状态操作。
- 隐私：`verifyUnlockCode` 只验证一条 Memo；成功后的正文仍只能存在当前页面内存。
- 回收站：软删除、恢复、永久删除、清空和批量操作都要求操作者权限，并按 `owner_id` 限定数据。
- 导出：只导出当前作者自己的 Memo，支持 Markdown 和 JSON 两种网页导出路径。

## 13. 图片、R2 与内容解析

网页图片有两条入口，但最终都服务于同一套 Memo 图片数据：

1. 点击图片控件选择本地文件：前端上传到 R2，得到 URL 和尺寸元数据，再在发布时写入 `images` / `image_metadata`。
2. 在编辑器中粘贴图片链接：编辑器识别为图片内容，发布时将图片 URL 归入 `images`；普通网页链接仍作为正文保留。

R2 的配置保存在用户自己的配置记录中，服务端通过 S3-compatible API 操作；浏览器不能直接拿 service-role 或 R2 secret。永久删除 Memo 时，需要同时清理其关联 R2 图片；软删除和恢复不应误删图片。

网页解析优先级大致为：代码块、定位、Markdown 图片、Mention/Ref、标签、邮箱、原始图片 URL、标记链接、普通链接。CLI v1 则保持更简单：正文原样发送，独立或正文中的图片直链提取到 `images`，其余链接留在正文中。

定位语法 `📍[名称](纬度, 经度)` 是网页地图能力的一部分。当前 CLI v1 不单独提供定位参数；以后如果开放，必须复用服务端解析规则，而不是在 CLI 中发明另一种格式。

## 14. CLI 当前 API 与实现状态

当前 CLI 的默认 API 地址是 `https://just-memo.vercel.app`，开发/测试可用 `JUSTMEMO_API_URL` 覆盖。当前 HTTP 入口为：

```text
POST /api/cli/v1/auth/device
POST /api/cli/v1/auth/device/approve
POST /api/cli/v1/auth/device/deny
POST /api/cli/v1/auth/device/poll
POST /api/cli/v1/auth/refresh
GET  /api/cli/v1/auth/me

GET  /api/cli/v1/memos?q=&tag=&num=&limit=&page=
GET  /api/cli/v1/memos/:memoNumber
POST /api/cli/v1/memos/:memoNumber/unlock
POST /api/cli/v1/memos/publish
PATCH /api/cli/v1/memos/:memoNumber
DELETE /api/cli/v1/memos/:memoNumber
GET  /api/cli/v1/trash
DELETE /api/cli/v1/trash
GET  /api/cli/v1/trash/:memoNumber
POST /api/cli/v1/trash/:memoNumber/restore
DELETE /api/cli/v1/trash/:memoNumber
```

API 使用 Supabase access token/refresh token，但 token 只由 CLI 通过 HTTP Bearer 发送；服务端 `getCliClient` 负责把请求绑定到当前用户。发布接口再次检查登录状态和 `app_metadata.role === "admin"`，不能只信 CLI 前端的菜单。

CLI 当前实际已经支持：

- `login`、`logout`、`whoami`。
- `publish`，包括正文、图片直链、`--private`、`--pin`、私密口令和 `--json`。
- `search`，默认 20 条，支持关键词、`--tag`、`--num`、`--limit`、`--page` 和 `--json`。
- `show`，按 Memo 编号查看；`--unlock` 临时输入单条口令；图片只打印原始 URL。
- `edit` 与 `show --edit`，使用系统编辑器更新正文及图片 URL。
- `show` 的置顶、私密、公开和软删除操作，以及 `trash` 的查看、恢复、永久删除和清空。
- 未登录搜索/查看公开 Memo，以及查看私密锁定状态和口令提示。

## 15. 设备授权安全细节

- CLI 设备授权请求写入 `cli_device_sessions`。
- 数据库存储授权码的 SHA-256 hash，不保存明文授权码。
- 授权码通过浏览器页面输入，不能写进 URL；URL 只携带 request UUID。
- 授权成功后，服务端把 access/refresh token 以 AES-256-GCM 加密后临时存入设备会话。
- CLI poll 领取 token 后，设备会话从 `approved` 变为 `consumed`，防止重复领取。
- 设备授权页面必须先验证网页登录态；未登录时提供登录入口，登录后返回原授权请求。
- request 过期、已消费、code 不匹配和重复领取都必须是明确错误状态，不泄露 token 或私密内容。

## 16. 本地开发、数据库和环境

日常启动：

```bash
cp .env.example .env.local
npm install
npm run dev
```

`npm run dev` 会先通过 `scripts/dev-setup.sh` 检查/启动本地 Supabase，再启动 Next.js `3000` 端口。远程数据库开发使用 `npm run dev:remote`，不要把远程密钥写入 Git。

数据库工作流：

```bash
npx supabase status
npm run db:reset
npm run types:generate
npm run test:integration
npx supabase db push --linked
```

新增数据库逻辑必须创建新的 migration，不能修改已进入历史的 migration。CLI 授权依赖 `20260711143948_add_cli_device_sessions.sql`；管理员读取自己回收站的 RLS policy 对应 `20260711193634_allow_admin_owned_trash_reads.sql`，已应用到生产。

生产数据库仍保留一段早于本仓库的 migration history；因此 `supabase db push --linked` 会因旧历史不一致而拒绝执行。后续整理历史前，必须先导出并核对生产 schema，不能照 CLI 建议批量 repair。

## 17. 测试、发布与已知陷阱

验证分层：

- 文档-only 改动：检查 Markdown 路径和链接。
- 普通代码改动：`npm run check`，即 build + 主测试。
- RLS、数据库、隐私、搜索和导出：额外运行 `npm run test:integration`。
- CLI：`npm run check:cli`，包括 CLI build、CLI tests 和正确的 npm pack 检查。

发布边界：

- 根 Web 包是私有包 `just-memo`，根项目版本与 CLI 版本独立。
- CLI 是公开 npm 包 `justmemo-cli`，版本在 `cli/package.json` 中维护。
- 根项目已有 `npm run release`（standard-version）；它不自动代替 CLI 的版本和 npm 发布流程。
- 检查 CLI 包必须进入子目录执行 `cd cli && npm pack --dry-run`；不要使用容易误打包根项目的 `npm pack --prefix cli`。
- `.github/workflows/ci.yml` 运行 Web build、主测试和 `npm run check:cli`；它会验证 CLI build、测试与打包预览，但不会自动发布 npm。
- CI 当前监听 `main` 的 push 与 pull request。
- 生产部署通过 GitHub 主分支触发；不要使用 Vercel CLI 直接部署生产环境。

## 18. 设计与交互约定

- 视觉方向是 Humanistic Flat：安静、纸张感、留白、轻动效和明确的信息层级。
- 不为了填空白而堆装饰；授权页左侧的终端步骤、命令轨迹和轻量信号效果必须服务于“用户知道下一步做什么”。
- 授权码使用 6 个独立字符格；只显示真实授权码，不用 `000000` 作为占位。
- 重要交互要兼容 `prefers-reduced-motion`，避免通过 width/height/top/left 等触发明显布局抖动的动画。
- 键盘快捷键统一使用 Cmd/Ctrl 修饰键体系；不要未经确认引入 Vim 风格的 `g t` 等序列快捷键。

## 19. 已确认但暂不做的事情

- 不在 CLI 中实现账号密码登录。
- 不让 CLI 直接连接 Supabase。
- 不把图片下载到 CLI 或在 Terminal 中渲染图片；只展示原始 URL。
- 不要求用户为 tag 单独输入参数；正文中的 `#tag` 是主路径。
- 不把 Markdown 作为 CLI v1 输入要求。
- 不做团队协作、普通用户发布、固定 API key、service-role token、`justmemo://` 协议、独立二进制或 Homebrew 安装器。

## 20. 文档真相优先级

当本文件与实现不一致时，按以下顺序确认：

1. 数据库 migration、RLS、RPC 和安全测试。
2. 当前服务端 API/action 与对应测试。
3. 当前 CLI 源码、`cli/README.md` 和 CLI 测试。
4. `docs/reference/` 中的长期文档。
5. 本文件中的历史决策和规划。

本文件用于帮助新会话快速恢复上下文，不替代代码和测试。实现发生变化后，应同步更新本文件中“当前实际”和“规划”两类内容，避免把讨论稿写成已实现功能。
