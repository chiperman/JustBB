// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"
import { render, fireEvent } from "@testing-library/react"
import { SearchInput } from "./SearchInput"

const mockReplace = vi.fn()
let currentParams = new URLSearchParams("tag=tag1&num=123")

let lastParamsStr = ""
let cachedParams: { get: (key: string) => string | null; toString: () => string } | null = null

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

describe("SearchInput Chip Interaction", () => {
  beforeEach(() => {
    mockReplace.mockClear()
    currentParams = new URLSearchParams("tag=tag1&num=123")
    lastParamsStr = ""
    cachedParams = null
  })

  it("focuses input when a chip is clicked to delete via the close button", () => {
    const { container, rerender } = render(<SearchInput />)

    const chips = container.querySelectorAll(".badge-text")
    expect(chips.length).toBe(2)
    const closeBtn = chips[0].querySelector("button") as HTMLButtonElement

    fireEvent.click(closeBtn)
    rerender(<SearchInput />)

    const input = container.querySelector("input")
    expect(document.activeElement).toBe(input)
  })

  it("focuses input and clears all chips when clear all button is clicked", () => {
    const { container, rerender } = render(<SearchInput />)

    const chipsBefore = container.querySelectorAll(".badge-text")
    expect(chipsBefore.length).toBe(2)

    // Find "清除全部" button by text content
    const clearAllBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "清除全部"
    ) as HTMLButtonElement
    expect(clearAllBtn).toBeDefined()

    fireEvent.click(clearAllBtn)
    rerender(<SearchInput />)

    const chipsAfter = container.querySelectorAll(".badge-text")
    expect(chipsAfter.length).toBe(0)

    const input = container.querySelector("input")
    expect(document.activeElement).toBe(input)
  })

  it("parses multiple whitespace-separated directives (Scenario A) and updates search parameters accordingly", () => {
    currentParams = new URLSearchParams("")
    const { container, rerender } = render(<SearchInput />)

    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "32 t:da" } })
    fireEvent.keyDown(input, { key: "Enter" })

    rerender(<SearchInput />)

    expect(currentParams.get("tag")).toBe("da")
    expect(currentParams.get("query")).toBe("32")
    expect(input.value).toBe("32")
  })
})
