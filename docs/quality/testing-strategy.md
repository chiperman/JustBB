# JustMemo 测试与质量保证方案 (Testing Strategy)

> 最后更新：2026-02-27 (工程化升级：同步自动化 CI 拦截与集成测试迁移)

## 1. 测试级别定义

### 1.1 单元测试 (Unit Tasks)
*   工具: Vitest + React Testing Library。
*   核心目标: 验证纯逻辑函数与无状态组件。
*   强制覆盖项:
    *   内容解析: `@编号` 引用解析、Markdown/HTML 转换逻辑 (`contentParser.test.ts`)。
    *   状态计算: 缓存命中逻辑与过期策略 (`memo-cache.test.ts`)。
    *   结构化数据: 验证 Tiptap JSON 格式的生成与解析稳定性。

### 1.2 接口与逻辑测试 (Integration Tests)
*   工具: Vitest + Supabase Local Development。
*   核心目标: 验证 Server Actions 与 RPC 函数。
*   工程迁移 (2026-02-27): 已移除 `scripts/` 下的手动测试脚本，全量迁入 Vitest 体系。
*   强制覆盖项:
    *   权限过滤: 调用 `searchMemosSecure` 确保无权者绝对拿不到私密内容（见 `security.test.ts`）。
    *   录入与查询: 校验日期的边缘匹配、置顶逻辑与软删除过滤（见 `fetchMemos.integrated.test.ts`）。

### 1.3 端到端测试 (E2E Tests)
*   工具: Playwright。
*   核心目标: 模拟用户真实路径。
*   关键 Path:
    1.  管理员流: 登录 -> 发布 -> 置顶 -> 切换隐私 -> 彻底删除。
    2.  访客解锁流: 进入主页（模糊） -> 输入正确密码 -> 看到解密内容。
    3.  引用联动流: 在编辑器输入 `@` -> 触发远端搜索 -> 滚动加载 -> 选中编号置入。

## 2. CI/CD 发布拦截 (Automation)
*   引擎: GitHub Actions (`ci.yml`)
*   拦截点: Push 或 Pull Request。
*   执行链:
    1.  ESLint 静态扫描
    2.  Vitest 纯逻辑单元测试 (排除 `*.integrated.test.ts` 以免在无 DB 环境下挂掉)
    3.  环境变量校验: 基于 Zod 执行运行时与构建时硬性校验拦截。
    4.  `next build` 全量编译校验。

## 3. 自主测试与验收清单 (Manual Checklist)
在每次 Push 前，建议手动确认以下视觉与交互点：
- [ ] 视觉稳定性: 字体切换（Serif/Sans）是否导致排版塌陷。
- [ ] 多端适配: 移动端下三栏布局是否正确转化为单栏。
- [ ] 离线表现: 断网时已解锁的内容是否仍可阅读。
- [ ] 性能指标: SPA 导航时缓存命中页面是否即时渲染（无骨架屏闪烁）。
