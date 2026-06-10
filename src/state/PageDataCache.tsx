"use client"

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  ReactNode,
} from "react"
import { Memo } from "@/types/memo"

interface PageData {
  memos?: Memo[]
  total?: number
  tags?: { tag_name: string; count: number }[]
  searchParams?: Record<string, string | string[] | undefined>
  [key: string]: unknown
}

interface PageDataCacheContextType {
  /** 获取指定路径的缓存数据 */
  getCache: (path: string) => PageData | null
  /** 设置指定路径的缓存数据 */
  setCache: (path: string, data: PageData) => void
}

const PageDataCacheContext = createContext<PageDataCacheContextType>({
  getCache: () => null,
  setCache: () => {},
})

export function usePageDataCache() {
  return useContext(PageDataCacheContext)
}

const MAX_CACHE_SIZE = 100

export function PageDataCacheProvider({ children }: { children: ReactNode }) {
  // 使用 ref 避免缓存更新触发全局重渲染
  const cacheRef = useRef<Map<string, PageData>>(new Map())

  const getCache = useCallback((path: string): PageData | null => {
    const map = cacheRef.current
    const entry = map.get(path)
    if (entry) {
      // Touch: remove and re-insert to mark as recently used
      map.delete(path)
      map.set(path, entry)
    }
    return entry ?? null
  }, [])

  const setCache = useCallback((path: string, data: PageData) => {
    const map = cacheRef.current
    if (map.has(path)) {
      map.delete(path)
    } else if (map.size >= MAX_CACHE_SIZE) {
      // Remove oldest (first) entry
      const oldest = map.keys().next().value
      if (oldest) map.delete(oldest)
    }
    map.set(path, data)
  }, [])

  return (
    <PageDataCacheContext.Provider value={{ getCache, setCache }}>
      {children}
    </PageDataCacheContext.Provider>
  )
}
