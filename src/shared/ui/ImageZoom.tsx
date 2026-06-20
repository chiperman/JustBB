"use client"

import * as React from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from "framer-motion"
import { Dialog, DialogTrigger, DialogPortal } from "./dialog"
import { cn } from "@/shared/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  SearchMinusIcon,
  SearchAddIcon,
  ZoomInAreaIcon,
  RotateTopRightIcon,
} from "@hugeicons/core-free-icons"
import { SmartImage } from "./SmartImage"

interface ImageZoomProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
  noHoverScale?: boolean
  groupImages?: string[]
  currentGroupIndex?: number
}

/**
 * 独立的预览内容组件
 * 每次通过 key 重新挂载，确保 useMotionValue/useSpring 彻底重置
 */
function PreviewContent({
  src,
  alt,
  groupImages = [src],
  initialIndex = 0,
  onClose,
}: {
  src: string
  alt?: string
  groupImages?: string[]
  initialIndex?: number
  onClose: () => void
}) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex)
  const currentSrc = groupImages[activeIndex] || src

  // 基础运动值：x, y 平移 - 直接使用 MotionValue 以获得极致跟手感
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // 缩放运动值：无级调节
  const rawScale = useMotionValue(1)
  const scale = useSpring(rawScale, { stiffness: 350, damping: 35 })

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [currentScale, setCurrentScale] = React.useState(1)
  const [fitMode, setFitMode] = React.useState<"fit" | "original">("fit")
  const isResettingRef = React.useRef(false)
  const [viewport, setViewport] = React.useState({ width: 1000, height: 1000 })
  const [rotation, setRotation] = React.useState(0)

  const resetTransform = React.useCallback(() => {
    rawScale.set(1)
    x.set(0)
    y.set(0)
    setRotation(0)
  }, [rawScale, x, y])

  const handlePrev = React.useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1)
      resetTransform()
    }
  }, [activeIndex, resetTransform])

  const handleNext = React.useCallback(() => {
    if (activeIndex < groupImages.length - 1) {
      setActiveIndex((prev) => prev + 1)
      resetTransform()
    }
  }, [activeIndex, groupImages.length, resetTransform])

  // 键盘左右翻页监听
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev()
      } else if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrev, handleNext, onClose])

  // 非 passive wheel 监听，阻止浏览器页面缩放：仅 Ctrl+滚轮 或 双指捏合缩放图片
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: Event) => {
      const we = e as WheelEvent
      if (!we.ctrlKey) return
      we.preventDefault()
      we.stopPropagation()
      const delta = -we.deltaY
      const factor = 0.01
      let nextScale = rawScale.get() + delta * factor
      nextScale = Math.min(Math.max(nextScale, 0.25), 3)
      rawScale.set(nextScale)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })

  // 初始化视口大小
  React.useEffect(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 监听 scale 变化，用于逻辑判断
  React.useEffect(() => {
    return scale.on("change", (v) => {
      setCurrentScale(v)

      // 当从放大状态回到 1.0 附近时，触发位置复位
      if (
        v >= 0.95 &&
        v <= 1.01 &&
        !isResettingRef.current &&
        (Math.abs(x.get()) > 1 || Math.abs(y.get()) > 1)
      ) {
        isResettingRef.current = true

        // 使用更具阻尼感的 spring 配置，彻底消除"闪过头"
        const springConfig = {
          type: "spring" as const,
          stiffness: 260,
          damping: 35, // 增加阻尼
          restDelta: 0.5,
        }

        animate(x, 0, springConfig)
        animate(y, 0, springConfig)
      }
      // 如果偏离了 1.0 附近，解锁状态位
      else if (v > 1.05 || v < 0.9) {
        isResettingRef.current = false
      }
    })
  }, [scale, x, y])

  // 统一点击处理：无论缩放与否，点击均关闭（最快交互路径）
  const handleBackgroundClick = () => {
    if (isDragging) return
    onClose()
  }
  // 根据缩放倍数动态计算约束范围，避免使用硬编码数值，防止高倍下找不回图片
  const dragConstraints = {
    top: -viewport.height * currentScale * 0.35,
    bottom: viewport.height * currentScale * 0.35,
    left: -viewport.width * currentScale * 0.2, // 收紧横向约束，防止宽屏丢失
    right: viewport.width * currentScale * 0.2,
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* 背景遮罩 */}
      <motion.div
        initial={false}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={handleBackgroundClick}
      />

      {/* 稳定布局容器 */}
      <motion.div className="relative z-10 w-[92vw] h-[80vh] flex items-center justify-center pointer-events-none">
        {/* 缩放与平移层 */}
        <motion.div
          className="relative flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
          style={{ x, y, scale }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          drag
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          onDragStart={() => {
            setIsDragging(true)
            isResettingRef.current = false // 拖拽开始时立即释放锁，允许下次缩回时重置
            x.stop() // 停止当前正在进行的动画
            y.stop()
          }}
          onDragEnd={() => {
            setTimeout(() => setIsDragging(false), 100)
          }}
        >
          <div className={cn("relative rounded-[2px]", fitMode === "fit" && "overflow-hidden")}>
            <SmartImage
              src={currentSrc}
              alt={alt || `大图 ${activeIndex + 1}`}
              isFullPage={true}
              containerClassName={cn(
                fitMode === "fit"
                  ? "w-full h-full min-w-[min(72vw,320px)] min-h-[min(52vh,320px)] max-w-[80vw] max-h-[70vh]"
                  : "w-auto h-auto min-w-[min(72vw,320px)] min-h-[min(52vh,320px)] max-w-none max-h-none"
              )}
              className={cn(
                "object-contain select-none",
                fitMode === "fit"
                  ? "max-w-[80vw] max-h-[70vh]"
                  : "w-auto h-auto max-w-none max-h-none"
              )}
              draggable={false}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* 底部工具栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-inner border border-border/40 bg-popover px-3 py-1.5 backdrop-blur-xl pointer-events-auto"
      >
        {/* 翻页控制 (仅当有多张图时展示) */}
        {groupImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted active:scale-95 transition-all",
                activeIndex === 0 &&
                  "text-foreground/20 hover:text-foreground/20 hover:bg-transparent pointer-events-none cursor-not-allowed"
              )}
              title="上一张 (←)"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
            </button>

            <span className="text-foreground/90 font-mono text-[11px] min-w-[32px] h-8 flex items-center justify-center select-none">
              {activeIndex + 1}/{groupImages.length}
            </span>

            <button
              onClick={handleNext}
              disabled={activeIndex === groupImages.length - 1}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted active:scale-95 transition-all",
                activeIndex === groupImages.length - 1 &&
                  "text-foreground/20 hover:text-foreground/20 hover:bg-transparent pointer-events-none cursor-not-allowed"
              )}
              title="下一张 (→)"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
            </button>

            <div className="w-px h-3.5 bg-border mx-1" />
          </>
        )}

        {/* 缩放操作 */}
        <button
          onClick={() => {
            const next = Math.max(rawScale.get() - 0.25, 0.25)
            rawScale.set(next)
          }}
          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted active:scale-95 transition-all"
          title="缩小"
        >
          <HugeiconsIcon icon={SearchMinusIcon} size={15} strokeWidth={2} />
        </button>

        <span className="text-foreground font-mono text-[11px] min-w-[36px] h-8 flex items-center justify-center select-none">
          {Math.round(currentScale * 100)}%
        </span>

        <button
          onClick={() => {
            const next = Math.min(rawScale.get() + 0.25, 3)
            rawScale.set(next)
          }}
          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted active:scale-95 transition-all"
          title="放大"
        >
          <HugeiconsIcon icon={SearchAddIcon} size={15} strokeWidth={2} />
        </button>

        <button
          onClick={() => {
            if (fitMode === "fit") {
              setFitMode("original")
            } else {
              setFitMode("fit")
            }
            resetTransform()
          }}
          className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted active:scale-95 transition-all",
            fitMode === "original"
              ? "text-primary hover:text-primary"
              : "text-foreground/70 hover:text-foreground"
          )}
          title={fitMode === "fit" ? "100% 比例" : "适应屏幕"}
        >
          <HugeiconsIcon icon={ZoomInAreaIcon} size={15} strokeWidth={2} />
        </button>

        <div className="w-px h-3.5 bg-border mx-1" />

        {/* 旋转操作 */}
        <button
          onClick={() => setRotation((r) => r + 90)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted active:scale-95 transition-all"
          title="顺时针旋转 90°"
        >
          <HugeiconsIcon icon={RotateTopRightIcon} size={15} strokeWidth={2} />
        </button>
      </motion.div>

      {/* 关闭按钮 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          delay: 0.05,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-8 right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95 backdrop-blur-md group/close z-20"
        aria-label="关闭预览"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={22}
          strokeWidth={2}
          className="group-hover/close:rotate-90 transition-transform duration-300"
        />
      </motion.button>
    </div>
  )
}

import { useHasMounted } from "@/shared/hooks/useHasMounted"

export function ImageZoom({
  src,
  alt,
  className,
  children,
  noHoverScale,
  groupImages,
  currentGroupIndex,
}: ImageZoomProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [openCount, setOpenCount] = React.useState(0)
  const hasMounted = useHasMounted()

  const handleClose = () => setIsOpen(false)

  const handleOpen = () => {
    setOpenCount((c) => c + 1)
    setIsOpen(true)
  }

  if (!hasMounted) {
    return (
      <div className={cn("relative overflow-hidden rounded-inner ring-1 ring-black/5", className)}>
        {children || (
          <SmartImage
            src={src}
            alt={alt || "图片预览"}
            containerClassName="aspect-square w-full"
            className="w-full h-full object-cover"
          />
        )}
      </div>
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        else handleOpen()
      }}
    >
      <DialogTrigger asChild>
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={alt ? `打开图片预览：${alt}` : "打开图片预览"}
          onKeyDown={(event) => {
            if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault()
              event.currentTarget.click()
            }
          }}
          style={{ scale: noHoverScale ? undefined : undefined }}
          {...(noHoverScale
            ? {}
            : {
                whileHover: { scale: 1.015, transition: { duration: 0.2 } },
                whileTap: { scale: 0.985 },
              })}
          className={cn(
            "group/zoom relative overflow-hidden rounded-inner ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            className
          )}
        >
          {children || (
            <SmartImage
              src={src}
              alt={alt || "图片预览"}
              containerClassName="aspect-square w-full"
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </DialogTrigger>

      <DialogPortal>
        <AnimatePresence mode="wait">
          {isOpen && (
            <PreviewContent
              key={openCount}
              src={src}
              alt={alt}
              groupImages={groupImages}
              initialIndex={currentGroupIndex}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  )
}
