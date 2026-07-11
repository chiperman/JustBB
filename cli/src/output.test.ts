import { describe, expect, it } from "vitest"
import { formatLogin, formatPublish, formatSearch, formatShow, formatWhoami } from "./output.js"

const memo = {
  id: "memo-1",
  memo_number: 123,
  content: "今天去了上海",
  tags: ["旅行"],
  created_at: "2026-07-11T00:00:00.000Z",
  is_locked: false,
  images: ["https://example.com/photo.jpg"],
}

describe("CLI output", () => {
  it("登录输出包含授权信息", () => {
    expect(
      formatLogin({
        authorizeUrl: "https://example.com/cli/authorize?request=abc",
        code: "A7K2P9",
      })
    ).toBe(
      "Open this URL in your browser:\nhttps://example.com/cli/authorize?request=abc\n\nAuthorization code: A7K2P9"
    )
  })

  it("发布和身份输出保持 CLI 文案", () => {
    expect(formatPublish(42)).toBe("Published Memo #42")
    expect(formatWhoami("cli@example.com", "member")).toBe("cli@example.com (member)")
  })

  it("搜索输出简洁摘要", () => {
    expect(formatSearch([memo])).toBe("#123  2026-07-11 [旅行]  今天去了上海")
  })

  it("搜索结果标记置顶 Memo", () => {
    expect(formatSearch([{ ...memo, is_pinned: true }])).toBe(
      "#123  2026-07-11 [旅行]  📌 今天去了上海"
    )
  })

  it("完整查看输出图片原始 URL", () => {
    expect(formatShow(memo)).toContain("https://example.com/photo.jpg")
    expect(formatShow(memo)).toContain("Image URLs:")
  })

  it("锁定 Memo 输出提示而不输出正文", () => {
    const locked = { ...memo, content: "SECRET", is_locked: true, access_code_hint: "生日" }
    const output = formatShow(locked)

    expect(output).toContain("Access code hint: 生日")
    expect(output).not.toContain("SECRET")
  })
})
