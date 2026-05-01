import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("Heatmap tooltip dismissal regressions", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/shared/ui/Heatmap.tsx"),
    "utf8"
  )

  it("clears the tooltip when a focused day cell blurs", () => {
    expect(source).toMatch(/onBlur=\{\(\) => setHoveredDate\(null\)\}/)
  })

  it("dismisses the tooltip when pointer interaction happens away from a day cell", () => {
    expect(source).toContain('document.addEventListener("pointerdown"')
    expect(source).toContain('closest("[data-heatmap-cell]")')
  })
})
