import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react"

export type ShortcutHandlerEvent = KeyboardEvent | ReactKeyboardEvent

export type ShortcutHandler = (event: ShortcutHandlerEvent) => void

export type ShortcutEnabled = boolean | (() => boolean)

export type ShortcutBinding = string | readonly string[]

export type ShortcutScope = "global" | "local"

export interface ShortcutRegistration {
  id: string
  binding: ShortcutBinding
  handler: ShortcutHandler
  description?: string
  group?: string
  enabled?: ShortcutEnabled
  scope?: ShortcutScope
  allowInInteractiveTarget?: boolean
  allowBrowserReservedShortcut?: boolean
  preventDefault?: boolean
  priority?: number
}

export interface ShortcutProviderProps {
  children: ReactNode
  sequenceTimeoutMs?: number
}

export interface ShortcutContextValue {
  registerShortcut: (shortcut: ShortcutRegistration) => () => void
}
