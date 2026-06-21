"use client"

import { useMemo, useState } from "react"
import { Memo } from "@/types/memo"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon as GalleryIcon } from "@hugeicons/core-free-icons"
import { ImageStackPreview, ImageStackThumbnail } from "@/shared/ui/ImageStack"

interface GalleryGridProps {
  memos: Memo[]
}

type GalleryMemoItem = Memo & {
  images: string[]
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

export function GalleryGrid({ memos }: GalleryGridProps) {
  const [previewItem, setPreviewItem] = useState<GalleryMemoItem | null>(null)

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

  if (!memos || memos.length === 0) {
    return (
      <div className="flex h-full min-h-[500px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,247,245,0.36))] px-6 py-24 text-center text-muted-foreground">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary/55 ring-1 ring-primary/10">
          <HugeiconsIcon icon={GalleryIcon} size={26} strokeWidth={1.7} />
        </div>
        <p className="text-lg font-semibold text-foreground/55">暂无图片</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground/55">
          发布带图片的 Memo 后，影像会在这里汇集成你的私人画廊。
        </p>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-6 md:columns-2 lg:columns-3 xl:columns-4">
      {galleryItems.map((item) => (
        <div key={item.id} className="mb-7 break-inside-avoid pb-3 pr-4">
          <ImageStackThumbnail
            images={item.images}
            layoutId={`image-stack-${item.id}`}
            alt="Memo multimedia content"
            preserveNaturalAspectRatio
            onOpen={() => setPreviewItem(item)}
            overlay={
              <>
                <CardOverlay />
                <MemoMeta item={item} />
              </>
            }
          />
        </div>
      ))}

      {previewItem && (
        <ImageStackPreview
          images={previewItem.images}
          layoutId={`image-stack-${previewItem.id}`}
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  )
}
