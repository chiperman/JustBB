import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("YearlyStats annual card layout", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/shared/ui/YearlyStats.tsx"), "utf8")

  it("renders each year as its own card", () => {
    expect(source).toContain('className="flex flex-col gap-6"')
    expect(source).toContain(
      'className="space-y-6 rounded-2xl border border-border/70 bg-muted/45 p-5"'
    )
  })
})
