import { LeftSidebar } from "@/shared/layout/LeftSidebar"
import { Suspense } from "react"
import { ClientLayoutProviders } from "@/shared/layout/ClientLayoutProviders"
import { getAllTags } from "@/server/actions/memos/analytics"
import { getCurrentUser } from "@/features/auth/actions"
import { cookies } from "next/headers"
import { LEFT_SIDEBAR_COOKIE_KEY } from "@/shared/lib/layout-preferences"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const initialLeftSidebarCollapsed = cookieStore.get(LEFT_SIDEBAR_COOKIE_KEY)?.value === "true"

  // 在服务端仅预拉取核心关键数据，耗时统计数据改为组件内异步获取
  const [initialTags, user] = await Promise.all([getAllTags(), getCurrentUser()])

  return (
    <ClientLayoutProviders
      initialTags={initialTags.success ? initialTags.data : []}
      initialStats={null}
      initialUser={user}
    >
      <div className="flex h-screen w-full overflow-hidden">
        <div className="flex w-full h-full">
          {/* 左侧导航 - 移动端隐藏 */}
          <div className="hidden lg:block h-full overflow-y-auto scrollbar-hide border-r border-border/40">
            <Suspense fallback={<div className="w-64" />}>
              <LeftSidebar initialCollapsed={initialLeftSidebarCollapsed} />
            </Suspense>
          </div>

          {/* 内容流区域 */}
          <main className="flex-1 min-w-0 bg-background h-full flex flex-col overflow-hidden">
            {children}
          </main>
          {/* 时间轴功能暂时关闭：保留 RightSidebar 实现，后续需要时再恢复渲染。 */}
        </div>
      </div>
    </ClientLayoutProviders>
  )
}
