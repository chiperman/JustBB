"use client"

import { Memo } from "@/types/memo"
import { motion } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { ImageZoom } from "@/shared/ui/ImageZoom"
import { SmartImage } from "@/shared/ui/SmartImage"

interface GalleryGridProps {
  memos: Memo[]
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}.${month}.${day}`
}

export function GalleryGrid({ memos }: GalleryGridProps) {
  if (!memos || memos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-muted-foreground bg-muted/5 rounded-md border border-dashed border-border/50">
        <p className="italic text-lg opacity-60">暂无图片内容</p>
        <p className="text-xs opacity-40 mt-2">发布包含图片的 Memo 即可在此展示</p>
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
              "group gallery-archive relative overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 focus-visible:ring-1 focus-visible:ring-ring"
            )}
            aria-label="查看图片 Memo"
          >
            <div className="relative overflow-hidden w-full h-auto">
              <ImageZoom
                src={item.imageUrl || ""}
                alt="Memo multimedia content"
                className="w-full h-auto"
              >
                <div className="relative overflow-hidden w-full h-auto">
                  <SmartImage
                    src={item.imageUrl || ""}
                    alt="Memo multimedia content"
                    containerClassName="w-full h-auto min-h-[140px]"
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    loading="lazy"
                  />

                  {/* Gradient wash overlay — visible on hover */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(29,29,27,0.72)_0%,rgba(29,29,27,0.34)_42%,rgba(29,29,27,0.04)_72%),linear-gradient(135deg,rgba(217,119,87,0.18),transparent_45%)] opacity-0 transition-opacity duration-260 group-hover:opacity-100 group-focus:opacity-100" />

                  {/* Glassy bottom panel */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] border-t border-white/20 bg-[linear-gradient(to_top,rgba(29,29,27,0.44)_0%,rgba(246,245,244,0.14)_58%,rgba(246,245,244,0.02)_82%,transparent_100%)] opacity-0 backdrop-blur-[22px] backdrop-saturate-[1.35] [-webkit-backdrop-filter:blur(22px)_saturate(1.35)] [mask-image:linear-gradient(to_top,black_0%,black_62%,rgba(0,0,0,0.62)_80%,transparent_100%)] transition-all duration-260 ease-out group-hover:opacity-100 group-focus:opacity-100" />

                  {/* Content — slides up on hover */}
                  <div className="pointer-events-none absolute inset-x-[18px] bottom-[18px] z-10 grid translate-y-3 gap-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
                    <p className="line-clamp-2 text-[15px] font-semibold leading-normal text-white drop-shadow-[0_1px_18px_rgba(0,0,0,0.42)]">
                      {item.content.replace(/!\[.*?\]\((.*?)\)/g, "").trim() || "图片分享"}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      {item.created_at && (
                        <span className="font-mono text-[11px] tracking-[0.1em] text-white/82">
                          {formatDate(item.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </ImageZoom>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
