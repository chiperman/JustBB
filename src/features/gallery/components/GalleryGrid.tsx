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

  // 从新版独立 images 列中提取并展开所有图片附件
  const galleryItems: (Omit<Memo, "id"> & { id: string; imageUrl: string })[] = []

  memos.forEach((memo) => {
    if (memo.images && memo.images.length > 0) {
      memo.images.forEach((imgUrl, index) => {
        galleryItems.push({
          ...memo,
          id: `${memo.id}-${index}`, // 使用带有序号的唯一 ID 避免 key 重复
          imageUrl: imgUrl,
        })
      })
    }
  })

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
          <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-card focus-within:ring-1 focus-within:ring-ring">
            <ImageZoom
              src={item.imageUrl || ""}
              alt="Memo multimedia content"
              className="w-full h-auto border-none bg-transparent rounded-none ring-0 shadow-none"
              noHoverScale
            >
              <SmartImage
                src={item.imageUrl || ""}
                alt="Memo multimedia content"
                containerClassName="w-full h-auto min-h-[140px]"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </ImageZoom>

            {/* Gradient wash overlay — visible on hover (pointer-events-none lets clicks through to ImageZoom) */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,rgba(29,29,27,0.72)_0%,rgba(29,29,27,0.34)_42%,rgba(29,29,27,0.04)_72%),linear-gradient(135deg,rgba(217,119,87,0.18),transparent_45%)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" />

            {/* Glassy bottom panel — visible on hover (pointer-events-none lets clicks through to ImageZoom) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[48%] border-t border-white/[0.22] bg-[linear-gradient(to_top,rgba(29,29,27,0.44)_0%,rgba(246,245,244,0.14)_58%,rgba(246,245,244,0.02)_82%,transparent_100%),rgba(246,245,244,0.08)] opacity-0 backdrop-blur-[22px] backdrop-saturate-[1.35] [-webkit-backdrop-filter:blur(22px)_saturate(1.35)] [mask-image:linear-gradient(to_top,black_0%,black_62%,rgba(0,0,0,0.62)_80%,transparent_100%)] group-hover:opacity-100 group-focus-within:opacity-100" />

            {/* Content — visible on hover (pointer-events-none lets clicks through to ImageZoom) */}
            <div className="pointer-events-none absolute inset-x-[18px] bottom-[18px] z-20 grid gap-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
              <p className="line-clamp-2 text-[15px] font-semibold leading-normal text-white drop-shadow-[0_1px_18px_rgba(0,0,0,0.42)]">
                {item.content.trim() || "图片分享"}
              </p>
              <div className="flex items-center justify-between">
                {item.created_at && (
                  <span className="font-mono text-[11px] tracking-[0.1em] text-white/82">
                    {formatDate(item.created_at)}
                  </span>
                )}
                {item.memo_number && (
                  <span className="badge-text bg-[#fdf5f2] text-primary px-1.5 py-0.5 rounded-sm text-[10px] font-semibold tracking-normal">
                    #{item.memo_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
