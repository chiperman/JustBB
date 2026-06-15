"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"

export type ViewMode = "HOME_FOCUS" | "SPLIT_VIEW"
export type AnimationSpeed = "normal" | "slow" | "very-slow" | "super-slow"

interface LayoutContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  activeId: string | null
  setActiveId: (id: string | null) => void
  isManualClick: boolean
  setManualClick: (val: boolean) => void
  animationSpeed: AnimationSpeed
  setAnimationSpeed: (speed: AnimationSpeed) => void
  animationMultiplier: number
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("HOME_FOCUS")
  const [activeId, setActiveIdState] = useState<string | null>(null)
  const [isManualClick, setIsManualClick] = useState(false)
  const [animationSpeed, setAnimationSpeedState] = React.useState<AnimationSpeed>("normal")
  const manualClickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("animation-speed") as AnimationSpeed
      if (saved && ["normal", "slow", "very-slow", "super-slow"].includes(saved)) {
        setAnimationSpeedState(saved)
      }
    }
  }, [])

  const setAnimationSpeed = useCallback((speed: AnimationSpeed) => {
    setAnimationSpeedState(speed)
    if (typeof window !== "undefined") {
      localStorage.setItem("animation-speed", speed)
    }
  }, [])

  const animationMultiplier = React.useMemo(() => {
    switch (animationSpeed) {
      case "slow":
        return 2
      case "very-slow":
        return 5
      case "super-slow":
        return 10
      default:
        return 1
    }
  }, [animationSpeed])

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

  const contextValue = React.useMemo(
    () => ({
      viewMode,
      setViewMode,
      activeId,
      setActiveId,
      isManualClick,
      setManualClick,
      animationSpeed,
      setAnimationSpeed,
      animationMultiplier,
    }),
    [
      viewMode,
      activeId,
      isManualClick,
      setActiveId,
      setManualClick,
      animationSpeed,
      setAnimationSpeed,
      animationMultiplier,
    ]
  )

  return <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    return {
      viewMode: "HOME_FOCUS" as const,
      setViewMode: () => {},
      activeId: null,
      setActiveId: () => {},
      isManualClick: false,
      setManualClick: () => {},
      animationSpeed: "normal" as const,
      setAnimationSpeed: () => {},
      animationMultiplier: 1,
    }
  }
  return context
}
