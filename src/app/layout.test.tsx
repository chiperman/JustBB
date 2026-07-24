import { renderToStaticMarkup } from "react-dom/server"
import type { ReactNode } from "react"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/shared/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock("@/shared/providers/PWARegistration", () => ({
  PWARegistration: () => null,
}))

vi.mock("@/shared/ui/toaster", () => ({
  Toaster: () => null,
}))

vi.mock("@/shared/ui/EnvErrorBanner", () => ({
  EnvErrorBanner: () => null,
}))

vi.mock("@/shared/ui/tooltip", () => ({
  TooltipProvider: ({
    children,
    delayDuration,
    skipDelayDuration,
  }: {
    children: ReactNode
    delayDuration?: number
    skipDelayDuration?: number
  }) => (
    <div data-delay-duration={delayDuration} data-skip-delay-duration={skipDelayDuration}>
      {children}
    </div>
  ),
}))

import RootLayout, { viewport } from "./layout"

describe("RootLayout", () => {
  it("设置首次 hover 延迟和相邻提示即时切换", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>content</main>
      </RootLayout>
    )

    expect(html).toContain('data-delay-duration="600"')
    expect(html).toContain('data-skip-delay-duration="0"')
  })

  it("为浅色和深色系统区域提供与页面一致的主题色", () => {
    expect(viewport).toMatchObject({
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f8f8f8" },
        { media: "(prefers-color-scheme: dark)", color: "#131211" },
      ],
      viewportFit: "cover",
    })

    const manifest = JSON.parse(
      readFileSync(path.join(process.cwd(), "public/manifest.json"), "utf8")
    )
    expect(manifest.background_color).toBe("#f8f8f8")
    expect(manifest.theme_color).toBe("#f8f8f8")
  })
})
