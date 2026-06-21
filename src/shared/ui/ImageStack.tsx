"use client"

import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  motion,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Image01Icon,
  RotateTopRightIcon,
  SearchAddIcon,
  SearchMinusIcon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons"
import { SmartImage } from "./SmartImage"
import { cn } from "@/shared/lib/utils"

type FitMode = "fit" | "original"
type PreviewImageStatus = "loading" | "loaded" | "error"

const SWIPE_DISTANCE_THRESHOLD = 140
const QUICK_SWIPE_DISTANCE = 44
const QUICK_SWIPE_VELOCITY = 360
const STACK_FULL_SPREAD_LAYERS = 5
const THUMBNAIL_MIN_ASPECT_RATIO = 0.82
const THUMBNAIL_MAX_ASPECT_RATIO = 2.1

function getStackSpread(offset: number) {
  const visibleSpread = Math.min(offset, STACK_FULL_SPREAD_LAYERS)
  const compressedSpread = Math.max(0, offset - STACK_FULL_SPREAD_LAYERS) * 0.28

  return visibleSpread + compressedSpread
}

function getStableHash(input: string) {
  let hash = 0

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 9973
  }

  return hash
}

function getImageRotation(src: string, imageIndex: number) {
  const hash = getStableHash(src)
  const direction = imageIndex % 2 === 0 ? -1 : 1
  const angle = 1.4 + (hash % 9) * 0.42

  return direction * angle
}

function getPreviewImageRotation(src: string, imageIndex: number, imageCount: number) {
  return imageCount <= 1 ? 0 : getImageRotation(src, imageIndex)
}

function getClampedAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) return null

  const ratio = Math.min(
    Math.max(width / height, THUMBNAIL_MIN_ASPECT_RATIO),
    THUMBNAIL_MAX_ASPECT_RATIO
  )

  return `${ratio} / 1`
}

interface ImageStackThumbnailProps {
  images: string[]
  layoutId: string
  alt?: string
  aspectRatio?: string
  preserveNaturalAspectRatio?: boolean
  className?: string
  imageContainerClassName?: string
  imageClassName?: string
  badge?: ReactNode
  overlay?: ReactNode
  onOpen: () => void
}

interface ImageStackPreviewProps {
  images: string[]
  layoutId: string
  open: boolean
  onClose: () => void
}

function PreviewImage({
  src,
  alt,
  fitMode,
  onLoadSize,
}: {
  src: string
  alt: string
  fitMode: FitMode
  onLoadSize?: (size: { width: number; height: number }) => void
}) {
  const [status, setStatus] = useState<PreviewImageStatus>("loading")

  const imageClassName =
    fitMode === "fit"
      ? "max-h-[72vh] max-w-[82vw] select-none rounded-lg object-contain shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
      : "max-h-none max-w-none select-none rounded-lg object-contain shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"

  return (
    <div className="relative flex min-h-[220px] min-w-[220px] items-center justify-center">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-border/45 bg-card shadow-[0_18px_48px_rgba(29,29,27,0.08)] dark:border-white/10 dark:bg-zinc-900">
          <div className="h-full min-h-[220px] w-full min-w-[220px] rounded-lg bg-gradient-to-br from-muted via-background to-muted/70 dark:from-white/10 dark:via-zinc-900 dark:to-white/8" />
        </div>
      )}

      {status === "error" && (
        <div className="flex min-h-[220px] min-w-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-border/50 bg-card px-6 text-muted-foreground shadow-[0_18px_48px_rgba(29,29,27,0.08)] dark:border-white/10 dark:bg-zinc-900">
          <HugeiconsIcon icon={Image01Icon} size={24} strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em]">图片不可用</span>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={(event) => {
          setStatus("loaded")
          onLoadSize?.({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }}
        onError={() => setStatus("error")}
        className={`${imageClassName} ${status === "loaded" ? "opacity-100" : "pointer-events-none absolute opacity-0"} transition-opacity duration-200`}
        draggable={false}
      />
    </div>
  )
}

