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
})
