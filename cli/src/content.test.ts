import { describe, expect, it } from "vitest"
import { preparePublishContent } from "./content.js"

describe("CLI 发布内容整理", () => {
  it("提取独立图片链接，保留正文和普通链接", () => {
    expect(
      preparePublishContent(
        "今天下雨了 #日记\nhttps://example.com\nhttps://example.com/photo.jpg\n"
      )
    ).toEqual({
      content: "今天下雨了 #日记\nhttps://example.com",
      images: ["https://example.com/photo.jpg"],
    })
  })

  it("提取正文中间的 WebP 图片链接，保留正文和 Tag", () => {
    expect(preparePublishContent("手动测试 https://example.com/photo.webp #manual")).toEqual({
      content: "手动测试 #manual",
      images: ["https://example.com/photo.webp"],
    })
  })
})
