# Next.js 动态 API 使用规范 (Next.js 15+)

本规范旨在整合 Next.js 15 中关于动态 API（如 `cookies()`、`headers()`）的正确使用方式，避免触发 `outside a request scope` 或 `Dynamic Server Usage` 等运行时错误。

## 1. 核心约束：禁止在动态 API 上层使用 React.cache

> [!CAUTION]
> **永远不要** 将调用了 `cookies()` 或 `headers()` 的异步函数包装在 `React.cache` 中。

### 为什么？
`React.cache` 的设计目的是在 **Server Components 的渲染过程中** 进行数据去重。而 `cookies()` 是一个动态 API，它需要一个稳定的 Request Store。
当 `cache` 被用于 Server Actions 或某些异步边缘情况时，它会丢失当前的请求上下文，导致 Next.js 认为该 API 被用于了静态生成或请求范围外。

### 错误示例 ❌
```typescript
// src/lib/supabase.ts
export const getClient = cache(async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies(); // 在 cache 内部调用 cookies() 会导致上下文丢失
  return createServerClient(...);
});
```

### 正确示例 ✅
```typescript
// src/lib/supabase.ts
export async function getClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies(); // 直接调用，Next.js 15 内部已对 cookies() 做了去重
  return createServerClient(...);
}
```

## 2. 理解 Next.js 的原生去重 (Memoization)

你不需要为 `cookies()` 或 `headers()` 手动添加缓存，因为：
1. **Next.js 内部已处理**：在单次请求（Request Lifecycle）中多次调用 `await cookies()`，框架会返回同一个对象，不会产生额外开销。
2. **Supabase 客户端轻量化**：`createServerClient` 本身只是一个配置容器，其实例化的 CPU 开销极低。真正的网络开销发生在 `supabase.auth.getUser()`。

## 3. 分层缓存建议

如果你需要优化性能，请遵循以下分层原则：

| 缓存目标 | 推荐方案 |
| :--- | :--- |
| **用户信息 (User)** | 在 Layout 或 Page 级别获取一次，通过 Props 或 Context 传递。 |
| **频繁查询的数据 (Data)** | 使用 `unstable_cache` 或在 Server Action 外层控制。 |
| **组件级计算** | 使用 `useMemo` (Client) 或 `React.cache` (Server - 仅限非动态 API 函数)。 |

## 4. 故障排查 checklist

如果你遇到 `cookies called outside request scope`：
1. 检查调用链路中是否有 `React.cache` 包装。
2. 确认你没有在 `setTimeout`、`setInterval` 或未经 `await` 的 Promise 中调用动态 API。
3. 确认该调用发生在标准的 Server Component 渲染流或 Server Action 执行流中。
