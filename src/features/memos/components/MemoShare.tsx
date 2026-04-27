"use client"

import { useState, useRef, useCallback } from "react"
import { toPng } from "html-to-image"
import { QRCodeSVG } from "qrcode.react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon as Download,
  Share01Icon as Share2,
  Loading01Icon as Loader2,
} from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Memo } from "@/types/memo"
import { useToast } from "@/hooks/use-toast"
import { MemoContent } from "@/features/memos/components/MemoContent"

import { useHasMounted } from "@/hooks/useHasMounted"
import { getMemoShareUrl } from "@/lib/share"
import { POSTER_THEMES } from "@/lib/export-themes"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface MemoShareProps {
  memo: Memo
  trigger?: React.ReactNode
}

export function MemoShare({ memo, trigger }: MemoShareProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeThemeId, setActiveThemeId] = useState("classic")
  const { toast } = useToast()
  const hasMounted = useHasMounted()
  const shareUrl = getMemoShareUrl(memo.id)

  const activeTheme = POSTER_THEMES[activeThemeId] || POSTER_THEMES.classic

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return

    try {
      setIsGenerating(true)

      // Ensure fonts are loaded before capturing
      await document.fonts.ready
      // A small extra delay for safety in some browsers
      await new Promise((resolve) => setTimeout(resolve, 100))

      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3, // 提升至 3x 以获得极高清晰度
        backgroundColor: activeTheme.styles.container.backgroundColor,
      })

      const link = document.createElement("a")
      link.download = `memo-${memo.id.slice(0, 8)}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Generarte poster failed", err)
      toast({
        title: "生成海报失败",
        description: "请重试或检查控制台错误",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [memo.id, toast])

  if (!hasMounted) return trigger || null

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-accent active:scale-95 transition-all"
            title="分享"
            aria-label="分享 Memo"
          >
            <HugeiconsIcon
              icon={Share2}
              size={16}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md flex flex-col items-center">
        <DialogHeader>
          <DialogTitle>分享 Memo</DialogTitle>
        </DialogHeader>

        {/* 预览/截图区域 - 稳定滚动逻辑 */}
        <div className="w-full h-[60vh] min-h-[400px] overflow-y-scroll py-8 custom-scrollbar bg-accent/5 rounded-xl border border-border/40">
          <div
            ref={posterRef}
            className="w-[360px] mx-auto relative shadow-2xl flex flex-col gap-5 h-fit origin-top overflow-visible"
            style={{
              backgroundColor: activeTheme.styles.container.backgroundColor,
              color: activeTheme.styles.container.color,
              padding: activeTheme.styles.container.padding,
              borderRadius: activeTheme.styles.container.borderRadius,
              boxShadow: activeTheme.styles.container.boxShadow,
              border: activeTheme.styles.container.borderColor
                ? `1px solid ${activeTheme.styles.container.borderColor}`
                : "none",
              fontVariantNumeric: "lining-nums",
              fontFeatureSettings: '"lnum" 1',
            }}
          >
            {/* 物理锯齿边缘 - 顶部 */}
            {activeTheme.styles.decorations?.paperEffect === "typewriter" && (
              <div
                className="absolute top-0 left-0 right-0 flex pointer-events-none"
                style={{ transform: "translateY(-100%)" }}
              >
                {[...Array(36)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[10px] h-[8px]"
                    style={{
                      backgroundColor:
                        activeTheme.styles.container.backgroundColor,
                      clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Header */}
            <div
              className="flex justify-between items-center pb-4"
              style={{ borderBottom: activeTheme.styles.header.borderBottom }}
            >
              <span
                className="font-bold tracking-[0.2em] uppercase"
                style={{
                  fontSize: activeTheme.styles.header.fontSize,
                  color: activeTheme.styles.header.brandColor,
                }}
              >
                JustMemo
              </span>
              <span
                className="text-[11px] font-mono opacity-60"
                style={{ color: activeTheme.styles.header.dateColor }}
              >
                {format(new Date(memo.created_at), "yyyy.MM.dd", {
                  locale: zhCN,
                })}
              </span>
            </div>

            <div>
              <MemoContent
                content={memo.content}
                className={cn(
                  "min-h-[140px] py-2",
                  activeTheme.styles.content.fontFamily === "serif"
                    ? "font-serif"
                    : activeTheme.styles.content.fontFamily === "mono"
                      ? "font-mono"
                      : "font-sans",
                  "tracking-tight"
                )}
                style={{
                  fontSize: activeTheme.styles.content.fontSize,
                  lineHeight: activeTheme.styles.content.lineHeight,
                  color: activeTheme.styles.content.color,
                }}
              />
            </div>

            {/* Footer & QR */}
            <div
              className="mt-6 pt-6 flex justify-between items-end"
              style={{ borderTop: activeTheme.styles.footer.borderTop }}
            >
              <div
                className="text-[10px] leading-relaxed opacity-50"
                style={{ color: activeTheme.styles.footer.textColor }}
              >
                <p className="font-medium">Recorded via JustMemo</p>
                <p>碎片化人文记录工具</p>
              </div>
              <div
                className="p-1.5 rounded-lg shadow-sm"
                style={{ backgroundColor: activeTheme.styles.footer.qrBgColor }}
              >
                <QRCodeSVG
                  value={shareUrl}
                  size={60}
                  fgColor={activeTheme.styles.footer.qrFgColor}
                  bgColor={activeTheme.styles.footer.qrBgColor}
                  includeMargin={false}
                />
              </div>
            </div>

            {/* 物理纸张效果：打字机/打印纸 */}
            {activeTheme.styles.decorations?.paperEffect === "typewriter" && (
              <>
                {/* 左侧边距红线 */}
                {activeTheme.styles.decorations?.showMarginLine && (
                  <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-red-400/20 pointer-events-none" />
                )}
                {/* 底部锯齿 (实体元素) */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex pointer-events-none"
                  style={{ transform: "translateY(100%)" }}
                >
                  {[...Array(36)].map((_, i) => (
                    <div
                      key={i}
                      className="w-[10px] h-[8px]"
                      style={{
                        backgroundColor:
                          activeTheme.styles.container.backgroundColor,
                        clipPath: "polygon(0% 0%, 50% 100%, 100% 0%)",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 主题选择器 - 固定在下方 */}
        <div className="flex gap-2 mt-4 p-1 bg-muted/50 rounded-full border border-border/50">
          {Object.values(POSTER_THEMES).map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveThemeId(theme.id)}
              className={cn(
                "px-3 py-1 text-[11px] rounded-full transition-all active:scale-95",
                activeThemeId === theme.id
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {theme.name}
            </button>
          ))}
        </div>

        {/* 操作栏 */}
        <div className="flex gap-4 w-full mt-2">
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 active:scale-95 transition-all"
          >
            {isGenerating ? (
              <HugeiconsIcon
                icon={Loader2}
                size={16}
                className="mr-2 animate-spin"
              />
            ) : (
              <HugeiconsIcon icon={Download} size={16} className="mr-2" />
            )}
            保存图片
          </Button>
          <Button
            variant="outline"
            className="flex-1 active:scale-95 transition-all"
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({
                    title: "JustMemo 分享",
                    text: memo.content,
                    url: shareUrl,
                  })
                  .catch(() => {}) // 忽略取消
              } else {
                // fallback copy
                navigator.clipboard.writeText(`${memo.content}\n${shareUrl}`)
                toast({
                  title: "分享",
                  description: "链接与内容已复制",
                })
              }
            }}
            aria-label="更多分享方式"
          >
            <HugeiconsIcon
              icon={Share2}
              size={16}
              className="mr-2"
              aria-hidden="true"
            />
            更多分享
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
