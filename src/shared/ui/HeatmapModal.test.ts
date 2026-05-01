import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("HeatmapModal tooltip positioning regressions", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/shared/ui/HeatmapModal.tsx"),
    "utf8"
  )

  it("tracks tooltip placement with container-relative offsets", () => {
    expect(source).toContain("getBoundingClientRect()")
    expect(source).toContain(".heatmap-modal-tooltip-wrapper")
    expect(source).toContain("rect.left - containerRect.left + rect.width / 2")
    expect(source).toContain("absolute z-[999]")
    expect(source).toContain('align: "left" | "center" | "right"')
    expect(source).not.toContain("fixed z-[999]")
    expect(source).not.toContain("clientX")
    expect(source).not.toContain("clientY")
  })

  it("anchors tooltip updates to hovered cells instead of tracking mousemove", () => {
    expect(source).not.toContain("onMouseMove")
    expect(source).toContain("onMouseEnter")
    expect(source).toContain("setHoveredDay")
  })

  it("uses the shared admin dialog shell instead of a custom oversized canvas modal", () => {
    expect(source).toContain('from "@/shared/ui/AdminDialogShell"')
    expect(source).toContain("<AdminDialogShell")
    expect(source).not.toContain("max-w-6xl h-[90vh]")
  })
})
