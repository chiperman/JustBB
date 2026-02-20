'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface NavigationContextType {
    /** 目标路径，null 表示不在导航中 */
    targetPath: string | null;
    /** 立即触发导航过渡 */
    startNavigation: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
    targetPath: null,
    startNavigation: () => { },
});

export function useNavigation() {
    return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [targetPath, setTargetPath] = useState<string | null>(null);
    const pathname = usePathname();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 只在 pathname 到达目标路径时才重置 —— 防止中间路由完成导致提前重置
    useEffect(() => {
        if (targetPath !== null && pathname === targetPath) {
            setTargetPath(null);
        }
    }, [pathname, targetPath]);

    // 安全超时：防止导航永远不完成时永久卡在骨架屏
    useEffect(() => {
        if (targetPath !== null) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setTargetPath(null);
            }, 8000);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [targetPath]);

    const startNavigation = useCallback((path: string) => {
        // 如果目标就是当前页面则不触发
        if (path === pathname) return;
        // 快速点击时直接覆盖旧目标
        setTargetPath(path);
    }, [pathname]);

    return (
        <NavigationContext.Provider value={{ targetPath, startNavigation }}>
            {children}
        </NavigationContext.Provider>
    );
}
