"use client"

import { useContext, useEffect } from "react"

import { ShortcutContext } from "./ShortcutProvider"
import type { ShortcutRegistration } from "./types"

export function useShortcut(shortcut: ShortcutRegistration): void {
  const context = useContext(ShortcutContext)

  useEffect(() => {
    if (!context) {
      return
    }

    return context.registerShortcut(shortcut)
  }, [context, shortcut])
}
