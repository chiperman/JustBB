"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react"
import { usePathname } from "next/navigation"

export type ViewMode = "HOME_FOCUS" | "SPLIT_VIEW"

interface LayoutContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  activeId: string | null
  setActiveId: (id: string | null) => void
  isManualClick: boolean
  setManualClick: (val: boolean) => void
  pendingNavigationPath: string | null
  beginNavigation: (href: string) => void
  cancelNavigation: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export const NAVIGATION_FEEDBACK_TIMEOUT_MS = 8_000

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const [viewMode, setViewMode] = useState<ViewMode>("HOME_FOCUS")
  const [activeId, setActiveIdState] = useState<string | null>(null)
  const [isManualClick, setIsManualClick] = useState(false)
  const manualClickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<{
    target: string
    origin: string
  } | null>(null)
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id)
  }, [])

  const setManualClick = useCallback((val: boolean) => {
    setIsManualClick(val)
    if (val) {
      if (manualClickTimeoutRef.current) clearTimeout(manualClickTimeoutRef.current)
      manualClickTimeoutRef.current = setTimeout(() => {
        setIsManualClick(false)
      }, 1000)
    }
  }, [])

  const cancelNavigation = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }
    setPendingNavigation(null)
  }, [])

  const beginNavigation = useCallback(
    (href: string) => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }

      setPendingNavigation({ target: href, origin: pathname })
      navigationTimeoutRef.current = setTimeout(() => {
        navigationTimeoutRef.current = null
        setPendingNavigation(null)
      }, NAVIGATION_FEEDBACK_TIMEOUT_MS)
    },
    [pathname]
  )

  const reachedNavigationDestination = pendingNavigation
    ? pendingNavigation.target === "/"
      ? pathname === "/"
      : pathname === pendingNavigation.target || pathname.startsWith(`${pendingNavigation.target}/`)
    : false
  const navigationRedirected = Boolean(pendingNavigation && pathname !== pendingNavigation.origin)
  const pendingNavigationPath =
    reachedNavigationDestination || navigationRedirected
      ? null
      : (pendingNavigation?.target ?? null)

  useEffect(() => {
    return () => {
      if (manualClickTimeoutRef.current) clearTimeout(manualClickTimeoutRef.current)
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current)
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      viewMode,
      setViewMode,
      activeId,
      setActiveId,
      isManualClick,
      setManualClick,
      pendingNavigationPath,
      beginNavigation,
      cancelNavigation,
    }),
    [
      viewMode,
      activeId,
      isManualClick,
      setActiveId,
      setManualClick,
      pendingNavigationPath,
      beginNavigation,
      cancelNavigation,
    ]
  )

  return <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
