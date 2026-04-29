"use client"

import { useState, useEffect, useRef } from "react"
import { fetchLinkMetadata, LinkMetadata } from "@/lib/link-preview"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Link01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface LinkPreviewProps {
  url: string
  customTitle?: string
  className?: string
  showCopyButton?: boolean
}

// Client-side cache for link metadata to prevent redundant fetches during a session
const metadataCache = new Map<string, LinkMetadata>()

export function LinkPreview({
  url,
  customTitle,
  className,
  showCopyButton = false,
}: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(
    () => metadataCache.get(url) || null
  )
  const [loading, setLoading] = useState(!metadataCache.has(url))
  const [error, setError] = useState(false)
  const { toast } = useToast()

  // Uses an IntersectionObserver to only load preview when in view
  const observerRef = useRef<HTMLAnchorElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  const handleCopy = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "链接已拷贝" })
    } catch {
      toast({
        title: "复制失败",
        description: "当前环境暂不支持复制链接",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: "100px" }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldLoad) return

    // If we already have metadata in cache, don't fetch again
    if (metadataCache.has(url)) {
      setMetadata(metadataCache.get(url)!)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(false)

    const fetchMeta = async () => {
      try {
        const data = await fetchLinkMetadata(url)
        if (isMounted) {
          if (data) {
            setMetadata(data)
            // Save to cache
            metadataCache.set(url, data)
          } else {
            setError(true)
          }
        }
      } catch {
        if (isMounted) {
          setError(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchMeta()

    return () => {
      isMounted = false
    }
  }, [url, shouldLoad])

  if (!shouldLoad || loading) {
    return (
      <div
        className={cn(
          "group/link-preview relative my-3 max-w-2xl overflow-hidden rounded-card border border-border bg-card/50 min-h-[100px] sm:min-h-[120px]",
          className
        )}
      >
        {showCopyButton && (
          <div className="absolute top-2 right-2 opacity-0 group-hover/link-preview:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border border-border/50 p-0.5 z-10">
            <CopyButton onCopy={handleCopy} />
          </div>
        )}
        <a
          ref={observerRef}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[100px] w-full items-stretch sm:min-h-[120px]"
        >
          <div className="w-24 self-stretch bg-muted/50 animate-pulse shrink-0 flex items-center justify-center sm:w-[120px]">
            <HugeiconsIcon
              icon={Link01Icon}
              className="text-muted-foreground/30 animate-pulse"
              size={24}
            />
          </div>
          <div className="p-3 sm:p-4 flex-1 min-w-0 space-y-2 lg:space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-3/4">
              {customTitle && <span className="opacity-0">{customTitle}</span>}
            </div>
            <div className="hidden sm:block h-3 bg-muted animate-pulse rounded w-full"></div>
            <div className="hidden sm:block h-3 bg-muted animate-pulse rounded w-5/6"></div>
            <div className="h-3 bg-muted animate-pulse rounded w-1/4 mt-auto"></div>
          </div>
        </a>
      </div>
    )
  }

  const displayTitle = customTitle || metadata?.title || metadata?.domain

  if (error || !metadata) {
    // Fallback to simple link with styling
    return (
      <span className="group/link-preview inline-flex max-w-full items-center gap-1">
        {showCopyButton && (
          <div className="opacity-0 group-hover/link-preview:opacity-100 transition-opacity">
            <CopyButton onCopy={handleCopy} />
          </div>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono bg-primary/10 px-1.5 py-0.5 rounded-md mx-0.5 hover:bg-primary/20 transition-colors max-w-full"
          title={url}
        >
          <HugeiconsIcon icon={Link01Icon} size={14} className="shrink-0" />
          <span className="truncate">{displayTitle}</span>
        </a>
      </span>
    )
  }

  // Render full card
  return (
    <div
      className={cn(
        "group/link-preview relative my-3 max-w-2xl overflow-hidden rounded-card border border-border bg-card transition-all hover:bg-accent/50 hover:hover:border-primary/30",
        "min-h-[100px] sm:min-h-[120px]",
        className
      )}
    >
      {showCopyButton && (
        <div className="absolute top-2 right-2 opacity-0 group-hover/link-preview:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border border-border/50 p-0.5 z-10">
          <CopyButton onCopy={handleCopy} />
        </div>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[100px] w-full items-stretch sm:min-h-[120px]"
        title={url}
      >
        {metadata.image ? (
          <div className="relative w-24 self-stretch shrink-0 overflow-hidden bg-muted border-r border-border flex items-center justify-center sm:w-[120px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={metadata.image}
              alt={displayTitle || "Link preview"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover/link-preview:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                e.currentTarget.parentElement?.classList.add(
                  "flex",
                  "items-center",
                  "justify-center"
                )
                const icon = document.createElement("div")
                icon.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/30"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'
                e.currentTarget.parentElement?.appendChild(
                  icon.firstChild as Node
                )
              }}
            />
          </div>
        ) : (
          <div className="relative w-24 self-stretch shrink-0 overflow-hidden bg-primary/5 border-r border-border flex items-center justify-center sm:w-[120px]">
            <HugeiconsIcon
              icon={Link01Icon}
              size={32}
              className="text-primary/30"
            />
          </div>
        )}
        <div className="flex flex-1 min-w-0 flex-col p-3 sm:p-4">
          <div className="min-h-0">
            <h3 className="line-clamp-1 sm:line-clamp-2 text-sm font-semibold text-foreground group-hover/link-preview:text-primary transition-colors">
              {displayTitle}
            </h3>
            <p className="mt-1 line-clamp-1 sm:line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {metadata.description || "点击前往查看详情"}
            </p>
          </div>
          <div className="mt-auto pt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${metadata.domain}&sz=16`}
              alt="favicon"
              className="w-3 h-3 rounded-md opacity-80"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <span className="truncate font-medium">{metadata.domain}</span>
          </div>
        </div>
      </a>
    </div>
  )
}

function CopyButton({
  onCopy,
}: {
  onCopy: (e: React.MouseEvent<HTMLElement>) => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onCopy}
      className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
      aria-label="拷贝链接"
      title="拷贝链接"
    >
      <HugeiconsIcon icon={Copy01Icon} size={14} />
    </button>
  )
}
