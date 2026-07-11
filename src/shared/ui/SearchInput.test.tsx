// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import React, { forwardRef } from "react"
import { render, fireEvent, screen } from "@testing-library/react"

import { SearchInput } from "./SearchInput"
import { TooltipProvider } from "./tooltip"
import type { ShortcutRegistration } from "@/shared/shortcuts/types"

const mockReplace = vi.fn()
let currentParams = new URLSearchParams("tag=tag1&num=123")

let lastParamsStr = ""
let cachedParams: { get: (key: string) => string | null; toString: () => string } | null = null
const shortcutRegistrations = vi.hoisted(() => [] as ShortcutRegistration[])

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: (url: string) => {
      mockReplace(url)
      const queryStr = url.includes("?") ? url.substring(url.indexOf("?") + 1) : ""
      currentParams = new URLSearchParams(queryStr)
    },
  }),
  useSearchParams: () => {
    const currentStr = currentParams.toString()
    if (currentStr !== lastParamsStr || !cachedParams) {
      lastParamsStr = currentStr
      cachedParams = {
        get: (key: string) => currentParams.get(key),
        toString: () => currentParams.toString(),
      }
    }
    return cachedParams
  },
}))

vi.mock("@/shared/shortcuts/useShortcut", () => ({
  useShortcut: (shortcut: ShortcutRegistration) => {
    shortcutRegistrations.push(shortcut)
  },
}))

