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
  const { isSelectionMode, toggleSelectionMode, clearSelection, selectAll, getRegisteredMemoIds } =
    useUI()

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

  const selectRegisteredMemos = useCallback(() => {
    if (!isSelectionMode) {
      return
    }

    selectAll(getRegisteredMemoIds())
  }, [getRegisteredMemoIds, isSelectionMode, selectAll])

  const clearSelectedMemos = useCallback(() => {
    if (!isSelectionMode) {
      return
    }

    clearSelection()
  }, [clearSelection, isSelectionMode])

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
        binding: "mod+x",
        description: "切换选择模式",
        group: "选择",
        enabled: isLoggedIn,
        handler: toggleSelection,
      }),
      [isLoggedIn, toggleSelection]
    )
  )

  useAppShortcut(
    useMemo(
      () => ({
        id: "app.selection.selectAll",
        binding: "mod+a",
        description: "全选当前 Memo",
        group: "选择",
        enabled: isSelectionMode,
        allowBrowserReservedShortcut: true,
        handler: selectRegisteredMemos,
      }),
      [isSelectionMode, selectRegisteredMemos]
    )
  )

  useAppShortcut(
    useMemo(
      () => ({
        id: "app.selection.clear",
        binding: "mod+d",
        description: "清空选择",
        group: "选择",
        enabled: isSelectionMode,
        allowBrowserReservedShortcut: true,
        handler: clearSelectedMemos,
      }),
      [clearSelectedMemos, isSelectionMode]
    )
  )

  return <KeyboardShortcutsDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
}
