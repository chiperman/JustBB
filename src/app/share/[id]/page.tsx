import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { getMemoById } from "@/server/actions/memos/query"
import { MemoContent } from "@/features/memos/components/MemoContent"
import { getPublicAppUrl } from "@/shared/lib/share"
import { isUuid } from "@/shared/lib/ids"
import { noIndexRobots, publicIndexRobots } from "@/shared/lib/page-metadata"

type SharePageProps = {
  params: Promise<{
    id: string
  }>
}

const getSnippet = (content: string, length: number) => {
  const normalized = content.replace(/\s+/g, " ").trim()
  if (normalized.length <= length) {
    return normalized
  }

  return `${normalized.slice(0, length).trim()}...`
}

const unavailableShareDescription = "这条 Memo 不存在，或当前状态不允许公开分享。"

const unavailableShareMetadata: Metadata = {
  title: "分享内容不可用",
  description: unavailableShareDescription,
  robots: noIndexRobots,
  openGraph: {
    title: "分享内容不可用",
    description: unavailableShareDescription,
  },
  twitter: {
    card: "summary",
    title: "分享内容不可用",
    description: unavailableShareDescription,
  },
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params

  if (!isUuid(id)) {
    return unavailableShareMetadata
  }

  const result = await getMemoById(id)
  const memo = result.success ? result.data : null

  if (!memo || memo.is_private || memo.is_locked) {
    return unavailableShareMetadata
  }

  const title = `JustMemo 分享 #${memo.memo_number || id.slice(0, 8)}`
  const description = getSnippet(memo.content, 120)
  const baseUrl = getPublicAppUrl()
  const canonical = baseUrl ? `${baseUrl}/share/${memo.id}` : undefined

  return {
    title,
    description,
    robots: publicIndexRobots,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default async function MemoSharePage({ params }: SharePageProps) {
  const { id } = await params

  if (!isUuid(id)) {
    notFound()
  }

  const result = await getMemoById(id)

  if (!result.success) {
    throw new Error(result.error || "获取分享内容失败")
  }

  const memo = result.data

  if (!memo) {
    notFound()
  }

  if (memo.is_private || memo.is_locked) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fffaf5_100%)] px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
            JustMemo Share
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">分享的 Memo</h1>
          <p className="text-sm text-stone-500">
            {format(new Date(memo.created_at), "PPP", { locale: zhCN })}
          </p>
        </div>

        <article className="rounded-[28px] border border-stone-200/80 bg-white/92 p-6-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <MemoContent
            content={memo.content}
            disablePreview
            className="text-[15px] leading-8 text-stone-700"
          />

          {memo.tags && memo.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-5">
              {memo.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-950"
          >
            打开 JustMemo
          </Link>
        </div>
      </div>
    </main>
  )
}
