'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useView } from '@/context/ViewContext';
import { MainLayoutClient } from '@/components/layout/MainLayoutClient';
import { GalleryPageContent } from '@/components/pages/GalleryPageContent';
import { TagsPageContent } from '@/components/pages/TagsPageContent';
import TrashClient from '@/app/(main)/trash/TrashClient';
import AdminPage from '@/app/(main)/admin/page';

/**
 * 客户端路由器
 *
 * 初次加载：显示 {children}（Next.js SSR 内容）
 * 后续导航：根据 currentView 直接渲染对应客户端组件
 * 效果：导航 = 切换组件，零服务器往返
 */
export function ClientRouter({ children }: { children: ReactNode }) {
    const { currentView } = useView();

    // 是否已经发生过客户端导航
    // 初始为 false → 显示 SSR 的 {children}
    // 首次 navigate() 后变为 true → 永远由客户端渲染
    const [isRouterActive, setIsRouterActive] = useState(false);
    const [initialPath] = useState(currentView);

    useEffect(() => {
        if (currentView !== initialPath) {
            setIsRouterActive(true);
        }
    }, [currentView, initialPath]);

    // 尚未客户端导航过，显示 SSR 内容
    if (!isRouterActive) {
        return <>{children}</>;
    }

    // 客户端路由激活后，根据 currentView 渲染
    return <>{renderView(currentView)}</>;
}

function renderView(view: string) {
    // 首页（可能带查询参数）
    if (view === '/') {
        return <MainLayoutClient />;
    }
    if (view === '/gallery') {
        return <GalleryPageContent />;
    }
    if (view === '/tags') {
        return <TagsPageContent />;
    }
    if (view === '/trash') {
        return <TrashClient />;
    }
    if (view === '/admin') {
        return <AdminPage />;
    }
    // 兜底：显示首页
    return <MainLayoutClient />;
}
