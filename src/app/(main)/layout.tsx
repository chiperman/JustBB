'use client';

import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper";
import { Suspense } from "react";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MobileLayoutWrapper>
            <div className="flex min-h-screen justify-center selection:bg-primary/20">
                <div className="flex w-full max-w-(--breakpoint-2xl)">
                    {/* 左侧导航 - 移动端隐藏 */}
                    <div className="hidden lg:block">
                        <Suspense fallback={<div className="w-64" />}>
                            <LeftSidebar />
                        </Suspense>
                    </div>

                    {/* 内容流区域 */}
                    <main className="flex-1 min-w-0 bg-background px-4 md:px-8 py-10 pt-16 lg:pt-10">
                        {children}
                    </main>

                    {/* 右侧边栏 - 移动端隐藏 */}
                    <div className="hidden xl:block">
                        <Suspense fallback={<div className="w-80" />}>
                            <RightSidebar />
                        </Suspense>
                    </div>
                </div>
            </div>
        </MobileLayoutWrapper>
    );
}
