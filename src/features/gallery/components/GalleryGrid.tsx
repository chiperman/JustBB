"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Memo } from "@/types/memo"
import { AnimatePresence } from "framer-motion"
import { ChatLock01Icon as LockIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  IMAGE_STACK_RETURN_DURATION_MS,
  type ImageStackOriginRect,
  ImageStackPreview,
  ImageStackThumbnail,
} from "@/shared/ui/ImageStack"
import { UnlockDialog } from "@/features/memos/components/UnlockDialog"
import { GalleryEmptyState } from "./GalleryEmptyState"

interface GalleryGridProps {
  memos: Memo[]
}

type GalleryMemoItem = Memo & {
  images: string[]
}

type GalleryAspectRatioCache = Record<
  string,
  {
    src: string
    aspectRatio: string
  }
>

const GALLERY_FALLBACK_ASPECT_RATIO = "1.18 / 1"
const GALLERY_MIN_ASPECT_RATIO = 0.78
const GALLERY_MAX_ASPECT_RATIO = 1.75
const GALLERY_MASONRY_DEFAULT_COLUMN_WIDTH_PX = 260
const GALLERY_STACKED_INLINE_PADDING_PX = 32
const THUMBNAIL_REVEAL_BEFORE_EXIT_MS = 90
const THUMBNAIL_REVEAL_DELAY_MS = IMAGE_STACK_RETURN_DURATION_MS - THUMBNAIL_REVEAL_BEFORE_EXIT_MS

function getGalleryColumnCount(width: number): number {
  if (width >= 1280) return 4
  if (width >= 1024) return 3
  if (width >= 768) return 2

  return 1
}

function getGalleryColumnGap(columnCount: number): number {
  if (columnCount >= 4) return 80
  if (columnCount >= 3) return 64

  return 48
}

function getGalleryAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return GALLERY_FALLBACK_ASPECT_RATIO

  const ratio = Math.min(
    Math.max(width / height, GALLERY_MIN_ASPECT_RATIO),
    GALLERY_MAX_ASPECT_RATIO
  )

  return `${ratio} / 1`
}

function getGalleryItemAspectRatio(
  item: GalleryMemoItem,
  aspectRatios: GalleryAspectRatioCache
): string {
  if (item.is_locked) return GALLERY_FALLBACK_ASPECT_RATIO

  const primaryImage = item.images[0]
  const metadata = primaryImage ? item.image_metadata?.[primaryImage] : null
  if (metadata) return getGalleryAspectRatio(metadata.width, metadata.height)

  return aspectRatios[item.id]?.aspectRatio || GALLERY_FALLBACK_ASPECT_RATIO
}

