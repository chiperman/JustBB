"use client"

import { useMemo } from "react"

import { cn } from "@/shared/lib/utils"

interface ShortcutHintProps {
  shortcut: string
  displayShortcut?: string
  className?: string
}

export function ShortcutHint({ shortcut, displayShortcut, className }: ShortcutHintProps) {
  const strokes = useShortcutLabelParts(displayShortcut ?? shortcut)

  return (
    <span
      aria-label={useShortcutLabel(displayShortcut ?? shortcut)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold leading-none text-muted-foreground",
        className
      )}
    >
      {strokes.map((stroke, strokeIndex) => (
        <span
          key={`${stroke.join("-")}-${strokeIndex}`}
          className="inline-flex items-center gap-0.5"
        >
          {strokeIndex > 0 ? <span className="mx-0.5 text-muted-foreground/50">then</span> : null}
          {stroke.map((part) => (
            <kbd
              key={`${part}-${strokeIndex}`}
              className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-border/80 bg-background px-2 font-semibold text-foreground/75 shadow-[inset_0_-1px_0_hsl(var(--border)/0.75)]"
            >
              {part}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  )
}

export function useShortcutLabel(shortcut: string) {
  const strokes = useShortcutLabelParts(shortcut)

  return useMemo(() => strokes.map((stroke) => stroke.join("+")).join(" "), [strokes])
}

export function useShortcutLabelParts(shortcut: string) {
  const modKey = usePlatformModKey()

  return useMemo(
    () =>
      shortcut
        .trim()
        .split(/\s+/)
        .map((stroke) => stroke.split("+").map((part) => formatShortcutPart(part.trim(), modKey))),
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
