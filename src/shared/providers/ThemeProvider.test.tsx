// @vitest-environment jsdom

import type { ReactNode } from "react"
import { render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const themeState = vi.hoisted(() => ({ resolvedTheme: "dark" }))

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useTheme: () => ({ resolvedTheme: themeState.resolvedTheme }),
}))

import { ThemeProvider } from "./ThemeProvider"

describe("ThemeProvider", () => {
  beforeEach(() => {
    themeState.resolvedTheme = "dark"
    document.head.innerHTML = [
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8f8f8">',
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#131211">',
    ].join("")
  })

  it("按应用当前主题同步浏览器系统区域颜色", async () => {
    const view = render(
      <ThemeProvider>
        <main>content</main>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
          (meta) => meta.content
        )
      ).toEqual(["#131211", "#131211"])
    })

    themeState.resolvedTheme = "light"
    view.rerender(
      <ThemeProvider>
        <main>content</main>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
          (meta) => meta.content
        )
      ).toEqual(["#f8f8f8", "#f8f8f8"])
    })
  })
})
