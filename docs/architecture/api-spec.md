# JustMemo 接口设计规范 (API Spec)

> 最后更新：2026-03-10 (全面引入 Zod 校验与统一 DAL 查询层)

## 1. 通用响应契约
所有接口遵循以下统一返回格式：
```ts
{
  success: boolean;    // 操作是否成功
  data?: T;           // 成功时返回的数据
  error?: string;      // 失败时的具体错误描述
}
```

## 2. Server Actions (Mutations)

### 2.1 鉴权系列 (`auth.ts`)
*   **Actions**: `login`, `signup`, `verifyOtp`, `updatePassword`
*   **校验**: 强制通过 `src/lib/auth/schemas.ts` 中的 Zod 模式校验。
*   **安全**: 统一错误处理，避免在前端暴露敏感的数据库或 Auth 引擎错误细节。

### 2.2 笔记操作系列 (`mutate.ts`)
*   **Actions**: `createMemo`, `updateMemoContent`, `updateMemoState`, `batchAddTagsToMemos`, `verifyUnlockCode`
*   **校验**: 经过 `src/lib/memos/schemas.ts` 强校验。
*   **特性**: 
    *   `createMemo/updateMemoContent`: 自动触发标签解析、定位提取及字数统计。
    *   `verifyUnlockCode`: 验证私密笔记口令，内部通过 `AdminClient` 绕过 RLS 校验哈希，成功后设置 HttpOnly Cookie。

### 2.3 回收站系列 (`trash.ts`)
*   **Actions**: `deleteMemo`, `restoreMemo`, `permanentDeleteMemo`, `emptyTrash`
*   **权限**: 仅限管理员。

## 3. 读操作 (Queries - 统一 DAL 架构)

为了保证查询字段的一致性与安全性，所有读操作均应通过 `src/lib/memos/query-builder.ts` 构建。

### 3.1 核心分页查询 (`query.ts`)
*   **`getMemos`**: RPC 驱动的高性能安全分页查询。
    *   **参数**: 支持 `query`, `tag`, `num` (精确匹配), `date`, `year`, `month`, `sort`, `before_date`, `after_date`, `excludePinned`。
    *   **安全**: RPC 内部自动处理 RLS 补丁，确保私密笔记元数据对匿名用户不可见。
*   **`searchMemosForMention`**: 为编辑器设计的增量搜索接口。
    *   **优化**: 自动识别纯数字输入并利用 RPC 的 `num` 过滤参数进行精确匹配，显著提升 Mention 搜索性能。

### 3.2 聚合与归档
*   **`getGalleryMemos`**: 自动应用 `withImages` 过滤器。
*   **`getArchivedMemos`**: 按年月进行物理日期范围过滤。
*   **`getMemosWithLocations`**: 自动应用 `withLocations` 过滤器，供地图组件使用。

## 4. 统计与辅助 (Stats)

### 4.1 业务统计
*   **`getMemoStats`**: 获取全量热力图及基础统计数据。
*   **`getAllTags`**: 获取全站标签云数据及其热度计数。

### 4.2 权限辅助
*   **`getCurrentUser`**: 返回当前已登录用户的公开 Profile。
*   **`isAdmin`**: 判定当前会话是否具备管理权限。

