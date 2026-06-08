"use client"

import { Memo } from "@/types/memo"
import { format, parseISO } from "date-fns"
import { motion } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { ImageZoom } from "@/shared/ui/ImageZoom"
import { SmartImage } from "@/shared/ui/SmartImage"

interface GalleryGridProps {
  memos: Memo[]
}

export function GalleryGrid({ memos }: GalleryGridProps) {
  if (!memos || memos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-muted-foreground bg-muted/5 rounded-md border border-dashed border-border/50">
        <p className="italic text-lg opacity-60">暂无图片内容</p>
        <p className="text-xs opacity-40 mt-2">
          发布包含图片的 Memo 即可在此展示
        </p>
      </div>
    )
  }

  // Extract images and group by Month
  const galleryItems = memos
    .map((memo) => {
      const imgRegex = /!\[.*?\]\((.*?)\)/
      const match = memo.content.match(imgRegex)
      return {
        ...memo,
        imageUrl: match ? match[1] : null,
        dateObj: parseISO(memo.created_at),
      }
    })
    .filter((item) => item.imageUrl)

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
      {galleryItems.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03, duration: 0.5 }}
          className="break-inside-avoid mb-6"
        >
          <div
            tabIndex={0}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 hover:border-border/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
            aria-label={`查看由 ${format(item.dateObj, "yyyy-MM-dd")} 发布的图片 Memo`}
          >
            <div className="relative overflow-hidden w-full h-auto">
              {/* Premium Date Tag */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-background/50 backdrop-blur-md border border-border/30 text-muted-foreground text-[9px] font-mono tracking-widest select-none z-20 pointer-events-none uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {format(item.dateObj, "yy/MM")}
              </div>

              <ImageZoom
                src={item.imageUrl || ""}
                alt="Memo multimedia content"
              >
                <SmartImage
                  src={item.imageUrl || ""}
                  alt="Memo multimedia content"
                  containerClassName="w-full h-auto min-h-[140px]"
                  className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </ImageZoom>
              {/* Premium Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                <p className="text-white/95 text-[11px] line-clamp-2 mb-2.5 leading-relaxed tracking-wide opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  {item.content.replace(/!\[.*?\]\((.*?)\)/g, "").trim() ||
                    "图片分享"}
                </p>
                <div className="flex justify-between items-center text-[9px] text-white/60 font-mono tracking-wider uppercase">
                  <span>{format(item.dateObj, "yyyy.MM.dd")}</span>
                  <span
                    className="px-2.5 py-1 bg-white/10 border border-white/15 rounded-md backdrop-blur-md transition-colors"
                    aria-hidden="true"
                  >
                    DETAIL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