vi.mock("framer-motion", () => {
  const MockDiv = forwardRef(
    (
      { children, ...props }: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>
    ) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  )
  MockDiv.displayName = "MockDiv"

  const MockButton = forwardRef(
    (
      { children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>,
      ref: React.Ref<HTMLButtonElement>
    ) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  )
  MockButton.displayName = "MockButton"

  const MockAnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>

  return {
    motion: {
      div: MockDiv,
      button: MockButton,
    },
    AnimatePresence: MockAnimatePresence,
  }
})

describe("SearchInput Chip Interaction", () => {
  beforeEach(() => {
    mockReplace.mockClear()
    currentParams = new URLSearchParams("tag=tag1&num=123")
    lastParamsStr = ""
    cachedParams = null
    shortcutRegistrations.length = 0
  })

  it("registers Command/Ctrl+K shortcut to focus the search input", () => {
    render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const input = screen.getByLabelText("搜索 Memo")
    const shortcut = shortcutRegistrations.find((item) => item.id === "search.focus")

    expect(shortcut).toMatchObject({
      binding: "mod+k",
      preventDefault: true,
    })

    shortcut?.handler(new KeyboardEvent("keydown", { key: "k", metaKey: true }))

    expect(document.activeElement).toBe(input)
  })

  it("按 Escape 会取消搜索框焦点", () => {
    render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const input = screen.getByLabelText("搜索 Memo")
    input.focus()
    fireEvent.keyDown(input, { key: "Escape" })

    expect(document.activeElement).not.toBe(input)
  })

  it("focuses input when a chip is clicked to delete via the close button", () => {
    const { container, rerender } = render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const chips = container.querySelectorAll(".badge-text")
    expect(chips.length).toBe(2)
    const closeBtn = chips[0].querySelector("button") as HTMLButtonElement

    fireEvent.click(closeBtn)
    rerender(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const input = container.querySelector("input")
    expect(document.activeElement).toBe(input)
  })

  it("focuses input and clears all chips when clear all button is clicked", () => {
    const { container, rerender } = render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const chipsBefore = container.querySelectorAll(".badge-text")
    expect(chipsBefore.length).toBe(2)

    // Find "重置" button by text content
    const clearAllBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "重置"
    ) as HTMLButtonElement
    expect(clearAllBtn).toBeDefined()

    fireEvent.click(clearAllBtn)
    rerender(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const chipsAfter = container.querySelectorAll(".badge-text")
    expect(chipsAfter.length).toBe(0)

    const input = container.querySelector("input")
    expect(document.activeElement).toBe(input)
  })

  it("parses multiple whitespace-separated directives (Scenario A) and updates search parameters accordingly", () => {
    currentParams = new URLSearchParams("")
    const { container, rerender } = render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "32 t:da" } })
    fireEvent.keyDown(input, { key: "Enter" })

    rerender(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    expect(currentParams.get("tag")).toBe("da")
    expect(currentParams.get("query")).toBe("32")
    expect(input.value).toBe("32")
  })

  it("does not display tooltip when chip label is not truncated", () => {
    const spyScroll = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(100)
    const spyOffset = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(150)

    currentParams = new URLSearchParams("tag=short-tag")
    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <SearchInput />
      </TooltipProvider>
    )

    const span = container.querySelector("span.truncate")
    expect(span).not.toBeNull()

    // 模拟 hover
    fireEvent.pointerOver(span!)
    fireEvent.pointerEnter(span!)
    fireEvent.focus(span!)

    const tooltip = screen.queryByRole("tooltip")
    expect(tooltip).toBeNull()

    spyScroll.mockRestore()
    spyOffset.mockRestore()
  })

  it("displays tooltip when chip label is truncated", () => {
    const spyScroll = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(200)
    const spyOffset = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(150)

    currentParams = new URLSearchParams("tag=very-very-long-tag-name-that-should-be-truncated")
    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <SearchInput />
      </TooltipProvider>
    )

    const span = container.querySelector("span.truncate")
    expect(span).not.toBeNull()

    // 模拟 hover
    fireEvent.pointerOver(span!)
    fireEvent.pointerEnter(span!)
    fireEvent.focus(span!)

    const tooltip = screen.queryByRole("tooltip")
    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toBe("very-very-long-tag-name-that-should-be-truncated")

    spyScroll.mockRestore()
    spyOffset.mockRestore()
  })

  it("should support multiple tags and nums search from inputs", () => {
    currentParams = new URLSearchParams("")
    const { container, rerender } = render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "t:a t:b n:100 n:200 hello" } })
    fireEvent.keyDown(input, { key: "Enter" })

    rerender(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    // 期望 URL 参数里含有逗号分隔的多标签和多编号
    expect(currentParams.get("tag")).toBe("a,b")
    expect(currentParams.get("num")).toBe("100,200")
    expect(currentParams.get("query")).toBe("hello")
    expect(input.value).toBe("hello")

    // 应该渲染出对应的多标签 Chips
    const chips = container.querySelectorAll(".badge-text")
    expect(chips.length).toBe(4) // a, b, 100, 200
  })

  it("should support deleting a single tag/num from multiple active tags/nums", () => {
    currentParams = new URLSearchParams("tag=a,b&num=100,200")
    const { container, rerender } = render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    const chips = container.querySelectorAll(".badge-text")
    expect(chips.length).toBe(4)

    // 精确找到文本包含 "b" 的那个 Chip 并点击其关闭按钮
    const bChip = Array.from(chips).find((chip) => chip.textContent?.includes("b"))
    expect(bChip).toBeDefined()
    const closeBtn = bChip!.querySelector("button") as HTMLButtonElement
    fireEvent.click(closeBtn)

    rerender(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    // 验证 tag 参数只剩 a，而 num 参数仍然是 100,200
    expect(currentParams.get("tag")).toBe("a")
    expect(currentParams.get("num")).toBe("100,200")
  })

  it("should support toggling tagMode AND/OR when multiple tags are present", () => {
    currentParams = new URLSearchParams("tag=a,b")
    const { container, rerender } = render(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    // 当有 2 个标签时，应该显示 AND / OR 模式切换按钮，并且默认是 AND
    let modeBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "AND" || btn.textContent === "OR"
    ) as HTMLButtonElement
    expect(modeBtn).toBeDefined()
    expect(modeBtn.textContent).toBe("AND")

    // 点击切换为 OR
    fireEvent.click(modeBtn)

    rerender(
      <TooltipProvider>
        <SearchInput />
      </TooltipProvider>
    )

    // 验证 URL 参数中 tagMode 变成 or
    expect(currentParams.get("tagMode")).toBe("or")
    modeBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "AND" || btn.textContent === "OR"
    ) as HTMLButtonElement
    expect(modeBtn.textContent).toBe("OR")

    // 再次点击切换为 AND
    fireEvent.click(modeBtn)
    expect(currentParams.get("tagMode")).toBeNull() // AND 默认状态下不写入 URL
  })
})
