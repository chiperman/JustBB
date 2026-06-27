"use client"

import { createContext, useCallback, useEffect, useMemo, useRef } from "react"

import {
  getNextSequenceState,
  isShortcutEnabled,
  normalizeKeyboardEvent,
  parseShortcutBinding,
  sequenceMatch,
  shouldHandleShortcutEvent,
  type SequenceState,
} from "./keyboard"
import type { ShortcutContextValue, ShortcutProviderProps, ShortcutRegistration } from "./types"

export const ShortcutContext = createContext<ShortcutContextValue | null>(null)

const DEFAULT_SEQUENCE_TIMEOUT_MS = 900

export function ShortcutProvider({
  children,
  sequenceTimeoutMs = DEFAULT_SEQUENCE_TIMEOUT_MS,
}: ShortcutProviderProps) {
  const shortcutsRef = useRef(new Map<string, ShortcutRegistration>())
  const sequenceRef = useRef<SequenceState | null>(null)

  const registerShortcut = useCallback((shortcut: ShortcutRegistration) => {
    shortcutsRef.current.set(shortcut.id, shortcut)

    return () => {
      shortcutsRef.current.delete(shortcut.id)
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const stroke = normalizeKeyboardEvent(event)
      const now = Date.now()
      const sequenceState = getNextSequenceState(
        sequenceRef.current,
        stroke,
        now,
        sequenceTimeoutMs
      )
      const shortcuts = [...shortcutsRef.current.values()]
        .filter((shortcut) => isShortcutEnabled(shortcut.enabled))
        .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))

      let hasPartialMatch = false

      for (const shortcut of shortcuts) {
        if (!shouldHandleShortcutEvent(event, shortcut)) {
          continue
        }

        const parsedShortcut = parseShortcutBinding(shortcut.binding)
        const match = sequenceMatch(sequenceState.keys, parsedShortcut)

        if (match === "partial") {
          hasPartialMatch = true
          continue
        }

        if (match !== "matched") {
          continue
        }

        if (shortcut.preventDefault ?? true) {
          event.preventDefault()
        }

        shortcut.handler(event)
        sequenceRef.current = null
        return
      }

      // 只有存在前缀命中时才保留序列状态，避免普通按键把后续序列污染。
      sequenceRef.current = hasPartialMatch ? sequenceState : null
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [sequenceTimeoutMs])

  const value = useMemo<ShortcutContextValue>(
    () => ({
      registerShortcut,
    }),
    [registerShortcut]
  )

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>
}
