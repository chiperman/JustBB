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
    // 初始值全系统统一为 '/'，确保水合阶段 Server/Client 树完全一致
    // 实际路径会在 mount 后的 useEffect 中同步
    const [currentView, setCurrentView] = useState('/');

    const navigate = useCallback((path: string) => {
        if (path === currentView) return;
        window.history.pushState(null, '', path);
        setCurrentView(path);
    }, [currentView]);

    // Hydrate 后同步：SSR 时 useState 初始化为 '/'，
    // React 18 hydration 不会重新运行初始化函数，所以需要在 mount 后手动校正
    useEffect(() => {
        const actualPath = window.location.pathname;
        if (actualPath !== currentView) {
            setCurrentView(actualPath);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
