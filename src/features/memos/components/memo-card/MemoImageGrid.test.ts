import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "MemoImageGrid.tsx")
const source = readFileSync(sourcePath, "utf8")

describe("MemoImageGrid", () => {
  it("正文图片使用放大光标提示可预览", () => {
    expect(source).toContain("cursor-zoom-in")
    expect(source).toContain("ImageStackThumbnail")
    expect(source).toContain("ImageStackPreview")
    expect(source).toContain("isStacked")
    expect(source).toContain("{images.length} 张")
  })
})
