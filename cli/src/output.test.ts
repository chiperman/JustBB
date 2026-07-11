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
        browserOpened: true,
      })
    ).toBe(
      "正在打开浏览器授权页面…\nhttps://example.com/cli/authorize?request=abc\n\n授权码：A7K2P9\n等待浏览器授权…"
    )
  })

  it("发布和身份输出保持 CLI 文案", () => {
    expect(formatPublish(42)).toBe("已发布 Memo #42")
    expect(formatWhoami("cli@example.com", "member")).toBe("cli@example.com (member)")
  })

  it("搜索输出简洁摘要", () => {
    expect(formatSearch([memo])).toBe("#123  2026-07-11  [旅行] 今天去了上海")
  })

  it("完整查看输出图片原始 URL", () => {
    expect(formatShow(memo)).toContain("https://example.com/photo.jpg")
    expect(formatShow(memo)).toContain("图片链接：")
  })

  it("锁定 Memo 输出提示而不输出正文", () => {
    const locked = { ...memo, content: "SECRET", is_locked: true, access_code_hint: "生日" }
    const output = formatShow(locked)

    expect(output).toContain("口令提示：生日")
    expect(output).not.toContain("SECRET")
  })
})
