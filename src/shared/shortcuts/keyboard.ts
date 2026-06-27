import type { ShortcutBinding, ShortcutEnabled, ShortcutRegistration } from "./types"

export interface NormalizedKeyStroke {
  key: string
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

export interface ParsedShortcut {
  sequence: readonly NormalizedKeyStroke[]
}

export interface SequenceState {
  keys: readonly NormalizedKeyStroke[]
  startedAt: number
  updatedAt: number
}

export type SequenceMatchResult = "matched" | "partial" | "none"

const MODIFIER_ALIASES = new Map([
  ["cmd", "meta"],
  ["command", "meta"],
  ["control", "ctrl"],
  ["ctl", "ctrl"],
  ["option", "alt"],
  ["opt", "alt"],
  ["return", "enter"],
  ["esc", "escape"],
  ["spacebar", "space"],
])

const NAMED_KEY_ALIASES = new Map([
  [" ", "space"],
  ["Spacebar", "space"],
  ["Esc", "escape"],
  ["Escape", "escape"],
  ["Return", "enter"],
  ["Enter", "enter"],
  ["ArrowUp", "arrowup"],
  ["ArrowDown", "arrowdown"],
  ["ArrowLeft", "arrowleft"],
  ["ArrowRight", "arrowright"],
])

const BROWSER_RESERVED_WITH_MOD = new Set([
  "a",
  "d",
  "f",
  "g",
  "h",
  "j",
  "l",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "w",
  "y",
  "z",
  "+",
  "-",
  "=",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "/",
  "[",
  "]",
])

const INTERACTIVE_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "summary",
  "dialog",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[role='textbox']",
  "[role='searchbox']",
  "[role='combobox']",
  "[role='dialog']",
  "[role='menu']",
  "[role='menubar']",
  "[role='menuitem']",
  "[aria-modal='true']",
  "[data-shortcuts-disabled]",
  "[data-shortcut-scope='ignore']",
].join(",")

export function normalizeKeyName(key: string): string {
  const aliasedKey = NAMED_KEY_ALIASES.get(key) ?? key
  const normalizedKey =
    aliasedKey.length === 1 ? aliasedKey.toLowerCase() : aliasedKey.toLowerCase()

  return MODIFIER_ALIASES.get(normalizedKey) ?? normalizedKey
}

export function normalizeKeyboardEvent(
  event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">
): NormalizedKeyStroke {
  const key = normalizeKeyName(event.key)
  const isShiftedLetter = event.key.length === 1 && event.key >= "A" && event.key <= "Z"
  const shift = event.shiftKey && (key.length !== 1 || isShiftedLetter)

  return {
    key,
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift,
  }
}

export function parseShortcutBinding(binding: ShortcutBinding): ParsedShortcut {
  const sequence = typeof binding === "string" ? binding.trim().split(/\s+/) : binding

  return {
    sequence: sequence.map(parseKeyStroke),
  }
}

export function parseKeyStroke(value: string): NormalizedKeyStroke {
  const parts = value
    .split("+")
    .map((part) => normalizeKeyName(part.trim()))
    .filter(Boolean)

  if (parts.length === 0) {
    throw new Error("快捷键绑定不能为空")
  }

  const stroke: NormalizedKeyStroke = {
    key: "",
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
  }

  for (const part of parts) {
    if (part === "mod") {
      stroke.ctrl = true
      stroke.meta = true
      continue
    }

    if (part === "alt" || part === "ctrl" || part === "meta" || part === "shift") {
      stroke[part] = true
      continue
    }

    if (stroke.key) {
      throw new Error(`快捷键绑定只能包含一个主键：${value}`)
    }

    stroke.key = part
  }

  if (!stroke.key) {
    throw new Error(`快捷键绑定缺少主键：${value}`)
  }

  return stroke
}

export function formatKeyStroke(stroke: NormalizedKeyStroke): string {
  const modifiers = [
    stroke.meta ? "meta" : null,
    stroke.ctrl ? "ctrl" : null,
    stroke.alt ? "alt" : null,
    stroke.shift ? "shift" : null,
  ].filter(Boolean)

  return [...modifiers, stroke.key].join("+")
}

export function keyStrokesEqual(
  eventStroke: NormalizedKeyStroke,
  bindingStroke: NormalizedKeyStroke
): boolean {
  const modMatches =
    bindingStroke.ctrl && bindingStroke.meta
      ? eventStroke.ctrl || eventStroke.meta
      : eventStroke.ctrl === bindingStroke.ctrl && eventStroke.meta === bindingStroke.meta

  return (
    eventStroke.key === bindingStroke.key &&
    eventStroke.alt === bindingStroke.alt &&
    eventStroke.shift === bindingStroke.shift &&
    modMatches
  )
}

export function shortcutMatchesEvent(
  binding: ShortcutBinding,
  event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">
): boolean {
  const parsed = parseShortcutBinding(binding)

  return (
    parsed.sequence.length === 1 &&
    keyStrokesEqual(normalizeKeyboardEvent(event), parsed.sequence[0])
  )
}

export function sequenceMatch(
  input: readonly NormalizedKeyStroke[],
  shortcut: ParsedShortcut
): SequenceMatchResult {
  if (input.length > shortcut.sequence.length) {
    return "none"
  }

  const matchesPrefix = input.every((stroke, index) =>
    keyStrokesEqual(stroke, shortcut.sequence[index])
  )

  if (!matchesPrefix) {
    return "none"
  }

  return input.length === shortcut.sequence.length ? "matched" : "partial"
}

export function getNextSequenceState(
  current: SequenceState | null,
  stroke: NormalizedKeyStroke,
  now: number,
  timeoutMs: number
): SequenceState {
  const currentKeys = current && now - current.updatedAt <= timeoutMs ? current.keys : []

  return {
    keys: [...currentKeys, stroke],
    startedAt: currentKeys.length > 0 && current ? current.startedAt : now,
    updatedAt: now,
  }
}

export function isShortcutEnabled(enabled: ShortcutEnabled | undefined): boolean {
  if (typeof enabled === "function") {
    return enabled()
  }

  return enabled ?? true
}

export function isBrowserReservedShortcut(
  event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey">
): boolean {
  const hasBrowserModifier = event.metaKey || event.ctrlKey

  if (!hasBrowserModifier || event.altKey) {
    return false
  }

  return BROWSER_RESERVED_WITH_MOD.has(normalizeKeyName(event.key))
}

export function isInteractiveShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  if (target.closest(INTERACTIVE_TARGET_SELECTOR)) {
    return true
  }

  const contentEditable = target.closest("[contenteditable]")

  return contentEditable instanceof HTMLElement && contentEditable.isContentEditable
}

export function shouldHandleShortcutEvent(
  event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "target">,
  shortcut: Pick<ShortcutRegistration, "allowBrowserReservedShortcut" | "allowInInteractiveTarget">
): boolean {
  if (!shortcut.allowBrowserReservedShortcut && isBrowserReservedShortcut(event)) {
    return false
  }

  if (shortcut.allowInInteractiveTarget) {
    return true
  }

  return !isInteractiveShortcutTarget(event.target)
}
