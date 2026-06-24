"use client"

import { useState, useRef, useCallback } from "react"
import { toBlob } from "html-to-image"
import { QRCodeSVG } from "qrcode.react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon as Download,
  Share01Icon as Share2,
  Copy01Icon as Copy,
} from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Memo } from "@/types/memo"
import { useToast } from "@/shared/hooks/use-toast"
import { MemoContent } from "@/features/memos/components/MemoContent"
import { AdminDialogShell } from "@/shared/ui/AdminDialogShell"

import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { getMemoShareUrl } from "@/shared/lib/share"
import { POSTER_THEMES } from "@/shared/lib/export-themes"
import { getExportFileName } from "@/shared/lib/export-utils"
import { cn } from "@/shared/lib/utils"

interface MemoShareProps {
  memo: Memo
  trigger?: React.ReactNode
}

export function MemoShare({ memo, trigger }: MemoShareProps) {
  const [open, setOpen] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const [activeAction, setActiveAction] = useState<"copy" | "download" | null>(null)
  const [activeThemeId, setActiveThemeId] = useState("classic")
  const [showDate, setShowDate] = useState(true)
  const [showQR, setShowQR] = useState(true)
  const [showBrand, setShowBrand] = useState(true)

  const { toast } = useToast()
  const hasMounted = useHasMounted()
  const shareUrl = getMemoShareUrl(memo.id)

  const activeTheme = POSTER_THEMES[activeThemeId] || POSTER_THEMES.classic

  const generateBlob = useCallback(async (pixelRatio: number) => {
    if (!posterRef.current) throw new Error("Poster reference not found")

    await document.fonts.ready
    return await toBlob(posterRef.current, {
      cacheBust: true,
      pixelRatio,
      style: {
        transform: "none",
        margin: "0",
      },
    })
  }, [])

  const handleCopyToClipboard = useCallback(async () => {
    if (!posterRef.current) return
    try {
      setActiveAction("copy")
      await new Promise((resolve) => setTimeout(resolve, 150))

      const blobPromise = generateBlob(2.5).then((blob) => {
        if (!blob) throw new Error("Generated blob is null")
        return blob
      })

      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })])
      } catch (e) {
        console.warn("ClipboardItem Promise rejected, trying fallback...", e)
        const blob = await blobPromise
        if (!blob) throw new Error("Blob generation yielded no data")

        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      }

      toast({ title: "已复制到剪贴板" })
    } catch (err) {
      console.error("Copy failed full error:", err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      toast({
        title: "复制失败",
        description: `错误: ${errorMsg}。请尝试“保存海报”或长按图片。`,
        variant: "destructive",
      })
    } finally {
      setActiveAction(null)
    }
  }, [generateBlob, toast])

  const handleDownload = useCallback(async () => {
    try {
      setActiveAction("download")
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)))

      const blob = await generateBlob(2.5)
      if (!blob) return

      const fileName = getExportFileName(memo)
      const link = document.createElement("a")
      link.download = `${fileName}.png`
      link.href = URL.createObjectURL(blob)
      link.click()

      setTimeout(() => URL.revokeObjectURL(link.href), 150)
      toast({ title: "海报已保存", description: fileName })
    } catch (err) {
      console.error("Save failed", err)
      toast({ title: "保存失败", variant: "destructive" })
    } finally {
      setActiveAction(null)
    }
  }, [generateBlob, memo, toast])

  if (!hasMounted) return trigger || null

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <HugeiconsIcon icon={Share2} size={16} className="text-muted-foreground" />
          </Button>
        )}
      </div>

      <AdminDialogShell
        open={open}
        onOpenChange={setOpen}
        title="分享预览"
        subtitle="生成并下载精美海报"
        icon={Share2}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col items-center gap-4">
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
                        backgroundColor: activeTheme.styles.container.backgroundColor,
                        clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Header */}
              {(showBrand || showDate) && (
                <div
                  className="flex justify-between items-center pb-4 mb-4"
                  style={{
                    borderBottom: activeTheme.styles.header.borderBottom,
                  }}
                >
                  {showBrand ? (
                    <span
                      className="font-bold tracking-[0.2em] uppercase"
                      style={{
                        color: activeTheme.styles.header.brandColor,
                        fontSize: activeTheme.styles.header.fontSize,
                      }}
                    >
                      JustMemo
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

              {/* Content Area */}
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

              {/* Footer */}
              <div
                className="pt-6 flex justify-between items-end"
                style={{ borderTop: activeTheme.styles.footer.borderTop }}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[10px] font-medium tracking-widest uppercase opacity-50"
                    style={{ color: activeTheme.styles.footer.textColor }}
                  >
                    Captured via JustMemo
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
                    className="p-[5px] rounded-[10px]"
                    style={{
                      backgroundColor: activeTheme.styles.footer.qrBgColor,
                    }}
                  >
                    <QRCodeSVG
                      value={shareUrl}
                      size={42}
                      fgColor={activeTheme.styles.footer.qrFgColor}
                      bgColor="transparent"
                      className="rounded-[5px] overflow-hidden"
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
                          backgroundColor: activeTheme.styles.container.backgroundColor,
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
                      activeThemeId === t.id ? "bg-background font-medium" : "text-muted-foreground"
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
                        ? "bg-primary border-primary-[0_0_8px_rgba(var(--primary),0.4)]"
                        : "border-muted-foreground/30 bg-transparent"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[12px]",
                      item.state ? "text-foreground font-medium" : "text-muted-foreground"
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
              className="flex-1 h-11 text-sm border-border/60 relative overflow-hidden group/btn"
              onClick={handleCopyToClipboard}
              disabled={activeAction !== null}
            >
              <span
                className={cn(
                  "flex items-center justify-center gap-2 transition-opacity duration-200",
                  activeAction === "copy" ? "opacity-0" : "opacity-100"
                )}
              >
                <HugeiconsIcon icon={Copy} size={18} />
                复制图片
              </span>

              {activeAction === "copy" && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin [will-change:transform]" />
                  <span className="font-medium text-primary">处理中...</span>
                </div>
              )}
            </Button>

            <Button
              className="flex-1 h-11 text-sm font-medium relative overflow-hidden group/btn"
              onClick={handleDownload}
              disabled={activeAction !== null}
            >
              <span
                className={cn(
                  "flex items-center justify-center gap-2 transition-opacity duration-200",
                  activeAction === "download" ? "opacity-0" : "opacity-100"
                )}
              >
                <HugeiconsIcon icon={Download} size={18} />
                保存海报
              </span>

              {activeAction === "download" && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-primary/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin [will-change:transform]" />
                  <span className="font-medium text-primary-foreground">生成中...</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </AdminDialogShell>
    </>
  )
}
