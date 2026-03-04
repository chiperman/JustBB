'use client';

import { createContext, useContext, useCallback, ReactNode, useSyncExternalStore } from 'react';

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

/**
 * 自定义事件名称，用于在 pushState 后通知 useSyncExternalStore 更新
 */
const NAVIGATE_EVENT = 'view-context-navigate';

export function ViewProvider({ children }: { children: ReactNode }) {
    // 使用 useSyncExternalStore 同步浏览器地址栏状态
    // 这是 React 18 推荐的同步外部状态（如 window.location）的方式
    // 它可以天然避免 Hydration Mismatch 和 set-state-in-effect 警告
    const currentView = useSyncExternalStore(
        (callback) => {
            window.addEventListener('popstate', callback);
            window.addEventListener(NAVIGATE_EVENT, callback);
            return () => {
                window.removeEventListener('popstate', callback);
                window.removeEventListener(NAVIGATE_EVENT, callback);
            };
        },
        // Client getSnapshot
        () => window.location.pathname,
        // Server getSnapshot (Hydration initial value)
        () => '/'
    );

    const navigate = useCallback((path: string) => {
        if (path === window.location.pathname) return;
        window.history.pushState(null, '', path);
        // 使用自定义事件触发 useSyncExternalStore 的重新订阅逻辑
        window.dispatchEvent(new Event(NAVIGATE_EVENT));
    }, []);

    return (
        <ViewContext.Provider value={{ currentView, navigate }}>
            {children}
        </ViewContext.Provider>
    );
}
