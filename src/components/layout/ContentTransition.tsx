'use client';

import { ReactNode } from 'react';
import { useNavigation } from '@/context/NavigationContext';

// 动态导入每个页面的骨架屏
import HomeLoading from '@/app/(main)/loading';
import GalleryLoading from '@/app/(main)/gallery/loading';
import TagsLoading from '@/app/(main)/tags/loading';
import TrashLoading from '@/app/(main)/trash/loading';

/**
 * 根据目标路径选择对应的骨架屏
 */
function getLoadingForPath(path: string) {
    if (path.startsWith('/gallery')) return <GalleryLoading />;
    if (path.startsWith('/tags')) return <TagsLoading />;
    if (path.startsWith('/trash')) return <TrashLoading />;
    return <HomeLoading />;
}

/**
 * 内容过渡包装器
 * 当 NavigationContext 中有 targetPath 时，立即隐藏当前内容并显示目标页面的骨架屏
 */
export function ContentTransition({ children }: { children: ReactNode }) {
    const { targetPath } = useNavigation();
    const isNavigating = targetPath !== null;

    if (isNavigating) {
        return <>{getLoadingForPath(targetPath)}</>;
    }

    return <>{children}</>;
}
