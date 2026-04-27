"use client"

import { useState, useRef, useCallback } from "react"
import { toPng } from "html-to-image"
import { QRCodeSVG } from "qrcode.react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon as Download,
  Share01Icon as Share2,
  Loading01Icon as Loader2,
  Copy01Icon as Copy,
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

interface MemoShareProps {
  memo: Memo
  trigger?: React.ReactNode
}

export function MemoShare({ memo, trigger }: MemoShareProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeThemeId, setActiveThemeId] = useState("classic")
  const [showDate, setShowDate] = useState(true)
  const [showQR, setShowQR] = useState(true)
  const [showBrand, setShowBrand] = useState(true)

  const { toast } = useToast()
  const hasMounted = useHasMounted()
  const shareUrl = getMemoShareUrl(memo.id)

  const activeTheme = POSTER_THEMES[activeThemeId] || POSTER_THEMES.classic

  const generateImage = useCallback(async (pixelRatio: number) => {
    if (!posterRef.current) return null

    await document.fonts.ready
    await new Promise((resolve) => setTimeout(resolve, 150))

    return await toPng(posterRef.current, {
      cacheBust: true,
      pixelRatio,
      // 移除这里的 backgroundColor，确保圆角外的区域是透明的
      style: {
        transform: "none",
        margin: "0",
      },
    })
  }, [])

  const handleCopyToClipboard = useCallback(async () => {
    try {
      setIsGenerating(true)

      const blobPromise = (async () => {
        const dataUrl = await generateImage(3) // 统一使用 3x 保证清晰度
        if (!dataUrl) throw new Error("Generate failed")
        const response = await fetch(dataUrl)
        return await response.blob()
      })()

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blobPromise }),
        ])
      } catch (e) {
        const blob = await blobPromise
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
      }

      toast({ title: "已复制到剪贴板" })
    } catch (err) {
      console.error("Copy failed", err)
      toast({
        title: "复制失败",
        description: "请使用保存功能",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [generateImage, toast])

  const handleDownload = useCallback(async () => {
    try {
      setIsGenerating(true)
      const dataUrl = await generateImage(3)
      if (!dataUrl) return

      const link = document.createElement("a")
      link.download = `memo-${memo.id.slice(0, 8)}.png`
      link.href = dataUrl
      link.click()

      toast({ title: "海报已保存" })
    } catch (err) {
      console.error("Save failed", err)
      toast({ title: "保存失败", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }, [generateImage, memo.id, toast])

  if (!hasMounted) return trigger || null

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <HugeiconsIcon
              icon={Share2}
              size={16}
              className="text-muted-foreground"
            />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md flex flex-col items-center gap-4 py-6">
        <DialogHeader className="py-0">
          <DialogTitle className="text-base font-semibold text-foreground/80">
            分享预览
          </DialogTitle>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="w-full h-[50vh] min-h-[360px] overflow-y-auto py-6 custom-scrollbar bg-accent/5 rounded-xl border border-border/40">
          <div
            ref={posterRef}
            className="w-[340px] mx-auto relative flex flex-col origin-top h-fit"
            style={{
              backgroundColor: activeTheme.styles.container.backgroundColor,
              color: activeTheme.styles.container.color,
              padding: activeTheme.styles.container.padding,
              borderRadius: activeTheme.styles.container.borderRadius,
              border: activeTheme.styles.container.borderColor
                ? `1px solid ${activeTheme.styles.container.borderColor}`
                : "none",
              fontVariantNumeric: "lining-nums",
              fontFeatureSettings: '"lnum" 1',
            }}
          >
            {/* 锯齿 - 顶部 */}
            {activeTheme.styles.decorations?.paperEffect === "typewriter" && (
              <div
                className="absolute top-0 left-0 right-0 flex pointer-events-none"
                style={{ transform: "translateY(-100%)" }}
              >
                {[...Array(34)].map((_, i) => (
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

            {/* Header - 使用 margin 替代 gap */}
            {(showBrand || showDate) && (
              <div
                className="flex justify-between items-center pb-4 mb-4"
                style={{ borderBottom: activeTheme.styles.header.borderBottom }}
              >
                {showBrand ? (
                  <span
                    className="font-bold tracking-[0.2em] uppercase"
                    style={{
                      color: activeTheme.styles.header.brandColor,
                      fontSize: activeTheme.styles.header.fontSize,
                    }}
                  >
                    JustBB
                  </span>
                ) : (
                  <div />
                )}
                {showDate && (
                  <span
                    className="font-mono opacity-60 text-[11px]"
                    style={{ color: activeTheme.styles.header.dateColor }}
                  >
                    {format(new Date(memo.created_at), "yyyy.MM.dd", {
                      locale: zhCN,
                    })}
                  </span>
                )}
              </div>
            )}

            {/* Content Area - 使用 padding/margin 替代 flex-1 空间计算 */}
            <div className="py-2 mb-6">
              <MemoContent
                content={memo.content}
                className={cn(
                  "py-1",
                  activeTheme.styles.content.fontFamily === "serif"
                    ? "font-serif"
                    : activeTheme.styles.content.fontFamily === "mono"
                      ? "font-mono"
                      : "font-sans"
                )}
                style={{
                  fontSize: activeTheme.styles.content.fontSize,
                  lineHeight: activeTheme.styles.content.lineHeight,
                  color: activeTheme.styles.content.color,
                }}
              />
            </div>

            {/* Footer - 移除 mt-auto 使用常规布局 */}
            <div
              className="pt-6 flex justify-between items-end"
              style={{ borderTop: activeTheme.styles.footer.borderTop }}
            >
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-medium tracking-widest uppercase opacity-50"
                  style={{ color: activeTheme.styles.footer.textColor }}
                >
                  Captured via JustBB
                </span>
                <span
                  className="text-[9px] opacity-30"
                  style={{ color: activeTheme.styles.footer.textColor }}
                >
                  Minimalist Notes for Thinkers
                </span>
              </div>
              {showQR && (
                <div
                  className="p-1.5 rounded-lg"
                  style={{
                    backgroundColor: activeTheme.styles.footer.qrBgColor,
                  }}
                >
                  <QRCodeSVG
                    value={shareUrl}
                    size={42}
                    fgColor={activeTheme.styles.footer.qrFgColor}
                    bgColor="transparent"
                  />
                </div>
              )}
            </div>

            {/* 噪点纹理 */}
            {activeTheme.styles.decorations?.paperEffect === "noise" && (
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
                style={{
                  backgroundImage: `radial-gradient(#000 10%, transparent 10%)`,
                  backgroundSize: "2px 2px",
                }}
              />
            )}

            {/* 纸张特效 */}
            {activeTheme.styles.decorations?.paperEffect === "typewriter" && (
              <>
                {activeTheme.styles.decorations?.showMarginLine && (
                  <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-red-400/20 pointer-events-none" />
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 flex pointer-events-none"
                  style={{ transform: "translateY(100%)" }}
                >
                  {[...Array(34)].map((_, i) => (
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

        {/* 控制面板 */}
        <div className="w-full space-y-4 px-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              风格
            </span>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-full border border-border/50">
              {Object.values(POSTER_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveThemeId(t.id)}
                  className={cn(
                    "px-3 py-0.5 text-[11px] rounded-full",
                    activeThemeId === t.id
                      ? "bg-background shadow-sm font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-around py-2 border-t border-border/40">
            {[
              { label: "品牌", state: showBrand, setter: setShowBrand },
              { label: "日期", state: showDate, setter: setShowDate },
              { label: "二维码", state: showQR, setter: setShowQR },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => item.setter(!item.state)}
                className="flex items-center gap-2 group"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-sm border",
                    item.state
                      ? "bg-primary border-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                      : "border-muted-foreground/30 bg-transparent"
                  )}
                />
                <span
                  className={cn(
                    "text-[12px]",
                    item.state
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 w-full mt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full py-6 text-sm border-border/60"
            onClick={handleCopyToClipboard}
            disabled={isGenerating}
          >
            <HugeiconsIcon icon={Copy} size={18} className="mr-2" /> 复制图片
          </Button>
          <Button
            className="flex-1 rounded-full py-6 text-sm font-medium relative overflow-hidden group"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            <div className="absolute inset-0 bg-primary" />
            <span className="relative flex items-center gap-2">
              {isGenerating ? (
                <HugeiconsIcon
                  icon={Loader2}
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <HugeiconsIcon icon={Download} size={18} />
              )}
              保存海报
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
