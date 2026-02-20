'use client';

import { createContext, useContext, useCallback, useRef, ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PageData = Record<string, any>;

interface PageDataCacheContextType {
    /** 获取指定路径的缓存数据 */
    getCache: (path: string) => PageData | null;
    /** 设置指定路径的缓存数据 */
    setCache: (path: string, data: PageData) => void;
}

const PageDataCacheContext = createContext<PageDataCacheContextType>({
    getCache: () => null,
    setCache: () => { },
});

export function usePageDataCache() {
    return useContext(PageDataCacheContext);
}

export function PageDataCacheProvider({ children }: { children: ReactNode }) {
    // 使用 ref 避免缓存更新触发全局重渲染
    const cacheRef = useRef<Map<string, PageData>>(new Map());

    const getCache = useCallback((path: string): PageData | null => {
        return cacheRef.current.get(path) ?? null;
    }, []);

    const setCache = useCallback((path: string, data: PageData) => {
        cacheRef.current.set(path, data);
    }, []);

    return (
        <PageDataCacheContext.Provider value={{ getCache, setCache }}>
            {children}
        </PageDataCacheContext.Provider>
    );
}
