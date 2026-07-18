export type ContentToken =
  | { type: "text"; value: string }
  | { type: "tag"; value: string }
  | { type: "ref"; value: string }
  | { type: "code"; value: string; lang?: string }
  | { type: "location"; value: string; name: string; lat: number; lng: number }
  | { type: "email"; value: string }
  | { type: "image"; value: string; alt: string; url: string }
  | { type: "link"; value: string }
  | {
      type: "markupLink"
      value: string
      title: string
      url: string
      mode?: "mention" | "pill" | "card" | "image"
    }

export function parseContentTokens(text: string): ContentToken[] {
  // 包含六种匹配模式，注意顺序，代码块优先：
  // 1. 代码块: ```lang ... ```
  // 2. 定位标记: 📍[地名](纬度,经度)
  // 3. 引用匹配: @数字
  // 4. Tag匹配: #标签 (不含空格，支持中文、字母数字与 Emoji)
  // 5. Email匹配: test@example.com
  // 6. Markdown 图片: ![替代文本](图片链接)
  // 7. 标记链接: 🔗[名称](链接|显示模式)
  // 8. 原始链接匹配: http(s)://...

  // 预处理：移除异常的调试用标签 (如 < a id=0 >, < span id=1 >)
  // 这些可能是历史数据中混入的 React/DevTools 调试残留
  const cleanText = text
    .replace(/<\s*(?:a|span)\s+id=\d+\s*>/g, "")
    .replace(/<\s*\/\s*(?:a|span)\s*>/g, "")

  // ─── 子模式定义 ────────────────────────────
  const PATTERNS = {
    codeBlock: /```(\w*)\n?([\s\S]*?)```/,
    location: /📍\[([^\]]+)\]\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/,
    ref: /(@\d+)/,
    tag: /(?<=^|\s|[^a-zA-Z0-9])(#[\p{L}\p{N}_\p{Extended_Pictographic}\uFE0F\u200D]+)/u,
    email: /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/,
    markdownImage: /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/,
    markupLink: /🔗\[([^\]]+)\]\(([^\s\|]+)(?:\|(pill|card|image))?\)/,
    link: /(https?:\/\/[^\s\u4e00-\u9fa5<]+[^\s\u4e00-\u9fa5<.,;:!?'"”’。，！？）】])/,
  } as const

  // 按优先级组合（代码块 > 定位 > 引用 > 标签 > 邮件 > Markdown 图片 > 标记链接 > 原始链接）
  const regex = new RegExp(
    Object.values(PATTERNS)
      .map((p) => p.source)
      .join("|"),
    "gu"
  )

  const tokens: ContentToken[] = []
  let lastIndex = 0

  cleanText.replace(
    regex,
    (
      match,
      lang,
      codeContent,
      locName,
      locLat,
      locLng,
      atRef,
      hashTag,
      email,
      markdownImageAlt,
      markdownImageUrl,
      markupLinkTitle,
      markupLinkUrl,
      markupLinkMode,
      rawLink,
      index
    ) => {
      // 添加匹配前的纯文本
      if (index > lastIndex) {
        tokens.push({ type: "text", value: cleanText.slice(lastIndex, index) })
      }

      if (codeContent !== undefined) {
        tokens.push({ type: "code", value: codeContent, lang: lang || "text" })
      } else if (locName !== undefined) {
        tokens.push({
          type: "location",
          value: match,
          name: locName,
          lat: parseFloat(locLat),
          lng: parseFloat(locLng),
        })
      } else if (atRef) {
        tokens.push({ type: "ref", value: atRef })
      } else if (hashTag) {
        tokens.push({ type: "tag", value: hashTag })
      } else if (email) {
        tokens.push({ type: "email", value: email })
      } else if (markdownImageUrl !== undefined) {
        tokens.push({
          type: "image",
          value: match,
          alt: markdownImageAlt || "图片",
          url: markdownImageUrl,
        })
      } else if (markupLinkTitle !== undefined && markupLinkUrl !== undefined) {
        tokens.push({
          type: "markupLink",
          value: match,
          title: markupLinkTitle,
          url: markupLinkUrl,
          mode: (markupLinkMode as "pill" | "card" | "image") || "mention",
        })
      } else if (rawLink) {
        tokens.push({ type: "link", value: rawLink })
      }

      lastIndex = index + match.length
      return match
    }
  )

  // 添加剩余文本
  if (lastIndex < cleanText.length) {
    tokens.push({ type: "text", value: cleanText.slice(lastIndex) })
  }

  return tokens
}
