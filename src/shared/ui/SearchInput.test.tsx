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

describe("SearchInput Focus & Chip Interaction", () => {
  beforeEach(() => {
    mockReplace.mockClear()
    currentParams = new URLSearchParams("tag=tag1&num=123")
    lastParamsStr = ""
    cachedParams = null
  })

  it("handles backspace deletion on first chip and focuses the remaining chip", () => {
    const { container, rerender } = render(<SearchInput />)

    const chipsBefore = container.querySelectorAll("div[tabIndex='0']")
    expect(chipsBefore.length).toBe(2)

    const chip1 = chipsBefore[0] as HTMLDivElement
    expect(chip1.textContent).toContain("#tag1")

    chip1.focus()
    expect(document.activeElement).toBe(chip1)

    // Trigger Backspace keydown to remove chip1
    fireEvent.keyDown(chip1, { key: "Backspace" })

    // Rerender to simulate searchParams changes triggering state update
    rerender(<SearchInput />)

    const chipsAfter = container.querySelectorAll("div[tabIndex='0']")
    expect(chipsAfter.length).toBe(1)
    expect(chipsAfter[0].textContent).toContain("#123")

    // The focus should have transitioned to the remaining chip (index 0 now)
    expect(document.activeElement).toBe(chipsAfter[0])
  })

  it("focuses input when the only remaining chip is deleted via backspace", () => {
    currentParams = new URLSearchParams("tag=tag1")
    const { container, rerender } = render(<SearchInput />)

    const chips = container.querySelectorAll("div[tabIndex='0']")
    expect(chips.length).toBe(1)

    const chip1 = chips[0] as HTMLDivElement
    chip1.focus()

    fireEvent.keyDown(chip1, { key: "Backspace" })
    rerender(<SearchInput />)

    const input = container.querySelector("input")
    expect(document.activeElement).toBe(input)
  })

  it("focuses input when a chip is clicked to delete via the close button", () => {
    const { container, rerender } = render(<SearchInput />)

    const chips = container.querySelectorAll("div[tabIndex='0']")
    const closeBtn = chips[0].querySelector("button") as HTMLButtonElement

    fireEvent.click(closeBtn)
    rerender(<SearchInput />)

    const input = container.querySelector("input")
    expect(document.activeElement).toBe(input)
  })

  it("focuses input when backspace is pressed inside an empty input to delete the last chip", () => {
    const { container, rerender } = render(<SearchInput />)

    const input = container.querySelector("input") as HTMLInputElement
    input.focus()
    expect(document.activeElement).toBe(input)

    // Press Backspace in empty input
    fireEvent.keyDown(input, { key: "Backspace" })
    rerender(<SearchInput />)

    const chips = container.querySelectorAll("div[tabIndex='0']")
    expect(chips.length).toBe(1)
    expect(chips[0].textContent).toContain("#tag1") // The first one remains, last one (num=123) is deleted

    // Focus must still stay on the input
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
