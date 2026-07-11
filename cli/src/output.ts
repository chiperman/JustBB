import type { MemoSummary } from "./types.js"

export function formatLogin({
  authorizeUrl,
  code,
  browserOpened,
}: {
  authorizeUrl: string
  code: string
  browserOpened: boolean
}) {
  return `${browserOpened ? "正在打开浏览器授权页面…" : "未能自动打开浏览器，请手动访问："}\n${authorizeUrl}\n\n授权码：${code}\n等待浏览器授权…`
}

export function formatPublish(memoNumber: number | undefined) {
  return `已发布 Memo #${memoNumber}`
}

export function formatWhoami(email: string | undefined, role: string) {
  return `${email || ""} (${role})`
}

function snippet(content: string) {
  const compact = content.replace(/\s+/g, " ").trim()
  return compact.length > 80 ? `${compact.slice(0, 80)}…` : compact
}

function tags(memo: MemoSummary) {
  return memo.tags && memo.tags.length > 0 ? `[${memo.tags.join(", ")}] ` : ""
}

export function formatSearch(memos: MemoSummary[]) {
  if (memos.length === 0) return "没有找到 Memo"

  return memos
    .map((memo) => {
      const date = memo.created_at.slice(0, 10)
      const locked = memo.is_locked ? "[私密] " : ""
      return `#${memo.memo_number}  ${date}  ${locked}${tags(memo)}${snippet(memo.content)}`
    })
    .join("\n")
}

export function formatShow(memo: MemoSummary) {
  const lines = [`#${memo.memo_number}  ${memo.created_at.slice(0, 10)}`]

  if (memo.is_locked) {
    lines.push("", "这是一条私密 Memo，正文已锁定。")
    if (memo.access_code_hint) lines.push(`口令提示：${memo.access_code_hint}`)
    lines.push("使用 justmemo show <编号> --unlock 查看完整内容。")
    return lines.join("\n")
  }

  lines.push("", memo.content || "（无正文）")
  if (memo.images && memo.images.length > 0) {
    lines.push("", "图片链接：", ...memo.images)
  }
  return lines.join("\n")
}
