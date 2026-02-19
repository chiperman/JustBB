# JustMemo 安全与隐私架构

> 最后更新：2026-02-19 (优化：前端权限状态中心化)

## 1. 隐私策略
*   物理隔离方案: 采用服务端 Supabase RPC 校验方案，确保未授权内容物理级不返回。
*   搜索隔离: 私密内容对非授权用户在搜索模式下彻底隐身（不返回占位符）。
*   可见性控制: 默认 Public，支持 `is_private` 标记。

## 2. 解锁流程 (Unlock Flow)
1.  视觉屏蔽: 锁定内容通过 高斯模糊 (Gaussian Blur) 针对“占位文本”进行渲染，并展示 口令提示词 (Hint)。
2.  验证机制: 采用 Server Action + HttpOnly Cookie 实现 Hash 校验。
3. 会话保持与离线: 用户输入密码成功后，写入加密 Cookie。系统支持在 Session 内缓存已解密内容，确保用户在联网解锁后，短时间内离线仍可阅读已解锁的记录。

## 3. 操作安全 (Operations Safety)
*   二次确认机制: 当管理员尝试将私密记录转为公开发布时，系统弹出 Dialog 进行强制确认，防止因误操作导致敏感信息泄露。

## 3. 鉴权逻辑
*   管理员: 使用 Supabase Auth (Email/Login) 管理发布、编辑与删除权限。前端通过 `UserContext` 维护全局 `isAdmin` 状态，实现极致的 UI 响应性能，避免重复的 Server Action 调用。
*   写操作保护: 开启数据库 RLS (Row Level Security)，物理级限制 `UPDATE` 和 `DELETE` 操作仅限认证的管理员。
*   访客: 基于 RPC 函数的口令匹配获取内容。在非搜索模式下仅能看到加密占位。
*   脱敏同步 (Redacted Sync): 全量后台同步接口 (`getAllMemos`) 对私密记录执行物理脱敏（清除 `content` 和 `tags`），防止敏感数据明文驻留在 `localStorage`。
