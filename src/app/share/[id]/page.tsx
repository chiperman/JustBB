import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { getMemoById } from "@/server/actions/memos/query"
import { MemoContent } from "@/features/memos/components/MemoContent"
import { getPublicAppUrl } from "@/shared/lib/share"
import { isUuid } from "@/shared/lib/ids"
import { noIndexRobots, publicIndexRobots } from "@/shared/lib/page-metadata"
import { Button } from "@/shared/ui/button"

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
    <main className="min-h-screen bg-background px-4 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/60 sm:h-20">
          <Link
            href="/"
            aria-label="JustMemo"
            className="group inline-flex items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold tracking-tight text-primary outline-none transition-colors hover:text-(--active-clay) focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-[3px] bg-primary transition-transform group-hover:rotate-12"
            />
            JustMemo
          </Link>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="px-2 font-medium text-muted-foreground hover:text-foreground"
          >
            <Link href="/" aria-label="返回 JustMemo">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} aria-hidden="true" />
              返回 JustMemo
            </Link>
          </Button>
        </header>

        <section className="flex flex-1 items-start justify-center py-8 sm:py-12 lg:py-16">
          <article
            aria-label="Memo 正文"
            className="w-full max-w-3xl rounded-lg border border-border bg-card px-5 py-6 sm:px-10 sm:py-10 lg:px-14 lg:py-12"
          >
            <h1 className="sr-only">分享的 Memo #{memo.memo_number || memo.id.slice(0, 8)}</h1>

            <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:mb-8">
              <span className="rounded-md bg-(--memo-tag-bg) px-1.5 py-0.5 font-semibold text-(--memo-tag-text)">
                #{memo.memo_number || memo.id.slice(0, 8)}
              </span>
              <time dateTime={memo.created_at}>
                {format(new Date(memo.created_at), "PPP", { locale: zhCN })}
              </time>
            </div>

            <MemoContent
              content={memo.content}
              disablePreview
              className="text-[17px] leading-8 text-foreground sm:text-lg sm:leading-9"
            />

            {memo.tags && memo.tags.length > 0 && (
              <div
                aria-label="Memo 标签"
                className="mt-8 flex flex-wrap gap-2 border-t border-border/60 pt-5 sm:mt-10 sm:pt-6"
              >
                {memo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-(--memo-tag-bg) px-2 py-1 text-xs font-medium text-(--memo-tag-text)"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  )
}
