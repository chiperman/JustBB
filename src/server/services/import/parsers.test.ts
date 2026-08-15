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

  it("保留 LeanCloud 的多个独立标签，并按正文后缀写入", () => {
    const content = JSON.stringify({
      content: "原始正文",
      tag: "# 👎吐槽 # 技术",
      createdAt: "2026-07-16T00:00:00.000Z",
    })

    expect(parseLeanCloud(content)).toEqual([
      expect.objectContaining({
        content: "原始正文 #👎吐槽 #技术",
        tags: ["👎吐槽", "技术"],
      }),
    ])
  })

  it("正文已包含完整标签后缀时不重复追加", () => {
    const content = JSON.stringify({
      content: "原始正文 #单独标签",
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
