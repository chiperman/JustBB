'use client';

import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper";
import { Suspense } from "react";
import { TimelineProvider } from "@/context/TimelineContext";
import { LoginModeProvider } from "@/context/LoginModeContext";
import { LoginTransitionWrapper } from "@/components/layout/LoginTransitionWrapper";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LoginModeProvider>
            <TimelineProvider>
                <LoginTransitionWrapper>
                    <MobileLayoutWrapper>
                        <div className="flex h-screen w-full justify-center selection:bg-primary/20 overflow-hidden">
                            <div className="flex w-full max-w-(--breakpoint-2xl) h-full">
                                {/* 左侧导航 - 移动端隐藏 */}
                                <div className="hidden lg:block h-full overflow-y-auto scrollbar-hide border-r border-border/40">
                                    <Suspense fallback={<div className="w-64" />}>
                                        <LeftSidebar />
                                    </Suspense>
                                </div>

                                {/* 内容流区域 */}
                                <main className="flex-1 min-w-0 bg-background h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
                                    {children}
                                </main>

                                {/* 右侧边栏 - 移动端隐藏 */}
                                <div className="hidden xl:block h-full overflow-y-auto scrollbar-hide border-l border-border/40">
                                    <Suspense fallback={<div className="w-80" />}>
                                        <RightSidebar />
                                    </Suspense>
                                </div>
                            </div>
                        </div>
                    </MobileLayoutWrapper>
                </LoginTransitionWrapper>
            </TimelineProvider>
        </LoginModeProvider>
    );
}