function getGalleryStackedInlinePadding(
  item: GalleryMemoItem,
  columnWidth: number,
  columnCount: number
): number {
  if (columnCount <= 1 || item.images.length <= 1) return 0

  return Math.min(GALLERY_STACKED_INLINE_PADDING_PX, Math.max(12, columnWidth * 0.08))
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}.${month}.${day}`
}

function CardOverlay() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,rgba(29,29,27,0.72)_0%,rgba(29,29,27,0.34)_42%,rgba(29,29,27,0.04)_72%),linear-gradient(135deg,rgba(217,119,87,0.18),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[48%] border-t border-white/[0.22] bg-[linear-gradient(to_top,rgba(29,29,27,0.44)_0%,rgba(246,245,244,0.14)_58%,rgba(246,245,244,0.02)_82%,transparent_100%),rgba(246,245,244,0.08)] opacity-0 backdrop-blur-[22px] backdrop-saturate-[1.35] transition-opacity duration-300 [-webkit-backdrop-filter:blur(22px)_saturate(1.35)] [mask-image:linear-gradient(to_top,black_0%,black_62%,rgba(0,0,0,0.62)_80%,transparent_100%)] group-hover:opacity-100 group-focus-within:opacity-100" />
    </>
  )
}

function MemoMeta({ item }: { item: GalleryMemoItem }) {
  return (
    <div className="pointer-events-none absolute inset-x-[18px] bottom-[18px] z-20 grid gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
      <p className="line-clamp-2 text-[15px] font-semibold leading-normal text-white drop-shadow-[0_1px_18px_rgba(0,0,0,0.42)]">
        {item.content?.trim() || "图片分享"}
      </p>
      <div className="flex items-center justify-between">
        {item.created_at && (
          <span className="font-mono text-[11px] tracking-[0.1em] text-white/82">
            {formatDate(item.created_at)}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {item.images.length > 1 && (
            <span className="badge-text rounded-sm bg-white/88 px-1.5 py-0.5 text-[10px] font-semibold tracking-normal text-foreground/70">
              {item.images.length} 张
            </span>
          )}
          {item.memo_number && (
            <span className="badge-text rounded-sm bg-[#fdf5f2] px-1.5 py-0.5 text-[10px] font-semibold tracking-normal text-primary">
              #{item.memo_number}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function LockedGalleryCard({ item, onUnlock }: { item: GalleryMemoItem; onUnlock: () => void }) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="group relative block w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(246,245,244,0.78),rgba(255,255,255,0.92))] text-left shadow-[0_16px_40px_rgba(29,29,27,0.08)] ring-1 ring-border/35 outline-none transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(29,29,27,0.1)] focus-visible:ring-2 focus-visible:ring-primary/40"
      style={{ aspectRatio: GALLERY_FALLBACK_ASPECT_RATIO }}
      aria-label={`解锁 #${item.memo_number} 查看图片`}
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(217,119,87,0.06)_0,rgba(217,119,87,0.06)_1px,transparent_1px,transparent_10px)] opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-primary/75 ring-1 ring-primary/15 backdrop-blur-sm transition-transform group-hover:scale-105">
          <HugeiconsIcon icon={LockIcon} size={22} aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground/70">私密图片未解锁</p>
          <p className="text-xs leading-5 text-muted-foreground/62">输入口令后即可查看原图</p>
        </div>
        <span className="badge-text rounded-sm bg-[#fdf5f2] px-1.5 py-0.5 text-[10px] font-semibold tracking-normal text-primary">
          #{item.memo_number}
        </span>
      </div>
    </button>
  )
}