export function ImageStackThumbnail({
  images,
  layoutId,
  alt = "图片预览",
  aspectRatio = "4 / 3",
  preserveNaturalAspectRatio = false,
  className,
  imageContainerClassName,
  imageClassName,
  badge,
  overlay,
  onOpen,
}: ImageStackThumbnailProps) {
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<{
    src: string
    aspectRatio: string | null
  } | null>(null)
  const visibleBackImages = images.slice(1)
  const isStacked = images.length > 1
  const primaryImage = images[0]
  const matchedNaturalAspectRatio =
    naturalAspectRatio?.src === primaryImage ? naturalAspectRatio.aspectRatio : null
  const thumbnailAspectRatio = preserveNaturalAspectRatio
    ? matchedNaturalAspectRatio || aspectRatio
    : aspectRatio

  useEffect(() => {
    if (!preserveNaturalAspectRatio || !primaryImage) return

    let isMounted = true
    const image = new window.Image()
    image.referrerPolicy = "no-referrer"
    image.onload = () => {
      if (!isMounted) return

      setNaturalAspectRatio({
        src: primaryImage,
        aspectRatio: getClampedAspectRatio(image.naturalWidth, image.naturalHeight),
      })
    }
    image.onerror = () => {
      if (!isMounted) return

      setNaturalAspectRatio({ src: primaryImage, aspectRatio: null })
    }
    image.src = primaryImage

    return () => {
      isMounted = false
    }
  }, [preserveNaturalAspectRatio, primaryImage])

  if (images.length === 0) return null

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={onOpen}
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      className={cn(
        "group relative block w-full overflow-visible rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      aria-label={`打开 ${images.length} 张图片的预览`}
    >
      {isStacked && (
        <div className="absolute inset-0">
          {visibleBackImages.map((src, index) => {
            const offset = index + 1
            const spread = getStackSpread(offset)
            const stackRotation = getImageRotation(src, offset)

            return (
              <motion.div
                key={`${src}-${index}`}
                animate={{
                  x: spread * 12,
                  y: spread * 5,
                  rotate: stackRotation,
                }}
                variants={{
                  hover: {
                    x: spread * 16,
                    y: spread * 6,
                    rotate: stackRotation * 1.18,
                  },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="absolute inset-0 rounded-xl bg-muted/20 shadow-[0_14px_34px_rgba(29,29,27,0.12)]"
                style={{
                  aspectRatio: thumbnailAspectRatio,
                  zIndex: visibleBackImages.length - index,
                }}
              >
                <SmartImage
                  src={src}
                  alt={`${alt} ${index + 2}`}
                  containerClassName={cn(
                    "h-full min-h-[140px] w-full rounded-xl",
                    imageContainerClassName
                  )}
                  className={cn("h-full w-full object-cover", imageClassName)}
                  loading="lazy"
                />
              </motion.div>
            )
          })}
        </div>
      )}

      <motion.div
        variants={{ hover: { scale: 1.01, y: -2 } }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative overflow-hidden rounded-xl bg-card shadow-[0_16px_40px_rgba(29,29,27,0.08)] ring-1 ring-border/35"
        style={{ aspectRatio: thumbnailAspectRatio, zIndex: 10 }}
      >
        <SmartImage
          src={images[0]}
          alt={alt}
          containerClassName={cn("h-full min-h-[140px] w-full rounded-xl", imageContainerClassName)}
          className={cn("h-full w-full object-cover", imageClassName)}
          loading="lazy"
        />
        {overlay}
        {badge}
      </motion.div>
    </motion.button>
  )
}

export function ImageStackPreview({ images, layoutId, open, onClose }: ImageStackPreviewProps) {
  const shouldReduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [fitMode, setFitMode] = useState<FitMode>("fit")
  const [rotation, setRotation] = useState(0)
  const [currentScale, setCurrentScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [viewport, setViewport] = useState({ width: 1000, height: 1000 })
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>(
    {}
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const swipeX = useMotionValue(0)
  const rawScale = useMotionValue(1)
  const scale = useSpring(rawScale, { stiffness: 350, damping: 35 })
  const imageCount = images.length
  const canNavigate = imageCount > 1
  const activeSrc = images[activeIndex]
  const activeImageRotation = activeSrc
    ? getPreviewImageRotation(activeSrc, activeIndex, imageCount)
    : 0
  const activeImageSize = activeSrc ? imageSizes[activeSrc] : null
  const fitBaseScale = activeImageSize
    ? Math.min(
        (viewport.width * 0.82) / activeImageSize.width,
        (viewport.height * 0.72) / activeImageSize.height,
        1
      )
    : 1
  const displayScale = (fitMode === "fit" ? fitBaseScale : 1) * currentScale
  const defaultScaleTolerance = Math.max(0.02, fitBaseScale * 0.04)
  const isBrowseMode = Math.abs(displayScale - fitBaseScale) <= defaultScaleTolerance
  const stackOffsetCompensation = currentScale > 0 ? 1 / currentScale : 1
  const swipeDistance = Math.abs(swipeOffset)
  const showSwipeHint = canNavigate && isBrowseMode && isDragging && swipeDistance > 12
  const swipeDirection = swipeOffset < 0 ? -1 : 1
  const swipeTargetLabel = swipeDirection < 0 ? "下一张" : "上一张"
  const swipeRemainingDistance = Math.max(0, Math.ceil(SWIPE_DISTANCE_THRESHOLD - swipeDistance))
  const isSwipeReady = swipeDistance >= SWIPE_DISTANCE_THRESHOLD
  const swipeFrameWidth = activeImageSize
    ? Math.max(160, activeImageSize.width * displayScale)
    : 220
  const swipeFrameHeight = activeImageSize
    ? Math.max(220, activeImageSize.height * displayScale)
    : 280
  const visualSwipeX = useTransform(swipeX, (value) => value * stackOffsetCompensation)
  const browseSwipeRotate = useTransform(visualSwipeX, (value) => {
    const dragRotation = Math.max(-4.5, Math.min(4.5, value / 58))
    return activeImageRotation + rotation + dragRotation
  })
  const stackTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 340, damping: 38, mass: 0.75 }
  const previewOpenTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 210, damping: 28, mass: 0.9 }

  const resetTransform = useCallback(() => {
    x.stop()
    y.stop()
    swipeX.stop()
    rawScale.set(1)
    x.set(0)
    y.set(0)
    swipeX.set(0)
    setSwipeOffset(0)
    setRotation(0)
  }, [rawScale, swipeX, x, y])

  const resetPreviewState = useCallback(() => {
    setActiveIndex(0)
    setFitMode("fit")
    setIsDragging(false)
    resetTransform()
  }, [resetTransform])

  const moveBy = useCallback(
    (direction: number) => {
      if (imageCount <= 1) return

      resetTransform()
      setIsDragging(false)
      setActiveIndex((prev) => (prev + direction + imageCount) % imageCount)
    },
    [imageCount, resetTransform]
  )

  const moveTo = useCallback(
    (nextIndex: number) => {
      if (imageCount <= 1) return

      resetTransform()
      setIsDragging(false)
      setActiveIndex((prev) => {
        const normalizedNext = (nextIndex + imageCount) % imageCount
        return normalizedNext === prev ? prev : normalizedNext
      })
    },
    [imageCount, resetTransform]
  )

  const handleSwipeEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setTimeout(() => {
      setIsDragging(false)
      setSwipeOffset(0)
    }, 100)

    if (!canNavigate || !isBrowseMode) return

    const horizontalOffset = Math.abs(info.offset.x)
    const verticalOffset = Math.abs(info.offset.y)
    const isMostlyHorizontal = horizontalOffset > verticalOffset * 1.2
    const isQuickSwipe =
      Math.abs(info.velocity.x) > QUICK_SWIPE_VELOCITY && horizontalOffset > QUICK_SWIPE_DISTANCE
    const isLongSwipe = horizontalOffset > SWIPE_DISTANCE_THRESHOLD

    if (!isMostlyHorizontal || (!isQuickSwipe && !isLongSwipe)) return

    if (info.offset.x < 0) {
      moveBy(1)
    } else {
      moveBy(-1)
    }

    swipeX.set(0)
    setSwipeOffset(0)
  }

  const handleBackgroundClick = () => {
    if (isDragging) return
    resetPreviewState()
    onClose()
  }

  const handleClose = useCallback(() => {
    resetPreviewState()
    onClose()
  }, [onClose, resetPreviewState])

  useEffect(() => {
    if (!open) return

    images.forEach((src) => {
      const image = new window.Image()
      image.referrerPolicy = "no-referrer"
      image.onload = () => {
        setImageSizes((prev) => {
          const cached = prev[src]
          const size = { width: image.naturalWidth, height: image.naturalHeight }
          if (cached && cached.width === size.width && cached.height === size.height) {
            return prev
          }

          return { ...prev, [src]: size }
        })
      }
      image.src = src
      image
        .decode?.()
        .then(() => {
          setImageSizes((prev) => {
            const cached = prev[src]
            const size = { width: image.naturalWidth, height: image.naturalHeight }
            if (cached && cached.width === size.width && cached.height === size.height) {
              return prev
            }

            return { ...prev, [src]: size }
          })
        })
        .catch(() => undefined)
    })
  }, [images, open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose()
      } else if (event.key === "ArrowRight" && canNavigate) {
        event.preventDefault()
        moveBy(1)
      } else if (event.key === "ArrowLeft" && canNavigate) {
        event.preventDefault()
        moveBy(-1)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [canNavigate, handleClose, moveBy, open])

  useEffect(() => {
    if (!open) return

    const onWheel = (event: Event) => {
      const wheelEvent = event as WheelEvent
      if (!wheelEvent.ctrlKey) return

      wheelEvent.preventDefault()
      wheelEvent.stopPropagation()

      const nextScale = Math.min(Math.max(rawScale.get() - wheelEvent.deltaY * 0.01, 0.25), 3)
      rawScale.set(nextScale)
    }

    window.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => window.removeEventListener("wheel", onWheel, { capture: true })
  }, [open, rawScale])

  useEffect(() => {
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    return scale.on("change", (value) => {
      setCurrentScale(value)
    })
  }, [scale])

  const stackImages = Array.from({ length: imageCount }, (_, offset) => offset)
    .map((offset) => ({
      src: images[(activeIndex + offset) % imageCount],
      imageIndex: (activeIndex + offset) % imageCount,
      offset,
    }))
    .filter(({ src }) => Boolean(src))

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-5 py-8 md:px-10"
    >
      <motion.button
        type="button"
        aria-label="关闭图片预览"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-background/62 backdrop-blur-xl dark:bg-black/48"
        onClick={handleBackgroundClick}
      />

      <motion.div
        layoutId={layoutId}
        initial={shouldReduceMotion ? false : { scale: 0.94, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { scale: 0.97, y: 10 }}
        transition={previewOpenTransition}
        className="pointer-events-none relative z-10 flex h-[76vh] w-[92vw] items-center justify-center"
      >
        <motion.div
          className="relative flex cursor-grab items-center justify-center active:cursor-grabbing"
          drag={!isBrowseMode}
          dragElastic={0}
          dragMomentum={false}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 36 }}
          onDragStart={
            !isBrowseMode
              ? () => {
                  setIsDragging(true)
                  x.stop()
                  y.stop()
                }
              : undefined
          }
          onDragEnd={
            !isBrowseMode
              ? () => {
                  setTimeout(() => setIsDragging(false), 100)
                }
              : undefined
          }
          style={{
            scale,
            touchAction: isBrowseMode ? "pan-y" : "none",
            ...(!isBrowseMode ? { x, y } : {}),
          }}
        >
          {stackImages
            .slice()
            .reverse()
            .map(({ src, imageIndex, offset }) => {
              const isTop = offset === 0
              const spread = getStackSpread(offset)
              const restingX = spread * 18 * stackOffsetCompensation
              const restingY = spread * 10 * stackOffsetCompensation
              const restingScale = Math.max(0.72, 1 - spread * 0.035)
              const restingRotate =
                getPreviewImageRotation(src, imageIndex, imageCount) + (isTop ? rotation : 0)
              const dragStyle =
                isTop && isBrowseMode && isDragging
                  ? { x: visualSwipeX, rotate: browseSwipeRotate }
                  : {}

              return (
                <motion.div
                  key={`${imageIndex}-${src}`}
                  drag={isTop && isBrowseMode ? "x" : false}
                  dragConstraints={isBrowseMode ? { left: 0, right: 0 } : false}
                  dragElastic={isBrowseMode ? 0.24 : 0}
                  dragMomentum={isBrowseMode}
                  dragTransition={
                    isBrowseMode
                      ? { bounceStiffness: 280, bounceDamping: 24 }
                      : { bounceStiffness: 500, bounceDamping: 36 }
                  }
                  onDragStart={
                    isTop && isBrowseMode
                      ? () => {
                          setIsDragging(true)
                          setSwipeOffset(0)
                          swipeX.stop()
                        }
                      : undefined
                  }
                  onDrag={
                    isTop && isBrowseMode
                      ? (_, info) => {
                          setSwipeOffset(info.offset.x)
                        }
                      : undefined
                  }
                  onDragEnd={isTop && isBrowseMode ? handleSwipeEnd : undefined}
                  initial={false}
                  animate={{
                    scale: restingScale,
                    x: restingX,
                    y: restingY,
                    rotate: restingRotate,
                  }}
                  transition={stackTransition}
                  className="pointer-events-auto absolute flex items-center justify-center"
                  style={{
                    zIndex: imageCount - offset,
                    touchAction: isTop && isBrowseMode ? "pan-y" : "auto",
                    transformOrigin: "50% 50%",
                    ...dragStyle,
                  }}
                >
                  <PreviewImage
                    src={src}
                    alt={`图片 ${imageIndex + 1}`}
                    fitMode={fitMode}
                    onLoadSize={
                      isTop
                        ? (size) => {
                            setImageSizes((prev) => {
                              const cached = prev[src]
                              if (
                                cached &&
                                cached.width === size.width &&
                                cached.height === size.height
                              ) {
                                return prev
                              }

                              return { ...prev, [src]: size }
                            })
                          }
                        : undefined
                    }
                  />
                </motion.div>
              )
            })}
        </motion.div>
      </motion.div>

      {showSwipeHint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: 1,
              scale: isSwipeReady ? 1.02 : 1,
              x: "-50%",
              y: "-50%",
              rotate: swipeDirection * 5,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn(
              "absolute top-1/2 rounded-lg border-2 border-dashed bg-background/[0.03] shadow-[0_20px_70px_rgba(29,29,27,0.05)] backdrop-blur-[1px]",
              isSwipeReady ? "border-primary/80" : "border-primary/42"
            )}
            style={{
              left: `calc(50% + ${swipeDirection * SWIPE_DISTANCE_THRESHOLD}px)`,
              width: swipeFrameWidth,
              height: swipeFrameHeight,
            }}
          >
            <div
              className={cn(
                "absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full border border-dashed px-3 py-1.5 text-[11px] font-medium shadow-[0_10px_30px_rgba(29,29,27,0.08)] backdrop-blur-md",
                isSwipeReady
                  ? "border-primary/70 bg-primary/10 text-primary"
                  : "border-primary/42 bg-background/76 text-foreground/72"
              )}
            >
              {isSwipeReady
                ? `松手切换${swipeTargetLabel}`
                : `拖入框内，还差 ${swipeRemainingDistance}px`}
            </div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-inner border border-border/40 bg-popover px-3 py-1.5 backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => moveTo(activeIndex - 1)}
          disabled={!canNavigate}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-foreground/20 disabled:hover:bg-transparent disabled:hover:text-foreground/20"
          title="上一张 (←)"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
        </button>
        <span className="flex h-8 min-w-[42px] select-none items-center justify-center font-mono text-[11px] text-foreground/90">
          {activeIndex + 1}/{imageCount}
        </span>
        <button
          type="button"
          onClick={() => moveTo(activeIndex + 1)}
          disabled={!canNavigate}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-foreground/20 disabled:hover:bg-transparent disabled:hover:text-foreground/20"
          title="下一张 (→)"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
        </button>

        <div className="mx-1 h-3.5 w-px bg-border" />

        <button
          type="button"
          onClick={() => rawScale.set(Math.max(rawScale.get() - 0.25, 0.25))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground active:scale-95"
          title="缩小"
        >
          <HugeiconsIcon icon={SearchMinusIcon} size={15} strokeWidth={2} />
        </button>
        <span className="flex h-8 min-w-[36px] select-none items-center justify-center font-mono text-[11px] text-foreground">
          {Math.round(displayScale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => rawScale.set(Math.min(rawScale.get() + 0.25, 3))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground active:scale-95"
          title="放大"
        >
          <HugeiconsIcon icon={SearchAddIcon} size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => {
            setFitMode((value) => (value === "fit" ? "original" : "fit"))
            resetTransform()
          }}
          className={
            fitMode === "original"
              ? "flex h-8 w-8 items-center justify-center rounded-md text-primary transition-all hover:bg-muted hover:text-primary active:scale-95"
              : "flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground active:scale-95"
          }
          title={fitMode === "fit" ? "原始尺寸" : "适应页面"}
        >
          <HugeiconsIcon icon={ZoomInAreaIcon} size={15} strokeWidth={2} />
        </button>

        <div className="mx-1 h-3.5 w-px bg-border" />

        <button
          type="button"
          onClick={() => setRotation((value) => value + 90)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground active:scale-95"
          title="顺时针旋转 90°"
        >
          <HugeiconsIcon icon={RotateTopRightIcon} size={15} strokeWidth={2} />
        </button>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
        onClick={(event) => {
          event.stopPropagation()
          handleClose()
        }}
        className="group/close absolute top-8 right-8 z-20 rounded-2xl border border-border/50 bg-background/70 p-3 text-foreground shadow-[0_12px_34px_rgba(29,29,27,0.12)] backdrop-blur-md transition-all hover:bg-background/88 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/20"
        aria-label="关闭预览"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={22}
          strokeWidth={2}
          className="transition-transform duration-300 group-hover/close:rotate-90"
        />
      </motion.button>
    </motion.div>,
    document.body
  )
}
