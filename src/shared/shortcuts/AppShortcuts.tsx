"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { NAVIGATION_CONFIG } from "@/config/navigation"
import { useUI } from "@/state/UIContext"
import { useUser } from "@/state/UserContext"

import { OPEN_KEYBOARD_SHORTCUTS_EVENT } from "./events"
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog"
import { useShortcut } from "./useShortcut"
import type { ShortcutRegistration } from "./types"

const NAVIGATION_HREFS = Object.fromEntries(
  NAVIGATION_CONFIG.map((item) => [item.id, item.href])
) as Record<string, string>

function useAppShortcut(shortcut: ShortcutRegistration): void {
  useShortcut(shortcut)
}

export function AppShortcuts() {
  const router = useRouter()
  const pathname = usePathname() || "/"
  const { user } = useUser()
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { toggleSelectionMode } = useUI()

  const isLoggedIn = Boolean(user)
  const isHomePath = pathname === NAVIGATION_HREFS.home

  const focusCreateEditor = useCallback(() => {
    if (!isLoggedIn) {
      return
    }

    if (isHomePath) {
      window.dispatchEvent(new Event("justmemo:focus-create-editor"))
      return
    }

    router.push(NAVIGATION_HREFS.home)

    window.setTimeout(() => {
      window.dispatchEvent(new Event("justmemo:focus-create-editor"))
    }, 150)
    window.setTimeout(() => {
      window.dispatchEvent(new Event("justmemo:focus-create-editor"))
    }, 450)
  }, [isHomePath, isLoggedIn, router])

  const scrollCurrentPageToTop = useCallback(() => {
    const scrollRoot = document.querySelector<HTMLElement>("[data-shortcut-scroll-root='true']")

    if (scrollRoot) {
      scrollRoot.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const toggleSelection = useCallback(() => {
    if (!isLoggedIn) {
      return
    }

    toggleSelectionMode()
  }, [isLoggedIn, toggleSelectionMode])

  useEffect(() => {
    const openShortcuts = () => setIsHelpOpen(true)

    window.addEventListener(OPEN_KEYBOARD_SHORTCUTS_EVENT, openShortcuts)
    return () => {
      window.removeEventListener(OPEN_KEYBOARD_SHORTCUTS_EVENT, openShortcuts)
    }
  }, [])

  useAppShortcut(
    useMemo(
      () => ({
        id: "app.shortcuts.help.open",
        binding: "mod+/",
        description: "打开快捷键帮助",
        group: "通用",
        enabled: !isHelpOpen,
        allowBrowserReservedShortcut: true,
        handler: () => setIsHelpOpen(true),
        priority: 20,
      }),
      [isHelpOpen]
    )
  )

  useAppShortcut(
    useMemo(
      () => ({
        id: "app.create.focus",
        binding: "mod+enter",
        description: "新建 Memo",
        group: "Memo",
        enabled: isLoggedIn,
        handler: focusCreateEditor,
      }),
      [focusCreateEditor, isLoggedIn]
    )
  )

  useAppShortcut(
    useMemo(
      () => ({
        id: "app.scroll.top",
        binding: "mod+arrowup",
        description: "回到顶部",
        group: "通用",
        handler: scrollCurrentPageToTop,
      }),
      [scrollCurrentPageToTop]
    )
  )

  useAppShortcut(
    useMemo(
      () => ({
        id: "app.selection.toggle",
        binding: "mod+shift+x",
        description: "切换选择模式",
        group: "选择",
        enabled: isLoggedIn,
        allowInInteractiveTarget: true,
        handler: toggleSelection,
      }),
      [isLoggedIn, toggleSelection]
    )
  )

  return <KeyboardShortcutsDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
}
