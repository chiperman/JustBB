'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface ViewContextType {
    /** 当前视图路径 */
    currentView: string;
    /** 客户端导航：更新视图 + pushState，不触发服务器路由 */
    navigate: (path: string) => void;
}

const ViewContext = createContext<ViewContextType>({
    currentView: '/',
    navigate: () => { },
});

export function useView() {
    return useContext(ViewContext);
}

export function ViewProvider({ children }: { children: ReactNode }) {
    // 初始值从 window.location 获取（SSR 时用 '/'）
    const [currentView, setCurrentView] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname;
        }
        return '/';
    });

    const navigate = useCallback((path: string) => {
        if (path === currentView) return;
        window.history.pushState(null, '', path);
        setCurrentView(path);
    }, [currentView]);

    // 浏览器前进/后退按钮支持
    useEffect(() => {
        const handlePopState = () => {
            setCurrentView(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return (
        <ViewContext.Provider value={{ currentView, navigate }}>
            {children}
        </ViewContext.Provider>
    );
}
