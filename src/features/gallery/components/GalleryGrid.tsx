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
              {/* 日期玻璃标签 */}
              <div className="absolute top-3 left-3 z-20 rounded-md bg-[#f6f5f4]/72 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[#31302e]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),inset_0_0_0_1px_rgba(255,255,255,0.42),0_8px_24px_rgba(29,29,27,0.10)] backdrop-blur-xl backdrop-saturate-150 select-none pointer-events-none opacity-[0.001] will-change-[opacity] transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
                {format(item.dateObj, "yy/MM")}
              </div>

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
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  {/* 磨砂胶片蒙版 */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-4 pb-4 pt-16 opacity-[0.001] will-change-[opacity] transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
                    <div className="absolute inset-x-0 bottom-0 h-[46%] border-t border-white/26 bg-[#f6f5f4]/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.46),inset_0_-56px_72px_rgba(29,29,27,0.30)] backdrop-blur-[28px] backdrop-saturate-[1.75] backdrop-brightness-105 [mask-image:linear-gradient(to_top,black_0%,black_72%,rgba(0,0,0,0.62)_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_72%,rgba(0,0,0,0.62)_88%,transparent_100%)]" />
                    <div className="absolute inset-x-0 bottom-[46%] h-7 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.30),rgba(255,255,255,0.10)_42%,transparent)] opacity-70" />
                    <p className="relative z-10 mb-2.5 line-clamp-2 translate-y-2 text-[11px] leading-relaxed tracking-wide text-white/95 opacity-0 drop-shadow-[0_1px_12px_rgba(0,0,0,0.56)] transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
                      {item.content.replace(/!\[.*?\]\((.*?)\)/g, "").trim() ||
                        "图片分享"}
                    </p>
                    <div className="relative z-10 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-white/78">
                      <span className="drop-shadow-[0_1px_10px_rgba(0,0,0,0.52)]">
                        {format(item.dateObj, "yyyy.MM.dd")}
                      </span>
                      <span
                        className="pointer-events-auto cursor-pointer rounded-lg bg-[#f6f5f4]/24 px-3 py-1.5 text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),inset_0_0_0_1px_rgba(255,255,255,0.22),0_8px_22px_rgba(29,29,27,0.14)] backdrop-blur-xl backdrop-saturate-150 transition-all hover:bg-[#f6f5f4]/32 active:scale-95"
                        aria-hidden="true"
                      >
                        DETAIL
                      </span>
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
