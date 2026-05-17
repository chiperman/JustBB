"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Link01Icon,
  Bookmark01Icon,
  UserIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons"
import type { LinkRenderMode } from "./smartLink"

interface LinkPasteMenuProps {
  position: { top: number; left: number } | null
  onSelect: (mode: LinkRenderMode) => void
  onClose: () => void
}

const OPTIONS: { mode: LinkRenderMode; label: string; icon: IconSvgElement }[] =
  [
    { mode: "mention", label: "提及", icon: UserIcon },
    { mode: "pill", label: "URL", icon: Link01Icon },
    { mode: "card", label: "书签", icon: Bookmark01Icon },
    { mode: "image", label: "图片", icon: Image01Icon },
  ]

export function LinkPasteMenu({
  position,
  onSelect,
  onClose,
}: LinkPasteMenuProps) {
  if (!position) return null

  return (
    <LinkPasteMenuContent
      key={`${position.top}:${position.left}`}
      position={position}
      onSelect={onSelect}
      onClose={onClose}
    />
  )
}

function LinkPasteMenuContent({
  position,
  onSelect,
  onClose,
}: {
  position: { top: number; left: number }
  onSelect: (mode: LinkRenderMode) => void
  onClose: () => void
}) {
  const hasMounted = useHasMounted()
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % OPTIONS.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + OPTIONS.length - 1) % OPTIONS.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        onSelect(OPTIONS[selectedIndex].mode)
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, onSelect, onClose])

  if (!hasMounted) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.98, y: -6 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: -6 }}
        className="fixed z-[10001] w-[180px] pointer-events-auto"
        style={{
          top: position.top,
          left: position.left,
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="bg-background border border-border/40 rounded-md overflow-hidden flex flex-col py-1">
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/40 mb-1">
            粘贴为
          </div>
          {OPTIONS.map((opt, index) => (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 transition-colors outline-none w-full text-left relative",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/80 hover:bg-accent/50"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded transition-colors",
                  index === selectedIndex
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground/60"
                )}
              >
                <HugeiconsIcon icon={opt.icon} size={16} />
              </div>
              <span className="text-xs font-medium tracking-tight">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
