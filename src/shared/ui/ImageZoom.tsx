"use client"

import * as React from "react"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  animate,
} from "framer-motion"
import { Dialog, DialogTrigger, DialogPortal } from "./dialog"
import { cn } from "@/shared/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { SmartImage } from "./SmartImage"

interface ImageZoomProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
}

/**
 * 独立的预览内容组件
 * 每次通过 key 重新挂载，确保 useMotionValue/useSpring 彻底重置
 */
function PreviewContent({
  src,
  alt,
  onClose,
}: {
  src: string
  alt?: string
  onClose: () => void
}) {
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
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight })
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
          <div
            className={cn(
              "relative rounded-[2px]",
              fitMode === "fit" && "overflow-hidden"
            )}
          >
            <SmartImage
              src={src}
              alt={alt || "大图"}
              containerClassName={cn(
                fitMode === "fit"
                  ? "max-w-[80vw] max-h-[70vh]"
                  : "max-w-[95vw] max-h-[95vh]"
              )}
              className={cn(
                "object-contain select-none",
                fitMode === "fit"
                  ? "max-w-[80vw] max-h-[70vh]"
                  : "max-w-none max-h-none"
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 pointer-events-auto whitespace-nowrap z-20 flex items-center gap-1"
      >
        <button
          onClick={() => {
            setFitMode("fit")
            rawScale.set(1)
            x.set(0)
            y.set(0)
          }}
          className={cn(
            "px-3 py-1 rounded-full text-[11px] font-medium transition-all",
            fitMode === "fit"
              ? "bg-white/25 text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          适应
        </button>
        <button
          onClick={() => {
            setFitMode("original")
            rawScale.set(1)
            x.set(0)
            y.set(0)
          }}
          className={cn(
            "px-3 py-1 rounded-full text-[11px] font-medium transition-all",
            fitMode === "original"
              ? "bg-white/25 text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          100%
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <span className="text-primary font-mono text-[11px] bg-primary/20 px-2 py-0.5 rounded-full ring-1 ring-primary/30">
          {Math.round(currentScale * 100)}%
        </span>
        <span className="text-[10px] text-white/40 mx-2">
          Ctrl + 滚轮缩放 · 双指缩放 · 拖拽平移
        </span>
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
        className="absolute top-8 right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95 backdrop-blur-md group/close z-20 cursor-pointer"
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

export function ImageZoom({ src, alt, className, children }: ImageZoomProps) {
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
      <div
        className={cn(
          "relative overflow-hidden rounded-inner ring-1 ring-black/5",
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
          whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.985 }}
          className={cn(
            "cursor-zoom-in group/zoom relative overflow-hidden rounded-inner ring-1 ring-black/5",
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
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  )
}
