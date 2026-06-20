"use client"

import { SmartImage } from "@/shared/ui/SmartImage"
import { ImageZoom } from "@/shared/ui/ImageZoom"
import { cn } from "@/shared/lib/utils"

interface MemoImageGridProps {
  images: string[]
}

export function MemoImageGrid({ images }: MemoImageGridProps) {
  if (!images || images.length === 0) return null

  const count = images.length

  return (
    <div
      className={cn(
        "grid gap-2 mt-4 select-none relative z-10",
        count === 1
          ? "grid-cols-1"
          : count === 2 || count === 4
            ? "grid-cols-2 max-w-[400px]"
            : "grid-cols-3"
      )}
    >
      {images.map((src, idx) => (
        <div
          key={idx}
          className={cn(
            "relative rounded-md overflow-hidden ring-1 ring-border/70 transition-all duration-300 hover:scale-[1.01] bg-muted/20",
            count === 1 ? "max-h-[400px] w-auto max-w-full justify-self-start" : "aspect-square"
          )}
        >
          <ImageZoom src={src}>
            <SmartImage
              src={src}
              alt={`Memo attachment ${idx + 1}`}
              containerClassName={cn(
                "w-full h-full",
                count === 1 ? "max-h-[400px] min-h-[150px] w-auto" : ""
              )}
              className={cn(
                "object-cover w-full h-full select-none",
                count === 1 ? "object-contain max-h-[400px] w-auto" : ""
              )}
              loading="lazy"
            />
          </ImageZoom>
        </div>
      ))}
    </div>
  )
}
