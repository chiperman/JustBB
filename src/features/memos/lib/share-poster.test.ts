import { describe, expect, it } from "vitest"
import { canShareMemo, getPosterImageSource, getPosterLinkLabel } from "./share-poster"

describe("canShareMemo", () => {
  it("公开 Memo 对游客也显示分享入口", () => {
    expect(canShareMemo(false)).toBe(true)
  })

  it("私密 Memo 不显示分享入口", () => {
    expect(canShareMemo(true)).toBe(false)
  })
})

describe("getPosterImageSource", () => {
  it("正文中的首张图片优先于后续图片和附件", () => {
    expect(
      getPosterImageSource({
        content:
          "开头 ![首图](https://images.example.com/first.jpg) 中间 🔗[第二张](https://images.example.com/second.jpg|image)",
        images: ["https://images.example.com/attachment.jpg"],
      })
    ).toBe("https://images.example.com/first.jpg")
  })

  it("正文没有内嵌图片时回退到附件首图", () => {
    expect(
      getPosterImageSource({
        content: "只有完整正文与 https://example.com/article 的链接",
        images: [
          "https://images.example.com/attachment.jpg",
          "https://images.example.com/later.jpg",
        ],
      })
    ).toBe("https://images.example.com/attachment.jpg")
  })

  it("没有图片时不返回资源地址", () => {
    expect(getPosterImageSource({ content: "纯文本", images: [] })).toBeNull()
  })
})

describe("getPosterLinkLabel", () => {
  it("将正文中的长链接收敛为可读域名", () => {
    expect(
      getPosterLinkLabel("https://bestdesignsonx.com/sorenblank/status/2024745061423214826")
    ).toBe("bestdesignsonx.com")
  })
})
