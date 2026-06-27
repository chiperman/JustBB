// @vitest-environment jsdom

import { useMemo } from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ShortcutProvider } from "./ShortcutProvider"
import { useShortcut } from "./useShortcut"

function RegisteredShortcut({
  handler,
  allowBrowserReservedShortcut = false,
}: {
  handler: () => void
  allowBrowserReservedShortcut?: boolean
}) {
  const shortcut = useMemo(
    () => ({
      id: "test.shortcut",
      binding: "mod+a",
      handler,
      allowBrowserReservedShortcut,
    }),
    [allowBrowserReservedShortcut, handler]
  )

  useShortcut(shortcut)

  return null
}

describe("ShortcutProvider", () => {
  it("分发真实 keydown 事件到已注册快捷键", () => {
    const handler = vi.fn()
    render(
      <ShortcutProvider>
        <RegisteredShortcut handler={handler} allowBrowserReservedShortcut />
      </ShortcutProvider>
    )

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", metaKey: true }))

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("默认不会在输入框里触发全局快捷键", () => {
    const handler = vi.fn()
    render(
      <ShortcutProvider>
        <input aria-label="输入" />
        <RegisteredShortcut handler={handler} allowBrowserReservedShortcut />
      </ShortcutProvider>
    )

    const input = document.querySelector("input")
    input?.dispatchEvent(new KeyboardEvent("keydown", { key: "a", metaKey: true, bubbles: true }))

    expect(handler).not.toHaveBeenCalled()
  })
})
