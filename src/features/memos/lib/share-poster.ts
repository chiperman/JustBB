import { parseContentTokens } from "@/shared/lib/contentParser"

interface PosterImageSourceInput {
  content: string
  images?: string[] | null
}

/** 公开 Memo 可由作者和访客生成分享海报；私密 Memo 一律不提供入口。 */
export function canShareMemo(isPrivate: boolean) {
  return !isPrivate
}

/** 海报只展示链接身份，不把冗长 URL 作为正文内容。 */
export function getPosterLinkLabel(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return value
  }
}

/**
 * 海报只使用正文阅读顺序中的第一张图片；没有内嵌图片时才回退附件首图。
 */
export function getPosterImageSource({ content, images }: PosterImageSourceInput): string | null {
  const inlineImage = parseContentTokens(content).find(
    (token) => token.type === "image" || (token.type === "markupLink" && token.mode === "image")
  )

  if (inlineImage?.type === "image") return inlineImage.url
  if (inlineImage?.type === "markupLink") return inlineImage.url

  return images?.[0] ?? null
}
