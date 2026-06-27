"use client"

import { useMemo } from "react"

import { cn } from "@/shared/lib/utils"

interface ShortcutHintProps {
  shortcut: string
  className?: string
}

export function ShortcutHint({ shortcut, className }: ShortcutHintProps) {
  return (
    <kbd
      className={cn(
        "shrink-0 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground",
        className
      )}
    >
      {useShortcutLabel(shortcut)}
    </kbd>
  )
}

export function useShortcutLabel(shortcut: string) {
  const modKey = usePlatformModKey()

  return useMemo(
    () =>
      shortcut
        .trim()
        .split(/\s+/)
        .map((stroke) =>
          stroke
            .split("+")
            .map((part) => formatShortcutPart(part.trim(), modKey))
            .join("+")
        )
        .join(" "),
    [modKey, shortcut]
  )
}

function usePlatformModKey() {
  return useMemo(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      return "⌘"
    }

    return "Ctrl"
  }, [])
}

function formatShortcutPart(part: string, modKey: string) {
  const normalized = part.toLowerCase()

  if (normalized === "mod") return modKey
  if (normalized === "alt") return modKey === "⌘" ? "⌥" : "Alt"
  if (normalized === "shift") return modKey === "⌘" ? "⇧" : "Shift"
  if (normalized === "enter") return "Enter"
  if (normalized === "escape") return "Esc"
  if (normalized === "arrowup") return "↑"
  if (normalized === "arrowdown") return "↓"
  if (normalized === "arrowleft") return "←"
  if (normalized === "arrowright") return "→"

  return part.length === 1 ? part.toUpperCase() : part
}
