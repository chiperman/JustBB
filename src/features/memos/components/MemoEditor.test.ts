import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "MemoEditor.tsx")
const source = readFileSync(sourcePath, "utf8")
const layoutSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "MemoEditorLayout.tsx"),
  "utf8"
)

describe("MemoEditor collapse animation", () => {
  it("does not disable collapse animation for scroll-triggered collapse", () => {
    expect(source).toMatch(/const shouldAnimateCollapse\s*=\s*enableCollapseAnimation\b/)
    expect(source).not.toMatch(
      /const shouldAnimateCollapse\s*=\s*enableCollapseAnimation\s*&&\s*!scrollCollapsed\b/
    )
  })

  it("解除 inert 折叠状态后再聚焦编辑器", () => {
    expect(layoutSource).toMatch(/aria-label="展开 Memo 编辑器"[\s\S]*?onClick=\{onEditorClick\}/)
    expect(source).toMatch(
      /onEditorClick=\{\(\) => \{\s*setIsFocused\(true\)\s*window\.requestAnimationFrame\(\(\) => \{\s*editor\?\.commands\.focus\("end"\)/
    )
  })
})
