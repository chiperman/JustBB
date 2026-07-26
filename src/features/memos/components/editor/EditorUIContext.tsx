"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

/**
 * 编辑器 UI 状态的唯一持有者。
 *
 * 这批状态（弹窗开合、焦点、建议菜单、粘贴菜单）属于「编辑器这个 UI 区域」，
 * 既不属于发布业务（useMemoEditor），也不属于某个具体组件。MemoEditor 的
 * 折叠/焦点逻辑和 MemoEditorLayout 的弹窗渲染都从这里取，不再经 props 转发。
 */

export type PasteMenuPosition = { top: number; left: number }

type EditorUIContextValue = {
  isFocused: boolean
  setIsFocused: (value: boolean) => void
  showPrivateDialog: boolean
  setShowPrivateDialog: (value: boolean) => void
  showLocationPicker: boolean
  setShowLocationPicker: (value: boolean) => void
  showLinkPicker: boolean
  setShowLinkPicker: (value: boolean) => void
  isMenuOpen: boolean
  setIsMenuOpen: (value: boolean) => void
  showSuggestions: boolean
  setShowSuggestions: (value: boolean) => void
  pasteMenuPosition: PasteMenuPosition | null
  setPasteMenuPosition: (value: PasteMenuPosition | null) => void
  /** 任一弹窗/菜单打开时为 true；折叠逻辑据此判断编辑器不许收起。 */
  isAnyDialogOpen: boolean
}

const EditorUIContext = createContext<EditorUIContextValue | null>(null)

export function EditorUIProvider({ children }: { children: ReactNode }) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPrivateDialog, setShowPrivateDialog] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pasteMenuPosition, setPasteMenuPosition] = useState<PasteMenuPosition | null>(null)

  const value = useMemo<EditorUIContextValue>(
    () => ({
      isFocused,
      setIsFocused,
      showPrivateDialog,
      setShowPrivateDialog,
      showLocationPicker,
      setShowLocationPicker,
      showLinkPicker,
      setShowLinkPicker,
      isMenuOpen,
      setIsMenuOpen,
      showSuggestions,
      setShowSuggestions,
      pasteMenuPosition,
      setPasteMenuPosition,
      isAnyDialogOpen:
        showPrivateDialog ||
        showLocationPicker ||
        showLinkPicker ||
        isMenuOpen ||
        showSuggestions ||
        !!pasteMenuPosition,
    }),
    [
      isFocused,
      showPrivateDialog,
      showLocationPicker,
      showLinkPicker,
      isMenuOpen,
      showSuggestions,
      pasteMenuPosition,
    ]
  )

  return <EditorUIContext.Provider value={value}>{children}</EditorUIContext.Provider>
}

export function useEditorUI() {
  const context = useContext(EditorUIContext)
  if (!context) {
    throw new Error("useEditorUI 必须在 EditorUIProvider 内使用")
  }
  return context
}
