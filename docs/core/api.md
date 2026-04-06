# JustMemo 接口设计规范 (API Spec)

> 最后更新：2026-04-06 (整合 Next.js 动态 API 调用最佳实践)

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

### 2.2 笔记操作系列 (`mutate.ts`)
*   **Actions**: `createMemo`, `updateMemoContent`, `updateMemoState`, `batchAddTagsToMemos`, `verifyUnlockCode`
*   **特性**: 
    *   `verifyUnlockCode`: 验证私密笔记口令。成功后设置 HttpOnly Cookie。

### 2.3 回收站系列 (`trash.ts`)
*   **Actions**: `deleteMemo`, `restoreMemo`, `permanentDeleteMemo`, `emptyTrash`

## 3. 读操作 (Queries - 统一 DAL 架构)

为了保证查询字段的一致性与安全性，所有读操作均应通过 `src/lib/memos/query-builder.ts` 构建。

### 3.1 核心分页查询 (`query.ts`)
*   **`getMemos`**: RPC 驱动的高性能安全分页查询。
*   **`searchMemosForMention`**: 为编辑器设计的增量搜索接口。

---

## 4. Next.js 动态 API 调用规范 (Best Practices)

在 Server Actions 与 Server Components 中调用 Next.js 动态 API (如 `cookies()`, `headers()`) 时，必须遵循以下“解耦”原则：

### 4.1 动态 API 原子化封装
不要在业务逻辑深处直接调用 `cookies()`。应在 `src/lib/supabase/server.ts` 等底层组件中统一实例化。

```ts
// 推荐做法：通过工厂函数获取实例
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### 4.2 性能与并发冲突规避
1. **避免在循环中调用**: 动态 API 会触发 Next.js 的动态渲染切换，频繁调用会显著拉高 Time to First Byte (TTFB)。
2. **轻量化实例化**: `createServerClient` 实例化开销极低。真正的性能瓶颈在于 `supabase.auth.getUser()` 的网络往返。

### 4.3 故障排查 Checklist
如果你遇到 `cookies called outside request scope`：
- 确认该调用发生在标准的 Server Component 渲染流或 Server Action 执行流中。
- 确认你没有在 `setTimeout`、`setInterval` 或未经 `await` 的 Promise 中调用动态 API。

---

## 5. 分层缓存与同步 (Caching & Sync)

| 目标 | 方案 |
| :--- | :--- |
| **用户信息** | 在 Layout 级别获取一次，通过 Context/Props 传递。 |
| **频繁查询数据** | 通过 `PageDataCache` (Client) 实现路径级自动隔离。 |
| **UI 即时同步** | 使用 **CustomEvent** (如 `memo:re-fetch`) 触发组件解耦更新。 |
