'use client';

import { ReactNode } from 'react';
import { useHasMounted } from '@/hooks/useHasMounted';

interface ClientOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * 声明式组件，用于确保子组件仅在客户端挂载后渲染。
 * 有效防止 SSR 环境下因动态数据（日期、Window API 等）导致的水合错误。
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
    const hasMounted = useHasMounted();

    if (!hasMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
