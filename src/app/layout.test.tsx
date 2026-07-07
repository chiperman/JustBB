import { renderToStaticMarkup } from "react-dom/server"
import type { ReactNode } from "react"
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

import RootLayout from "./layout"

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
})
