// @vitest-environment jsdom

import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { EditorUIProvider, useEditorUI } from "./EditorUIContext"

function wrapper({ children }: { children: ReactNode }) {
  return <EditorUIProvider>{children}</EditorUIProvider>
}

describe("EditorUIContext", () => {
  it("初始没有任何弹窗打开，编辑器未聚焦", () => {
    const { result } = renderHook(() => useEditorUI(), { wrapper })

    expect(result.current.isAnyDialogOpen).toBe(false)
    expect(result.current.isFocused).toBe(false)
  })

  it("任一弹窗打开时 isAnyDialogOpen 派生为 true", () => {
    const { result } = renderHook(() => useEditorUI(), { wrapper })

    act(() => result.current.setShowLocationPicker(true))
    expect(result.current.isAnyDialogOpen).toBe(true)

    act(() => result.current.setShowLocationPicker(false))
    expect(result.current.isAnyDialogOpen).toBe(false)

    act(() => result.current.setPasteMenuPosition({ top: 10, left: 20 }))
    expect(result.current.isAnyDialogOpen).toBe(true)

    act(() => result.current.setPasteMenuPosition(null))
    expect(result.current.isAnyDialogOpen).toBe(false)
  })

  it("多个弹窗需全部关闭后 isAnyDialogOpen 才为 false", () => {
    const { result } = renderHook(() => useEditorUI(), { wrapper })

    act(() => {
      result.current.setShowPrivateDialog(true)
      result.current.setShowLinkPicker(true)
    })
    act(() => result.current.setShowPrivateDialog(false))
    expect(result.current.isAnyDialogOpen).toBe(true)

    act(() => result.current.setShowLinkPicker(false))
    expect(result.current.isAnyDialogOpen).toBe(false)
  })

  it("provider 外使用抛出明确错误", () => {
    expect(() => renderHook(() => useEditorUI())).toThrow(
      "useEditorUI 必须在 EditorUIProvider 内使用"
    )
  })
})
