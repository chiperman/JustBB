import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { Suspense } from "react";
import { ClientLayoutProviders } from "@/components/layout/ClientLayoutProviders";
import { ClientRouter } from "@/components/layout/ClientRouter";
import { getAllTags } from "@/actions/tags";
import { getTimelineStats, getMemoStats } from "@/actions/stats";
import { getOnThisDayMemos } from "@/actions/history";

import { getCurrentUser } from "@/actions/auth";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 在服务端预拉取数据
    const [initialTags, initialTimeline, initialStats, user, onThisDayMemos] = await Promise.all([
        getAllTags(),
        getTimelineStats(),
        getMemoStats(),
        getCurrentUser(),
        getOnThisDayMemos()
    ]);

    return (
        <ClientLayoutProviders initialTags={initialTags} initialStats={initialStats} initialUser={user}>
            <div className="flex h-screen w-full overflow-hidden">
                <div className="flex w-full h-full">
                    {/* 左侧导航 - 移动端隐藏 */}
                    <div className="hidden lg:block h-full overflow-y-auto scrollbar-hide border-r border-border/40">
                        <Suspense fallback={<div className="w-64" />}>
                            <LeftSidebar initialOnThisDay={onThisDayMemos} />
                        </Suspense>
                    </div>

                    {/* 内容流区域 */}
                    <main className="flex-1 min-w-0 bg-background h-full flex flex-col overflow-hidden">
                        <ClientRouter>
                            {children}
                        </ClientRouter>
                    </main>

                    {/* 右侧边栏 - 内部自控显示状态 */}
                    <Suspense fallback={null}>
                        <RightSidebar initialData={initialTimeline as any} />
                    </Suspense>
                </div>
            </div>
        </ClientLayoutProviders>
    );
}
