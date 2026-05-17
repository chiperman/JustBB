"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"
import Link from "next/link"
import { parseContentTokens } from "@/shared/lib/contentParser"
import { CodeBlock } from "@/shared/ui/CodeBlock"
import { MemoHoverPreview } from "./MemoHoverPreview"
import { LocationHoverPreview } from "@/shared/ui/LocationHoverPreview"
import { useSearchParams } from "next/navigation"
import { ImageZoom } from "@/shared/ui/ImageZoom"
import { LinkPreview } from "@/shared/ui/LinkPreview"
import { SmartImage } from "@/shared/ui/SmartImage"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon as Check,
  Copy01Icon as Copy,
  Link01Icon,
} from "@hugeicons/core-free-icons"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/shared/ui/hover-card"
import { toast } from "@/shared/hooks/use-toast"

interface MemoContentProps {
  content: string
  className?: string
  disablePreview?: boolean
  style?: React.CSSProperties
}

export function MemoContent({
  content,
  className,
  disablePreview = false,
  style,
}: MemoContentProps) {
  const searchParams = useSearchParams()
  const searchQuery = searchParams?.get("q") || ""

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    toast({ title: "链接已拷贝" })
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight || !text) return text
    const parts = text.split(new RegExp(`(${highlight})`, "gi"))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={i}
              className="bg-[#fdf5f2] text-primary font-medium px-0.5 rounded-md mx-px"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const renderContent = (text: string) => {
    const tokens = parseContentTokens(text)

    return (
      <div role="presentation">
        {tokens.map((token, index) => {
          switch (token.type) {
            case "ref":
              const memoNum = token.value.slice(1)
              const linkElement = (
                <Link
                  href={`/?num=${memoNum}`}
                  className="text-primary hover:underline cursor-pointer font-mono bg-[#fdf5f2] px-1 rounded-md mx-0.5 my-0.5 inline-block align-middle focus-visible:ring-1 focus-visible:ring-primary/30 outline-none hover:bg-[#eecbc0] hover:ring-1 hover:ring-border/40 transition-colors"
                >
                  {token.value}
                </Link>
              )

              return disablePreview ? (
                <React.Fragment key={`ref-${index}`}>
                  {linkElement}
                </React.Fragment>
              ) : (
                <MemoHoverPreview
                  key={`ref-${index}`}
                  memoNumber={memoNum}
                  memoId={memoNum}
                >
                  {linkElement}
                </MemoHoverPreview>
              )
            case "tag":
              return (
                <Link
                  key={`tag-${index}`}
                  href={`/?tag=${encodeURIComponent(token.value.slice(1))}`}
                  className="mx-0.5 my-0.5 px-1 rounded-md font-mono font-medium text-[#2a9d99] bg-[#2a9d99]/5 transition-colors hover:text-[#2a9d99] hover:bg-[#2a9d99]/10 hover:underline hover:ring-1 hover:ring-border/40 focus-visible:ring-1 focus-visible:ring-[#2a9d99]/30 outline-none inline-block align-middle"
                >
                  {token.value}
                </Link>
              )
            case "image":
              return (
                <span
                  key={`img-${index}`}
                  className="block my-5 group relative max-w-full overflow-hidden"
                >
                  <div className="flex justify-center items-center">
                    <div className="relative rounded-md overflow-hidden ring-1 ring-border/70 transition-all duration-500 hover:scale-[1.01]">
                      <ImageZoom src={token.value}>
                        <SmartImage
                          src={token.value}
                          alt="Memo attachment"
                          containerClassName="max-h-[550px] w-full h-[300px]"
                          className="max-h-full max-w-full object-contain select-none"
                          loading="lazy"
                        />
                      </ImageZoom>
                    </div>
                  </div>
                </span>
              )
            case "code":
              return (
                <div key={`code-${index}`}>
                  <CodeBlock
                    language={token.lang || "typescript"}
                    value={token.value}
                  />
                </div>
              )
            case "location":
              const locElement = (
                <span className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded-md mx-0.5 my-0.5 align-middle hover:bg-primary/20 hover:ring-1 hover:ring-border/40 transition-colors">
                  <span className="text-sm">📍</span>
                  <span className="text-[13px] font-medium">{token.name}</span>
                </span>
              )

              return disablePreview ? (
                <React.Fragment key={`loc-${index}`}>
                  {locElement}
                </React.Fragment>
              ) : (
                <LocationHoverPreview
                  key={`loc-${index}`}
                  name={token.name}
                  lat={token.lat}
                  lng={token.lng}
                >
                  {locElement}
                </LocationHoverPreview>
              )
            case "markupLink":
              if (token.mode === "mention") {
                return (
                  <span
                    key={`mlink-${index}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-sm transition-colors group mx-0.5 my-0.5 align-middle"
                  >
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <a
                          href={token.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md hover:bg-primary/20 transition-colors cursor-pointer overflow-hidden"
                        >
                          <span>🔗</span>
                          <span className="truncate max-w-[200px]">
                            {token.title}
                          </span>
                        </a>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-0 overflow-hidden border-none">
                        <LinkPreview
                          url={token.url}
                          customTitle={token.title}
                          className="m-0 border-none-none rounded-none h-auto"
                        />
                      </HoverCardContent>
                    </HoverCard>
                    <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(e, token.url)}
                        className="p-1 hover:bg-primary/20 rounded-md transition-colors"
                        title="拷贝链接"
                        aria-label="拷贝链接"
                      >
                        <HugeiconsIcon icon={Copy} size={14} />
                      </button>
                    </div>
                  </span>
                )
              }

              if (token.mode === "pill") {
                return (
                  <span
                    key={`mlink-${index}`}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-card/50 hover:bg-accent/30 transition-all group mx-0.5 my-0.5 align-middle"
                  >
                    <a
                      href={token.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <HugeiconsIcon
                        icon={Link01Icon}
                        size={14}
                        className="text-muted-foreground/60"
                      />
                      <span className="text-xs text-foreground/80 font-medium truncate max-w-[200px]">
                        {token.title}
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(e, token.url)}
                      className="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      title="拷贝链接"
                      aria-label="拷贝链接"
                    >
                      <HugeiconsIcon icon={Copy} size={12} />
                    </button>
                  </span>
                )
              }

              return (
                <LinkPreview
                  key={`mlink-${index}`}
                  url={token.url}
                  customTitle={token.title}
                  showCopyButton
                />
              )
            case "link":
              return (
                <LinkPreview
                  key={`link-${index}`}
                  url={token.value}
                  showCopyButton
                />
              )
            case "email":
              return (
                <EmailComponent key={`email-${index}`} email={token.value} />
              )
            case "text":
            default:
              return (
                <span key={`text-${index}`} className="text-inherit">
                  {highlightText(token.value, searchQuery)}
                </span>
              )
          }
        })}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "text-base leading-relaxed break-words whitespace-pre-wrap flex flex-col gap-0 text-inherit",
        className
      )}
      style={style}
    >
      {renderContent(content)}
    </div>
  )
}

function EmailComponent({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      toast({
        description: "邮件地址已复制",
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <span className="group/email inline">
      <span className="inline-flex w-0 group-hover/email:w-6 overflow-hidden transition-all duration-300 items-center align-middle shrink-0">
        <button
          onClick={handleCopy}
          className="p-1 rounded-md bg-primary/5 hover:bg-primary/10 text-primary opacity-0 group-hover/email:opacity-100 border border-primary/10"
        >
          {copied ? (
            <HugeiconsIcon icon={Check} size={14} />
          ) : (
            <HugeiconsIcon icon={Copy} size={14} />
          )}
        </button>
      </span>
      <a
        href={`mailto:${email}`}
        className="text-primary transition-colors inline align-baseline"
      >
        {email}
      </a>
    </span>
  )
}
