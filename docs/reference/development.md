# JustMemo 开发参考

> 最后更新：2026-06-10
> 状态：当前开发流程参考

## 1. 作用

这份文档说明 JustMemo 的技术栈、目录结构、开发规则、提交规则和文档维护原则。测试命令和回归策略见 [测试参考](./testing.md)。

## 2. 技术栈

| 分类         | 技术                                                    |
| ------------ | ------------------------------------------------------- |
| 前端框架     | Next.js 16.1.6、React 19、TypeScript 5                  |
| 样式与动效   | Tailwind CSS 4、Framer Motion 12                        |
| 图标         | Hugeicons 1.1.5                                         |
| 编辑器       | Tiptap 3                                                |
| 地图         | Leaflet 1.9、react-leaflet 5                            |
| 后端         | Supabase 2                                              |
| 校验         | Zod 4                                                   |
| 私密口令哈希 | bcryptjs 3                                              |
| 日期处理     | date-fns 4                                              |
| 测试         | Vitest 4、React Testing Library                         |
| 工程工具     | ESLint 9、Husky 9、lint-staged 16、standard-version 9.5 |

## 3. 目录结构

| 目录            | 作用                                         |
| --------------- | -------------------------------------------- |
| `src/app/`      | App Router 页面与布局                        |
| `src/server/`   | 服务端逻辑，包含 `actions/` 和 `services/`   |
| `src/features/` | 按业务域组织的前端模块                       |
| `src/shared/`   | 共享 UI、layout、hooks、lib                  |
| `src/state/`    | 应用级全局状态                               |
| `src/lib/`      | 基础工具，例如环境变量校验和 Supabase client |
| `src/types/`    | 类型定义                                     |
| `supabase/`     | 本地 Supabase 配置、迁移和 seed              |
| `scripts/`      | 脚本型辅助文件                               |
| `docs/`         | 项目文档                                     |

## 4. 开发工作流

日常开发只需要记住：

```bash
npm run dev
```

提交、push、完整校验、发版和数据库迁移默认由 AI 按需执行。仓库保留较多 `package.json` 脚本，是为了让 AI 和维护流程有稳定入口，不要求人工日常记忆。

命令分层：

| 场景       | 命令                       | 说明                         |
| ---------- | -------------------------- | ---------------------------- |
| 日常启动   | `npm run dev`              | 启动本地 Supabase 和 Next.js |
| 远程库调试 | `npm run dev:remote`       | 使用 `.env.remote` 启动      |
| 格式化     | `npm run format`           | 自动修复格式                 |
| 提交前检查 | `npm run check`            | 构建和单元测试               |
| 集成测试   | `npm run test:integration` | 涉及数据库语义时使用         |
| 本地发版   | `npm run release`          | 仅发版时使用                 |
| 数据库维护 | `npm run db:reset`         | 重放本地迁移和 seed          |

复杂需求按以下顺序执行：

1. 明确问题边界、目标和依赖。
2. 先给方案，获得用户明确授权后再实现。
3. 定义验证标准，必要时先补测试。
4. 拆成可验证的小任务。
5. 按既有风格实现，保持改动克制。
6. 运行相关测试和构建校验。
7. 同步更新受影响文档。
8. 只有用户明确要求时才提交。

## 5. 代码质量规则

- 严禁随意使用 `any`；确需绕过时优先使用更窄类型，并说明原因。
- 报错日志必须包含上下文，例如 message、code、hint。
- 业务代码默认通过 `src/lib/env.ts` 的 Zod 校验访问环境变量。
- middleware、测试、构建阶段判断和框架边界允许局部直接访问 `process.env`，但需要保持范围小，并写清楚原因。
- 新增服务端密钥时，优先加入 `src/lib/env.ts`，避免在业务逻辑中散落读取。
- 复杂客户端逻辑优先抽成 hooks。
- 大型 UI 组件按职责拆成子组件。
- 读操作优先复用现有 query builder、actions 和可见性辅助逻辑。
- 数据库变更必须新增 migration，不要改写历史 migration。

## 6. 动画与性能

- 优先使用 `transform` 和 `opacity`。
- 避免对 `width`、`height`、`top`、`left`、`margin`、`padding` 做动画。
- Loading 状态应尽量保留原始占位，避免布局抖动。
- 交互反馈应短、稳定、可预期。
- 必须兼容 `prefers-reduced-motion`。
- 元素离开视口后应停止不必要的循环动画。

## 7. Git 规则

- 不主动创建新分支、提交、推送或执行破坏性 Git 操作，除非用户明确要求。
- 提交格式：`type(scope): subject`。
- Subject 使用中文，简洁说明变更。
- Body 优先说明为什么改，而不是重复改了什么。
- 提交前先检查 `git status`，避免混入无关改动。

## 8. 文档维护

当前长期文档结构：

```text
docs/
  README.md
  reference/
    architecture.md
    privacy-and-data.md
    product.md
    development.md
    testing.md
  interface/
    design.md
```

过程产物不进入 Git，并已通过 `.gitignore` 排除：

- `docs/reviews/`
- `docs/planning/`
- `docs/tracker/`
- `docs/generated/`

新增或修改文档时遵守：

- 优先扩展现有文档，不默认新建。
- 文件名使用小写 kebab-case，不带日期和版本号。
- `/docs` 下文档头部建议包含 `最后更新` 和 `状态`。
- `docs/README.md` 只做导航，不堆实现细节。
- 三个月后新开发者仍需要的信息才进入 Git。

## 9. 什么时候更新哪篇文档

| 变更类型                                 | 文档                                 |
| ---------------------------------------- | ------------------------------------ |
| 页面、Provider、缓存、Context、路由协同  | `docs/reference/architecture.md`     |
| 私密 Memo、RLS、RPC、API、数据库规则     | `docs/reference/privacy-and-data.md` |
| 时间轴、地图、画廊、导出、备份、内容体验 | `docs/reference/product.md`          |
| 技术栈、目录结构、开发规范、文档治理     | `docs/reference/development.md`      |
| 测试命令、测试分层、回归策略             | `docs/reference/testing.md`          |
| UI、视觉、交互一致性                     | `docs/interface/design.md`           |
