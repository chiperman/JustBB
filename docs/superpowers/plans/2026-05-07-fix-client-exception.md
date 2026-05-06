# Fix Client-Side Exception in Vercel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 just-memo-dev.vercel.app 上的客户端异常，解决 `useSearchParams` 缺失 `Suspense` 边界及潜在的组件加载冲突。

**Architecture:**

1. 在路由层面为 `MainLayoutClient` 注入 `Suspense` 边界。
2. 将 `AgentationWrapper` 改为动态导入并添加 `Suspense` 保护，防止 SSR 阶段崩溃。
3. 增强 `supabase.ts` 的鲁棒性，确保环境变量缺失时不会在模块加载阶段直接抛错。

**Tech Stack:** Next.js 16, React 19, Supabase, Agentation

---

### Task 1: 为主页面添加 Suspense 边界

**Files:**

- Modify: `src/app/(main)/page.tsx`

- [ ] **Step 1: 修改主页面，为 MainLayoutClient 添加 Suspense**

```tsx
import { MainLayoutClient } from "@/shared/layout/MainLayoutClient"
import { Suspense } from "react"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MainLayoutClient />
    </Suspense>
  )
}
```

- [ ] **Step 2: 提交更改**

```bash
git add src/app/(main)/page.tsx
git commit -m "fix: wrap MainLayoutClient in Suspense to prevent useSearchParams crash"
```

### Task 2: 优化 AgentationWrapper 导入方式

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 将 AgentationWrapper 改为动态导入（禁用 SSR）**

```tsx
import type { Metadata } from "next"
import { ThemeProvider } from "@/shared/providers/ThemeProvider"
import dynamic from "next/dynamic"
import { env } from "@/lib/env"
import "./globals.css"

// 强制执行环境校验
if (typeof window === "undefined") {
  void env
}

export const metadata: Metadata = {
  title: "JustMemo - 碎片化人文记录",
  description: "一款追求人文质感与极致隐私的碎片化记录工具。",
  manifest: "/manifest.json",
}

import { PWARegistration } from "@/shared/providers/PWARegistration"
import { Toaster } from "@/shared/ui/toaster"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { Suspense } from "react"

// 动态导入 AgentationWrapper，确保仅在客户端加载
const AgentationWrapper = dynamic(
  () =>
    import("@/shared/providers/AgentationWrapper").then(
      (mod) => mod.AgentationWrapper
    ),
  { ssr: false }
)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://a.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://b.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://c.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
            <PWARegistration />
            <Suspense fallback={null}>
              <AgentationWrapper />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: 提交更改**

```bash
git add src/app/layout.tsx
git commit -m "fix: load AgentationWrapper dynamically with ssr:false to prevent hydration errors"
```

### Task 3: 增强 Supabase 客户端初始化保护

**Files:**

- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: 添加初始化检查，防止在缺少环境变量时直接崩溃**

```tsx
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"
import { env } from "./env"

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * 客户端使用的匿名实例 (浏览器环境专用)
 */
export const supabase =
  typeof window !== "undefined"
    ? (() => {
        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Supabase 客户端初始化失败: 缺少环境变量")
          return null as any
        }
        return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
      })()
    : (null as unknown as ReturnType<typeof createBrowserClient<Database>>)

/**
 * 服务端使用的匿名实例 (Server Components/Actions)
 */
export async function getClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 服务端客户端初始化失败: 缺少环境变量")
  }

  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // ignore in Server Components
        }
      },
    },
  })
}

/**
 * 服务端使用的管理实例 (绕过 RLS)
 */
export const getAdminClient = () => {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase 管理客户端初始化失败: 缺少环境变量")
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL as string,
    env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

- [ ] **Step 2: 运行 Lint 检查**

Run: `npm run lint`

- [ ] **Step 3: 提交更改**

```bash
git add src/lib/supabase.ts
git commit -m "fix: add robust checks for Supabase client initialization"
```
