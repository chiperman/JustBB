"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { parseContentTokens } from "@/shared/lib/contentParser"
import { getMemoShareUrl } from "@/shared/lib/share"
import { getPosterImageSource, getPosterLinkLabel } from "@/features/memos/lib/share-poster"
import type { Memo } from "@/types/memo"
import type { PosterTheme } from "@/types/export"
import { cn } from "@/shared/lib/utils"

interface PosterDocumentProps {
  memo: Memo
  theme: PosterTheme
  showBrand: boolean
  showDate: boolean
  showQR: boolean
  onReady?: () => void
}

function PosterBody({ content, themeId }: { content: string; themeId: string }) {
  const textClass =
    themeId === "classic" ? "font-mono" : themeId === "midnight" ? "font-sans" : "font-serif"

  return (
    <div className={cn("whitespace-pre-wrap break-words", textClass)}>
      {parseContentTokens(content).map((token, index) => {
        if (token.type === "image" || (token.type === "markupLink" && token.mode === "image")) {
          return null
        }
        if (token.type === "code") {
          return (
            <pre
              key={index}
              className="my-3 overflow-hidden border-l-2 border-current/25 pl-3 text-[0.82em]"
            >
              {token.value}
            </pre>
          )
        }
        if (token.type === "location") return <span key={index}>📍{token.name}</span>
        if (token.type === "markupLink") {
          return (
            <span key={index} className="underline decoration-current/40 underline-offset-4">
              {token.title}
            </span>
          )
        }
        if (token.type === "link") {
          return (
            <span key={index} className="underline decoration-current/40 underline-offset-4">
              {getPosterLinkLabel(token.value)}
            </span>
          )
        }
        if (token.type === "email") {
          return (
            <span key={index} className="underline decoration-current/40 underline-offset-4">
              {token.value}
            </span>
          )
        }
        return <span key={index}>{token.value}</span>
      })}
    </div>
  )
}

function PosterImage({ src, className }: { src: string; className: string }) {
  const [unavailable, setUnavailable] = useState(false)

  if (unavailable) {
    return (
      <div className="mt-10 flex min-h-32 items-center justify-center border border-dashed border-current/25 px-6 text-center text-sm opacity-60">
        图片暂时无法载入，完整内容请前往分享页查看。
      </div>
    )
  }

  return <img src={src} alt="" className={className} onError={() => setUnavailable(true)} />
}

export function PosterDocument({
  memo,
  theme,
  showBrand,
  showDate,
  showQR,
  onReady,
}: PosterDocumentProps) {
  useEffect(() => onReady?.(), [onReady])
  const hasHeader = showBrand || showDate
  const imageSource = getPosterImageSource(memo)
  const imageSrc = imageSource
    ? `/api/share-poster-image?memoId=${encodeURIComponent(memo.id)}`
    : null
  const isClassic = theme.id === "classic"
  const isMidnight = theme.id === "midnight"
  const isZen = theme.id === "zen"

  return (
    <article
      className={cn(
        "poster-document relative w-[720px] overflow-hidden text-left antialiased",
        isClassic && "bg-[#f4eee5] p-12 text-[#3e3832]",
        isZen && "bg-[#fbfbfa] p-14 text-[#282522]",
        isMidnight && "bg-[#1d1b19] p-10 text-[#f5f1ed]"
      )}
    >
      {isClassic && <div className="absolute inset-y-0 left-12 w-px bg-[#c9816b]/35" />}
      {hasHeader && (
        <header
          className={cn(
            "relative flex items-baseline justify-between gap-6",
            isClassic && "mb-10 border-b border-[#b8aea2]/60 pb-5 pl-6",
            isZen && "mb-12 justify-center border-b border-[#ded8d1] pb-6 text-center",
            isMidnight && "mb-8 border-b border-white/20 pb-5"
          )}
        >
          {showBrand && (
            <span
              className={cn(
                "font-semibold uppercase",
                isClassic ? "tracking-[0.26em]" : "tracking-[0.16em]"
              )}
            >
              JustMemo
            </span>
          )}
          {showDate && (
            <time
              className={cn("font-mono text-xs opacity-55", isZen && "absolute right-0 bottom-6")}
            >
              {format(new Date(memo.created_at), "yyyy.MM.dd", { locale: zhCN })}
            </time>
          )}
        </header>
      )}

      <div
        className={cn(
          "relative",
          isClassic && "pl-6",
          isZen && "mx-auto max-w-[580px] text-center",
          isMidnight && "grid gap-7"
        )}
      >
        {isMidnight && imageSrc && (
          <PosterImage
            src={imageSrc}
            className="h-60 w-full rounded-xl border border-white/10 object-cover"
          />
        )}
        <div
          className={cn(
            "text-[28px] leading-[1.78]",
            isClassic && "text-[24px] leading-[1.9]",
            isZen && "text-[29px] leading-[1.9]",
            isMidnight && "text-[25px] leading-[1.82] text-white/88"
          )}
        >
          <PosterBody content={memo.content} themeId={theme.id} />
        </div>
        {!isMidnight && imageSrc && (
          <PosterImage
            src={imageSrc}
            className={cn(
              "mt-10 max-h-[520px] w-full object-cover",
              isClassic && "border border-[#b8aea2]/65",
              isZen && "mx-auto max-w-[520px] rounded-2xl border border-[#e5e0da]"
            )}
          />
        )}
      </div>

      {showQR && (
        <footer
          className={cn(
            "relative mt-12 flex items-end justify-end border-t pt-6",
            isClassic && "ml-6 border-[#b8aea2]/60",
            isZen && "border-[#ded8d1]",
            isMidnight && "border-white/20"
          )}
        >
          <div className={cn("rounded-lg p-2", isMidnight ? "bg-white" : "bg-white")}>
            <QRCodeSVG
              value={getMemoShareUrl(memo.id)}
              size={78}
              fgColor={isMidnight ? "#1d1b19" : "#302b27"}
              bgColor="transparent"
            />
          </div>
        </footer>
      )}
    </article>
  )
}