export function GalleryGrid({ memos }: GalleryGridProps) {
  const [previewItem, setPreviewItem] = useState<GalleryMemoItem | null>(null)
  const [returningPreviewId, setReturningPreviewId] = useState<string | null>(null)
  const [previewOriginRect, setPreviewOriginRect] = useState<ImageStackOriginRect | null>(null)
  const [unlockMemo, setUnlockMemo] = useState<GalleryMemoItem | null>(null)
  const [aspectRatios, setAspectRatios] = useState<GalleryAspectRatioCache>({})
  const [galleryWidth, setGalleryWidth] = useState(0)
  const [columnCount, setColumnCount] = useState(() =>
    typeof window === "undefined" ? 1 : getGalleryColumnCount(window.innerWidth)
  )
  const galleryRef = useRef<HTMLDivElement>(null)
  const revealTimerRef = useRef<number | null>(null)

  const galleryItems = useMemo<GalleryMemoItem[]>(
    () =>
      memos
        .map((memo) => ({
          ...memo,
          images: memo.images?.filter(Boolean) || [],
        }))
        .filter((memo) => memo.images.length > 0),
    [memos]
  )

  const columnWidth = useMemo(() => {
    if (galleryWidth <= 0) return GALLERY_MASONRY_DEFAULT_COLUMN_WIDTH_PX

    return (
      (galleryWidth - getGalleryColumnGap(columnCount) * Math.max(0, columnCount - 1)) / columnCount
    )
  }, [columnCount, galleryWidth])

  const masonryColumns = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => [] as GalleryMemoItem[])

    galleryItems.forEach((item, index) => {
      columns[index % columnCount].push(item)
    })

    return columns
  }, [columnCount, galleryItems])

  useEffect(() => {
    const updateColumnCount = () => setColumnCount(getGalleryColumnCount(window.innerWidth))

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)

    return () => window.removeEventListener("resize", updateColumnCount)
  }, [])

  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return

    const updateGalleryWidth = () => setGalleryWidth(gallery.getBoundingClientRect().width)
    updateGalleryWidth()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateGalleryWidth)
      return () => window.removeEventListener("resize", updateGalleryWidth)
    }

    const resizeObserver = new ResizeObserver(updateGalleryWidth)
    resizeObserver.observe(gallery)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const missingItems = galleryItems.filter(
      (item) =>
        !item.is_locked &&
        item.images[0] &&
        !item.image_metadata?.[item.images[0]] &&
        aspectRatios[item.id]?.src !== item.images[0]
    )
    if (missingItems.length === 0) return

    let isMounted = true

    const loadAspectRatios = async () => {
      const entries = await Promise.all(
        missingItems.map(
          (item) =>
            new Promise<[string, GalleryAspectRatioCache[string]]>((resolve) => {
              const src = item.images[0]
              const image = new window.Image()
              image.referrerPolicy = "no-referrer"
              image.onload = () => {
                resolve([
                  item.id,
                  {
                    src,
                    aspectRatio: getGalleryAspectRatio(image.naturalWidth, image.naturalHeight),
                  },
                ])
              }
              image.onerror = () => {
                resolve([item.id, { src, aspectRatio: GALLERY_FALLBACK_ASPECT_RATIO }])
              }
              image.src = src
            })
        )
      )

      if (!isMounted) return

      setAspectRatios((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }))
    }

    void loadAspectRatios()

    return () => {
      isMounted = false
    }
  }, [aspectRatios, galleryItems])

  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current)
      }
    }
  }, [])

  if (!memos || memos.length === 0) {
    return <GalleryEmptyState />
  }

  return (
    <div
      ref={galleryRef}
      className="grid grid-cols-1 items-start gap-x-8 md:grid-cols-2 md:gap-x-12 lg:grid-cols-3 lg:gap-x-16 xl:grid-cols-4 xl:gap-x-20"
    >
      {masonryColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-col gap-6">
          {column.map((item) => (
            <div
              key={item.id}
              className="min-w-0"
              style={{
                paddingInline: getGalleryStackedInlinePadding(item, columnWidth, columnCount),
              }}
            >
              {item.is_locked ? (
                <LockedGalleryCard item={item} onUnlock={() => setUnlockMemo(item)} />
              ) : (
                <ImageStackThumbnail
                  images={item.images}
                  layoutId={`image-stack-${item.id}`}
                  alt="Memo multimedia content"
                  aspectRatio={getGalleryItemAspectRatio(item, aspectRatios)}
                  onOpen={(originRect) => {
                    setPreviewOriginRect(originRect)
                    setPreviewItem(item)
                  }}
                  isPreviewing={previewItem?.id === item.id || returningPreviewId === item.id}
                  overlay={
                    <>
                      <CardOverlay />
                      <MemoMeta item={item} />
                    </>
                  }
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <AnimatePresence
        onExitComplete={() => {
          setReturningPreviewId(null)
          setPreviewOriginRect(null)
        }}
      >
        {previewItem && (
          <ImageStackPreview
            key={previewItem.id}
            images={previewItem.images}
            layoutId={`image-stack-${previewItem.id}`}
            originRect={previewOriginRect}
            memo={{
              content: previewItem.content,
              memoNumber: previewItem.memo_number,
              createdAt: previewItem.created_at,
            }}
            open={!!previewItem}
            onClose={() => {
              setReturningPreviewId(previewItem.id)
              revealTimerRef.current = window.setTimeout(() => {
                setReturningPreviewId(null)
                revealTimerRef.current = null
              }, THUMBNAIL_REVEAL_DELAY_MS)
              setPreviewItem(null)
            }}
          />
        )}
      </AnimatePresence>

      {unlockMemo && (
        <UnlockDialog
          memoId={unlockMemo.id}
          isOpen={!!unlockMemo}
          onClose={() => setUnlockMemo(null)}
          hint={unlockMemo.access_code_hint}
        />
      )}
    </div>
  )
}
