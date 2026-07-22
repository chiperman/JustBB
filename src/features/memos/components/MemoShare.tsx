"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon as Copy,
  Download01Icon as Download,
  Share01Icon as Share,
  Calendar03Icon as Calendar,
  QrCodeIcon as QrCode,
  Bookmark02Icon as Brand,
} from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Memo } from "@/types/memo"
import { useToast } from "@/shared/hooks/use-toast"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { POSTER_THEMES } from "@/shared/lib/export-themes"
import { getExportFileName } from "@/shared/lib/export-utils"
import { cn } from "@/shared/lib/utils"
import { PosterDocument } from "./share-poster/PosterDocument"

interface MemoShareProps {
  memo: Memo
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

type PosterAction = "copy" | "download" | null

async function waitForPosterImages(element: HTMLElement) {
  await Promise.all(
    Array.from(element.querySelectorAll("img")).map((image) => {
      if (image.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true })
        image.addEventListener("error", () => resolve(), { once: true })
      })
    })
  )
}

export function MemoShare({
  memo,
  trigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: MemoShareProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<PosterAction>(null)
  const [activeThemeId, setActiveThemeId] = useState("zen")
  const [showDate, setShowDate] = useState(true)
  const [showQR, setShowQR] = useState(true)
  const [showBrand, setShowBrand] = useState(true)
  const [isPosterReady, setIsPosterReady] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const hasMounted = useHasMounted()
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const activeTheme = POSTER_THEMES[activeThemeId] ?? POSTER_THEMES.zen

  useEffect(() => {
    if (!open) {
      setIsPosterReady(false)
      return
    }
    setIsPosterReady(Boolean(posterRef.current?.querySelector(".poster-document")))
  }, [open])

  const handlePosterReady = useCallback(() => setIsPosterReady(true), [])

  const generateBlob = useCallback(async () => {
    if (!posterRef.current) throw new Error("海报预览尚未准备好")

    await document.fonts.ready
    await waitForPosterImages(posterRef.current)
    const { toBlob } = await import("html-to-image")
    const blob = await toBlob(posterRef.current, {
      cacheBust: false,
      pixelRatio: 2.5,
      style: { margin: "0", transform: "none" },
    })
    if (!blob) throw new Error("海报生成失败")
    return blob
  }, [])

  const handleCopyToClipboard = useCallback(async () => {
    setActiveAction("copy")
    try {
      if (!window.isSecureContext || !navigator.clipboard?.write || !window.ClipboardItem) {
        throw new Error("当前浏览器无法复制图片，请使用“保存海报”")
      }

      const blobPromise = generateBlob()
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })])
      await blobPromise
      toast({ title: "已复制图片", description: "现在可以粘贴到聊天或文档中。" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "复制失败，请使用“保存海报”"
      toast({ title: "未能复制图片", description: message, variant: "destructive" })
    } finally {
      setActiveAction(null)
    }
  }, [generateBlob, toast])

  const handleDownload = useCallback(async () => {
    setActiveAction("download")
    try {
      const blob = await generateBlob()
      const fileName = getExportFileName(memo)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `${fileName}.png`
      link.href = url
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 500)
      toast({ title: "海报已保存", description: fileName })
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存失败，请稍后重试"
      toast({ title: "未能保存海报", description: message, variant: "destructive" })
    } finally {
      setActiveAction(null)
    }
  }, [generateBlob, memo, toast])

  if (!hasMounted) return trigger || null

  const displayToggles = [
    { label: "显示品牌", icon: Brand, value: showBrand, setValue: setShowBrand },
    { label: "显示日期", icon: Calendar, value: showDate, setValue: setShowDate },
    { label: "显示二维码", icon: QrCode, value: showQR, setValue: setShowQR },
  ]

  return (
    <>
      {!hideTrigger && (
        <div onClick={() => setOpen(true)} className="contents">
          {trigger || (
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="生成分享海报">
              <HugeiconsIcon icon={Share} size={16} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          mobileDensity="flush"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onRequestClose={() => setOpen(false)}
          className="!flex h-[min(88dvh,calc(100dvh-16px))] max-h-[min(88dvh,calc(100dvh-16px))] w-full max-w-none !flex-col !overflow-hidden !rounded-t-xl !border !border-border !bg-background !p-0 sm:h-[88vh] sm:max-h-[88vh] sm:max-w-[1280px] sm:!rounded-xl"
        >
          <DialogHeader className="relative flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border/60 px-5 pb-4 pt-10 text-left md:px-8 md:py-5">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <div className="rounded-xl bg-[#d97757]/10 p-2.5 text-[#d97757]">
                <HugeiconsIcon icon={Share} size={22} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
                  分享预览
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                  生成并下载精美海报
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
              <div className="grid gap-7 min-[900px]:grid-cols-[minmax(0,1fr)_320px] min-[900px]:items-start">
                <section className="min-w-0">
                  <div className="h-[min(44dvh,360px)] overflow-auto rounded-xl border border-border/60 bg-muted/30 p-4 min-[900px]:h-[min(60dvh,560px)] min-[900px]:p-8">
                    <div className="flex min-h-full w-full items-center justify-center">
                      <div className="shrink-0 [zoom:0.42] min-[900px]:[zoom:0.62] lg:[zoom:0.7]">
                        <div ref={posterRef}>
                          <PosterDocument
                            memo={memo}
                            theme={activeTheme}
                            showBrand={showBrand}
                            showDate={showDate}
                            showQR={showQR}
                            onReady={handlePosterReady}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 border-t border-border/60 pt-5 min-[900px]:border-t-0 min-[900px]:border-l min-[900px]:pl-7 min-[900px]:pt-0">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">选择主题</h3>
                    <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="海报主题">
                      {Object.values(POSTER_THEMES).map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setActiveThemeId(theme.id)}
                          aria-pressed={activeThemeId === theme.id}
                          className={cn(
                            "rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            activeThemeId === theme.id
                              ? "border-primary bg-primary/[0.06]"
                              : "border-border/70 hover:border-primary/40"
                          )}
                        >
                          <span
                            className="block h-11 rounded-md border border-black/5"
                            style={{ backgroundColor: theme.styles.container.backgroundColor }}
                          />
                          <span className="mt-2 block text-center text-[11px] font-medium text-foreground">
                            {theme.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-3 md:block md:py-0">
                    {displayToggles.map(({ label, icon, value, setValue }) => (
                      <button
                        key={label}
                        type="button"
                        role="switch"
                        aria-label={label}
                        aria-checked={value}
                        onClick={() => setValue(!value)}
                        className="flex min-w-0 items-center justify-start gap-2 px-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:w-full md:justify-between md:gap-3 md:border-b md:border-border/60 md:py-3.5 md:last:border-b-0"
                      >
                        <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-foreground md:gap-2.5 md:text-sm">
                          <HugeiconsIcon
                            icon={icon}
                            size={16}
                            className="hidden text-primary md:block"
                          />
                          <span className="whitespace-nowrap">
                            {label.replace("显示", "")}
                            <span className="md:hidden">：</span>
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative h-6 w-10 rounded-full transition-colors",
                            value ? "bg-primary" : "bg-muted-foreground/25"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                              value ? "translate-x-5" : "translate-x-1"
                            )}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border/60 bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-8 md:py-5 md:pb-5">
              <Button
                variant="outline"
                className="h-11 border-border/70 text-sm"
                onClick={handleCopyToClipboard}
                disabled={activeAction !== null || !isPosterReady}
              >
                <HugeiconsIcon icon={Copy} size={18} className="mr-2" />
                {activeAction === "copy" ? "复制中…" : "复制图片"}
              </Button>
              <Button
                className="h-11 text-sm"
                onClick={handleDownload}
                disabled={activeAction !== null || !isPosterReady}
              >
                <HugeiconsIcon icon={Download} size={18} className="mr-2" />
                {activeAction === "download" ? "生成中…" : "保存海报"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
