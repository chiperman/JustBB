# JustMemo 技术选型总览

> 最后更新：2026-05-06
> 状态：与当前 `package.json` 和仓库结构同步

## 1. 作用

这份文档用于快速说明：

- 项目依赖什么核心技术
- 当前技术栈大致如何分层
- 主要目录分别负责什么

## 2. 核心框架

| 技术       | 版本   | 说明                      |
| ---------- | ------ | ------------------------- |
| Next.js    | 16.1.6 | 应用框架，采用 App Router |
| React      | 19.x   | UI 渲染与状态组合         |
| TypeScript | 5.x    | 类型系统                  |

## 3. 前端与交互

| 技术          | 版本  | 说明           |
| ------------- | ----- | -------------- |
| Tailwind CSS  | 4.x   | 样式系统       |
| Framer Motion | 12.x  | 动画与过渡     |
| Hugeicons     | 1.1.5 | 统一图标库     |
| Tiptap        | 3.x   | 富文本编辑器   |
| next-themes   | 0.4.x | 主题切换       |
| Leaflet       | 1.9.x | 地图能力       |
| react-leaflet | 5.x   | React 地图封装 |

## 4. 后端与数据

| 技术     | 版本 | 说明                      |
| -------- | ---- | ------------------------- |
| Supabase | 2.x  | 数据库、Auth 与 BaaS 能力 |
| Zod      | 4.x  | 运行时校验                |
| bcryptjs | 3.x  | 私密口令哈希              |
| date-fns | 4.x  | 日期处理                  |

## 5. 测试与工程工具

| 技术             | 版本   | 说明           |
| ---------------- | ------ | -------------- |
| Vitest           | 4.x    | 单元与集成测试 |
| Playwright       | 1.58.x | E2E 测试       |
| ESLint           | 9.x    | 代码检查       |
| Husky            | 9.x    | Git Hook       |
| lint-staged      | 16.x   | 暂存区校验     |
| standard-version | 9.5.x  | 版本日志生成   |

## 6. 当前目录结构

### 根目录

- `README.md`：仓库主入口
- `docs/`：项目主文档库
- `scripts/`：少量脚本型辅助文件
- `supabase/`：本地 Supabase 配置、迁移和 seed

### `src/`

| 目录        | 作用                                                            |
| ----------- | --------------------------------------------------------------- |
| `app/`      | App Router 页面与布局                                           |
| `server/`   | 服务端逻辑：`actions/` (Server Actions), `services/` (外部集成) |
| `shared/`   | 共享基础设施：`ui/` (原子组件), `hooks/`, `lib/`                |
| `features/` | 按业务域组织的前端模块 (UI + Hooks)                             |
| `state/`    | 应用级全局状态 (Context)                                        |
| `lib/`      | 基础工具：`env.ts` (配置校验), `supabase.ts`                    |
| `types/`    | 类型定义                                                        |

## 7. 当前架构特征

- 路由基于 Next.js App Router
- 环境变量通过 `@/lib/env` 进行严格的运行时校验，并提供全局类型提示
- 页面交互依赖 Client Components 与 Context 组合
- 查询层由 Server Actions 和 Supabase 共同承载
- 私密 Memo 采用 owner-based 权限模型
- 地图、时间轴、标签与主列表共享同一套数据语义

## 8. 相关文档

- [业务逻辑架构](../core/architecture.md)
- [接口与数据访问](../core/api.md)
- [数据库设计](../core/database.md)
