# JustMemo 测试与质量保证方案 (Testing Strategy)

> 最后更新：2026-02-19

## 1. 测试级别定义

### 1.1 单元测试 (Unit Tasks)
*   工具: Vitest + React Testing Library。
*   核心目标: 验证纯逻辑函数与无状态组件。
*   强制覆盖项:
    *   正文解析: `@编号` 引用解析、Markdown 转换逻辑。
    *   权限计算: 判断 `is_private` 与用户身份的各种组合结果。
    *   工具函数: 时间格式化、标签清洗算法、Hash 辅助函数。

### 1.2 接口与逻辑测试 (Integration Tests)
*   工具: Vitest + Supabase Local Development。
*   核心目标: 验证 Server Actions 与 RPC 函数。
*   强制覆盖项:
    *   权限过滤: 调用 `searchMemosSecure` 确保无权者绝对拿不到私密内容。
    *   录入校验: `createMemo` 对非法输入的拦截。

### 1.3 端到端测试 (E2E Tests)
*   工具: Playwright。
*   核心目标: 模拟用户真实路径。
*   关键 Path:
    1.  管理员流: 登录 -> 发布 -> 置顶 -> 切换隐私 -> 彻底删除。
    2.  访客解锁流: 进入主页（模糊） -> 输入正确密码 -> 看到解密内容。
    3.  引用联动流: 在 A 卡片引用 B -> 成功定位并显示预览。

## 2. 自主测试与验收清单 (Manual Checklist)
在每次 Push 前，需手动确认以下视觉与交互点：
- [ ] 视觉稳定性: 字体切换（Serif/Sans）是否导致排版塌陷。
- [ ] 多端适配: 移动端下三栏布局是否正确转化为单栏。
- [ ] 离线表现: 断网时已解锁的内容是否仍可阅读。
- [ ] 性能指标: SPA 导航时缓存命中页面是否即时渲染（无骨架屏闪烁）。
