import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "LoginTransitionWrapper.tsx")
const source = readFileSync(sourcePath, "utf8")

function expectSourceToContain(value: string): void {
  expect(source).toContain(value)
}

function expectSourceNotToContain(value: string): void {
  expect(source).not.toContain(value)
}

describe("LoginTransitionWrapper", () => {
  it("does not use a timed CARD_VIEW intermediate state", () => {
    expectSourceNotToContain("CARD_VIEW")
    expectSourceNotToContain("setTimeout(")
  })

  it("keeps desktop split-view motion intact while adding mobile panel motion", () => {
    expectSourceToContain('x: "-100%"')
    expectSourceToContain("w-[50%]")
    expectSourceToContain("login-card-shell")
    expectSourceToContain("home-card-shell")
    expectSourceToContain("isolate")
    expectSourceToContain('backgroundColor: "var(--card)"')
    expectSourceToContain("MOBILE_LOGIN_PANEL_VARIANTS")
    expectSourceToContain("MOBILE_BACKDROP_VARIANTS")
  })

  it("slides the login card without fading the shell opacity", () => {
    expectSourceToContain('home: {\n    x: "-100%",\n    scale: 0.9,\n    opacity: 1,')
    expectSourceNotToContain('home: {\n    x: "-100%",\n    scale: 0.9,\n    opacity: 0,')
  })

  it("keeps the login shell surface styles stable and adds mobile sheet behavior", () => {
    expectSourceToContain('backgroundColor: "var(--card)"')
    expectSourceNotToContain('backgroundColor: "#ffffff"')
    expectSourceToContain("const homeCardBackgroundColor = isSplitView")
    expectSourceToContain('y: "100%"')
    expectSourceNotToContain('boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"')
  })

  it("uses the mobile safe area without rendering the desktop card border", () => {
    expectSourceToContain("pt-[env(safe-area-inset-top)]")
    expectSourceToContain("min-h-[100dvh] w-full flex-col border-0 pt-[env(safe-area-inset-top)]")
    expectSourceToContain("flex-1 md:min-h-0 md:h-full")
    expectSourceToContain("border-0 md:border md:border-border/60")
  })

  it("lets mobile Safari own document scrolling while keeping desktop app scrolling", () => {
    expectSourceToContain("relative isolate min-h-[100dvh]")
    expectSourceToContain("md:fixed md:inset-0")
    expectSourceToContain('className="relative z-10 min-h-[100dvh]"')
  })

  it("uses one server and client initial layout before detecting the viewport", () => {
    expectSourceToContain("const [isMobile, setIsMobile] = useState(false)")
  })
})
