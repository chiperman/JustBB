import { describe, expect, it, vi } from "vitest"
import { getExtensions, textToTiptapHtml } from "./extensions"

describe("textToTiptapHtml", () => {
  it("会对 smart-link 的标题和 URL 做 HTML 转义", () => {
    const html = textToTiptapHtml(
      '🔗[Fish & "Chips" <Menu>](https://example.com?q=fish&lang=zh|card)'
    )

    expect(html).toContain('data-type="markupLink"')
    expect(html).toContain('data-mode="card"')
    expect(html).toContain(
      'data-label="Fish &amp; &quot;Chips&quot; &lt;Menu&gt;"'
    )
    expect(html).toContain('data-id="https://example.com?q=fish&amp;lang=zh"')
    expect(html).toContain(
      "🔗[Fish &amp; &quot;Chips&quot; &lt;Menu&gt;](https://example.com?q=fish&amp;lang=zh|card)"
    )
    expect(html).not.toContain('data-label="Fish & "Chips" <Menu>"')
  })
})

describe("getExtensions", () => {
  it("会让 markupLink 在退格删除时不残留触发字符", () => {
    const extensions = getExtensions({
      shouldAllowMentionSuggestion: () => true,
      onMentionStart: vi.fn(),
      onMentionUpdate: vi.fn(),
      onMentionExit: vi.fn(),
      onMentionKeyDown: vi.fn(() => false),
      shouldAllowHashtagSuggestion: () => true,
      onHashtagStart: vi.fn(),
      onHashtagUpdate: vi.fn(),
      onHashtagExit: vi.fn(),
      onHashtagKeyDown: vi.fn(() => false),
    })

    const markupLink = extensions.find(
      (extension) => extension.name === "markupLink"
    )

    // 使用类型断言访问自定义配置项
    const options = markupLink?.options as unknown as Record<string, unknown>
    expect(options.deleteTriggerWithBackspace).toBe(true)
  })
})
