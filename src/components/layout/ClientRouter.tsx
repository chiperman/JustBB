'use client';

import { ReactNode, useState } from 'react';
import { useView } from '@/context/ViewContext';
import { MainLayoutClient } from '@/components/layout/MainLayoutClient';
import { GalleryPageContent } from '@/features/gallery';
import { TagsPageContent } from '@/features/tags';
import { MapPageContent } from '@/features/map';
import { TrashClient } from '@/features/trash';

/**
 * 路径标准化：移除末尾斜杠（除非是根路径）
 */
function normalizePath(p: string) {
    if (!p || p === '/') return p;
    // 移除末尾斜线并去掉 query 参数进行基础匹配
    return p.split('?')[0].replace(/\/$/, '') || '/';
}

export function ClientRouter({ children }: { children: ReactNode }) {
    const { currentView } = useView();

    // 是否已经发生过客户端导航
    // 初始为 false → 显示 SSR 的 {children}
    // 只要路径变了，就永久激活客户端路由模式
    const [initialPath] = useState(() => normalizePath(currentView));

    // 只有当路径真正由客户端路由变更时才激活
    const isRouterActive = normalizePath(currentView) !== initialPath;

    // 尚未客户端导航过，显示 SSR 内容
    if (!isRouterActive) {
        return <>{children}</>;
    }

    // 客户端路由激活后，根据 currentView 渲染
    return <>{renderView(normalizePath(currentView))}</>;
}

function renderView(path: string) {
    if (path === '/') {
        return <MainLayoutClient />;
    }
    if (path === '/gallery') {
        return <GalleryPageContent />;
    }
    if (path === '/tags') {
        return <TagsPageContent />;
    }
    if (path === '/map') {
        return <MapPageContent />;
    }
    if (path === '/trash') {
        return <TrashClient />;
    }
    if (path === '/on-this-day') {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">
                「去年今日」內容開發中...
            </div>
        );
    }
    // 兜底：显示首页
    return <MainLayoutClient />;
}
