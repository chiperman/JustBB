import { describe, expect, it } from "vitest"

import { parseLeanCloud } from "./parsers"

describe("parseLeanCloud", () => {
  it("将独立 tag 追加到正文末尾", () => {
    const content = JSON.stringify({
      content: "原始正文",
      tag: "# 单独标签",
      createdAt: "2026-07-16T00:00:00.000Z",
    })

    expect(parseLeanCloud(content)).toEqual([
      expect.objectContaining({
        content: "原始正文 #单独标签",
        tags: ["单独标签"],
      }),
    ])
  })
})
