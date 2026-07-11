import type { MemoSummary } from "./types.js"

export function formatLogin({ authorizeUrl, code }: { authorizeUrl: string; code: string }) {
  return `Open this URL in your browser:\n${authorizeUrl}\n\nAuthorization code: ${code}`
}

export function formatPublish(memoNumber: number | undefined) {
  return `Published Memo #${memoNumber}`
}

export function formatWhoami(email: string | undefined, role: string) {
  return `${email || ""} (${role})`
}

function snippet(content: string) {
  const compact = content.replace(/\s+/g, " ").trim()
  return compact.length > 80 ? `${compact.slice(0, 80)}…` : compact
}

export function formatSearch(memos: MemoSummary[]) {
  if (memos.length === 0) return "No memos found."

  return memos
    .map((memo) => {
      const date = memo.created_at.slice(0, 10)
      const locked = memo.is_locked ? "[Private] " : ""
      const pinned = memo.is_pinned ? "📌 " : ""
      const tags = memo.is_locked || !memo.tags?.length ? "" : ` [${memo.tags.join(" · ")}]`
      return `#${memo.memo_number}  ${date}${tags}  ${pinned}${locked}${snippet(memo.content)}`
    })
    .join("\n")
}

export function formatShow(memo: MemoSummary) {
  const lines = [`#${memo.memo_number}  ${memo.created_at.slice(0, 10)}`]

  if (memo.is_locked) {
    lines.push("", "This Memo is private and its content is locked.")
    if (memo.access_code_hint) lines.push(`Access code hint: ${memo.access_code_hint}`)
    lines.push("Run justmemo show <number> --unlock to view the full content.")
    return lines.join("\n")
  }

  lines.push("", memo.content || "(No content)")
  if (memo.images && memo.images.length > 0) {
    lines.push("", "Image URLs:", ...memo.images)
  }
  return lines.join("\n")
}
