import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { Suspense } from "react";
import { ClientLayoutProviders } from "@/components/layout/ClientLayoutProviders";
import { ClientRouter } from "@/components/layout/ClientRouter";
import { getAllTags } from "@/actions/memos/analytics";
import { getTimelineStats, getMemoStats } from "@/actions/memos/analytics";
import { getOnThisDayMemos } from "@/actions/memos/query";

import { headers } from "next/headers";
import { getCurrentUser } from "@/features/auth/actions";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const url = headersList.get('x-url') || '';
    const initialPath = url ? new URL(url).pathname : '/';

    // 在服务端预拉取数据
    const [initialTags, initialTimeline, initialStats, user, onThisDayMemos] = await Promise.all([
        getAllTags(),
        getTimelineStats(),
        getMemoStats(),
        getCurrentUser(),
        getOnThisDayMemos()
    ]);

    return (
        <ClientLayoutProviders
            initialTags={initialTags.success ? initialTags.data : []}
            initialStats={initialStats.success ? initialStats.data : null}
            initialUser={user}
            initialPath={initialPath}
        >
            <div className="flex h-screen w-full overflow-hidden">
                <div className="flex w-full h-full">
                    {/* 左侧导航 - 移动端隐藏 */}
                    <div className="hidden lg:block h-full overflow-y-auto scrollbar-hide border-r border-border/40">
                        <Suspense fallback={<div className="w-64" />}>
                            <LeftSidebar initialOnThisDay={onThisDayMemos.success ? onThisDayMemos.data : []} />
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
                        <RightSidebar initialData={initialTimeline.success ? initialTimeline.data : { days: {} }} />
                    </Suspense>
                </div>
            </div>
        </ClientLayoutProviders>
    );
}
