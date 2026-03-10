# JustMemo 安全与隐私架构 (Security & Privacy)

> 最后更新：2026-03-10 (隐私深度脱敏与 AdminClient 安全规范)

## 1. 隐私策略
*   物理隔离方案: 采用服务端 Supabase RPC 校验方案，确保未授权内容物理级不返回。
*   搜索隔离: 私密内容对非授权用户在搜索模式下彻底隐身（不返回占位符）。
*   可见性控制: 默认 Public，支持 `is_private` 标记。
*   差异化可见性控制 (RPC 驱动):
    *   **主 Feed (Home)**: 仅在非搜索且非过滤的默认浏览模式下，允许未登录用户看到私密记录的锁定占位符。
    *   **搜索与过滤 (Search/Filter)**: 对未登录用户严格物理隐藏所有私密内容及其元数据（ID, 标签, 时间戳等），防止通过元数据泄露隐私。

## 2. 解锁流程 (Unlock Flow)
1.  视觉屏蔽: 锁定内容通过 高斯模糊 (Gaussian Blur) 针对“占位文本”进行渲染，并展示 口令提示词 (Hint)。
2.  验证机制: 
    *   **Server Action**: 调用 `verifyUnlockCode`。
    *   **权限提升**: 内部临时调用 `getAdminClient()` (使用 `service_role` 密钥) 以绕过 RLS 策略读取 `access_code_hash`。
    *   **哈希比对**: 使用 `bcrypt.compareSync` 进行安全比对，确保哈希不离开服务端环境。
3. 会话保持: 验证成功后设置 HttpOnly Cookie。系统支持在 Session 内缓存已解密内容。

## 3. 操作安全 (Operations Safety)
*   二次确认机制: 当管理员尝试将私密记录转为公开发布时，系统弹出 Dialog 进行强制确认，防止误操作。
*   **加密一致性**: 应用层 (`bcryptjs`) 与数据库层 (`pgcrypto`) 统一采用 `$2a$` 哈希标准，确保前后端校验逻辑无缝衔接。

## 4. 鉴权逻辑 (Authentication)
*   管理员: 使用 Supabase Auth 维护发布、编辑与删除权限。
*   **服务端校验 (Zod Protection)**: 所有的 Server Actions 均在 `src/lib/*/schemas.ts` 中定义了严格的 Zod 校验模式。
*   写操作保护: 开启数据库 RLS (Row Level Security)，物理级限制 `UPDATE` 和 `DELETE` 操作仅限认证的管理员。
*   按需脱敏 (Just-in-Time Redaction): 
    *   **完全锁定**: 在搜索/过滤场景下，私密记录对匿名用户执行“物理抹除”（不返回任何数据行）。
    *   **占位锁定**: 在主 Feed 下，仅返回 ID、日期（时分脱敏为 `**:**`）和 `is_locked: true` 标记。正文、标签及字数统计（设为 `0`）由数据库 RPC 层执行脱敏。
