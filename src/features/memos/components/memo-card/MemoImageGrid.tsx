"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import {
  type ImageStackOriginRect,
  ImageStackPreview,
  ImageStackThumbnail,
} from "@/shared/ui/ImageStack"

interface MemoImageGridProps {
  images: string[]
}

export function MemoImageGrid({ images }: MemoImageGridProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isReturningPreview, setIsReturningPreview] = useState(false)
  const [previewOriginRect, setPreviewOriginRect] = useState<ImageStackOriginRect | null>(null)

  if (!images || images.length === 0) return null

  const isStacked = images.length > 1
  const layoutId = `memo-image-stack-${images[0]}`

  return (
    <div className="relative z-10 mb-5 flex justify-center select-none">
      <div className={isStacked ? "w-full max-w-[520px] pb-4 pr-6" : "w-full max-w-[520px]"}>
        <ImageStackThumbnail
          images={images}
          layoutId={layoutId}
          alt="Memo attachment"
          aspectRatio="4 / 3"
          onOpen={(originRect) => {
            setPreviewOriginRect(originRect)
            setIsPreviewOpen(true)
          }}
          isPreviewing={isPreviewOpen || isReturningPreview}
          className="cursor-zoom-in"
          imageContainerClassName="min-h-[150px]"
          badge={
            isStacked ? (
              <span className="badge-text pointer-events-none absolute right-3 bottom-3 z-20 rounded-sm bg-white/88 px-2 py-1 text-[11px] font-semibold tracking-normal text-foreground/70 shadow-[0_8px_22px_rgba(29,29,27,0.12)]">
                {images.length} 张
              </span>
            ) : null
          }
        />
      </div>

      <AnimatePresence
        onExitComplete={() => {
          setIsReturningPreview(false)
          setPreviewOriginRect(null)
        }}
      >
        {isPreviewOpen && (
          <ImageStackPreview
            images={images}
            layoutId={layoutId}
            originRect={previewOriginRect}
            open={isPreviewOpen}
            onClose={() => {
              setIsReturningPreview(true)
              setIsPreviewOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
