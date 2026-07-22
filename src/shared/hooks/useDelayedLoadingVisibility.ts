"use client"

import { useEffect, useRef, useState } from "react"

const LOADING_REVEAL_DELAY_MS = 150
const LOADING_MIN_VISIBLE_MS = 250

interface DelayedLoadingVisibilityOptions {
  delayMs?: number
  minimumVisibleMs?: number
}

export function useDelayedLoadingVisibility(
  isLoading: boolean,
  {
    delayMs = LOADING_REVEAL_DELAY_MS,
    minimumVisibleMs = LOADING_MIN_VISIBLE_MS,
  }: DelayedLoadingVisibilityOptions = {}
) {
  const [isVisible, setIsVisible] = useState(false)
  const visibleSinceRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoading) {
      if (isVisible) return

      const revealTimer = window.setTimeout(() => {
        visibleSinceRef.current = Date.now()
        setIsVisible(true)
      }, delayMs)

      return () => window.clearTimeout(revealTimer)
    }

    if (!isVisible) return

    const elapsed = visibleSinceRef.current ? Date.now() - visibleSinceRef.current : 0
    const remaining = Math.max(0, minimumVisibleMs - elapsed)
    const hideTimer = window.setTimeout(() => {
      visibleSinceRef.current = null
      setIsVisible(false)
    }, remaining)

    return () => window.clearTimeout(hideTimer)
  }, [delayMs, isLoading, isVisible, minimumVisibleMs])

  return isVisible
}
