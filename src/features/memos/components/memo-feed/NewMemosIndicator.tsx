"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon as ArrowUp, ArrowDown01Icon as ArrowDown } from "@hugeicons/core-free-icons"
import { BaseFloatingCapsule } from "@/shared/ui/BaseFloatingCapsule"

interface NewMemosIndicatorProps {
  lastCreatedId: string | null
  clearLastCreatedId: () => void
}

export function NewMemosIndicator({ lastCreatedId, clearLastCreatedId }: NewMemosIndicatorProps) {
  const [direction, setDirection] = useState<"up" | "down" | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!lastCreatedId) {
      Promise.resolve().then(() => setIsVisible(false))
      return
    }

    const element = document.getElementById(`memo-${lastCreatedId}`)
    if (!element) {
      Promise.resolve().then(() => setIsVisible(false))
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(false)
        } else {
          // Determine direction if not visible
          const rect = entry.boundingClientRect
          setDirection(rect.top < 0 ? "up" : "down")
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    // Auto clear after 30 seconds to match the breathing light
    const timer = setTimeout(() => {
      clearLastCreatedId()
    }, 30000)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [lastCreatedId, clearLastCreatedId])

  const scrollToMemo = () => {
    if (!lastCreatedId) return
    const element = document.getElementById(`memo-${lastCreatedId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      // The visibility check will trigger and hide the indicator
    }
  }

  return (
    <AnimatePresence>
      {isVisible && direction && (
        <BaseFloatingCapsule
          role="button"
          tabIndex={0}
          className="[@media(pointer:coarse)]:active:scale-95 transition-transform"
          onClick={scrollToMemo}
          onKeyDown={(e) => {
            if (!e.repeat && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault()
              scrollToMemo()
            }
          }}
        >
          <div className="flex items-center gap-2 px-3 py-1 text-primary">
            <HugeiconsIcon
              icon={direction === "up" ? ArrowUp : ArrowDown}
              size={18}
              className="animate-bounce"
            />
            <span className="text-xs font-medium">发现新记录</span>
          </div>
        </BaseFloatingCapsule>
      )}
    </AnimatePresence>
  )
}
