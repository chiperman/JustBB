"use client"

import {
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
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
const THUMBNAIL_MIN_ASPECT_RATIO = 0.96
const THUMBNAIL_MAX_ASPECT_RATIO = 1.55
const PINCH_ROTATION_THRESHOLD = 3
export const IMAGE_STACK_RETURN_DURATION_MS = 420
const PREVIEW_FALLBACK_IMAGE_SIZE = { width: 560, height: 420 }

export interface ImageStackOriginRect {
  top: number
  left: number
  width: number
  height: number
  imageWidth?: number
  imageHeight?: number
}

interface TouchGestureState {
  startDistance: number
  startAngle: number
  startScale: number
  startRotation: number
  hasRotated: boolean
}

interface TouchPair {
  readonly [index: number]: {
    clientX: number
    clientY: number
  }
}

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

function getStackOffsetDirection(index: number) {
  return index % 2 === 0 ? 1 : -1
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

function clampPreviewScale(value: number) {
  return Math.min(Math.max(value, 0.25), 3)
}

function getPreviewFrameSize(
  imageSize: { width: number; height: number } | null | undefined,
  viewport: { width: number; height: number },
  fitMode: FitMode
) {
  if (!imageSize) return PREVIEW_FALLBACK_IMAGE_SIZE

  const fitScale =
    fitMode === "fit"
      ? Math.min(
          (viewport.width * 0.82) / imageSize.width,
          (viewport.height * 0.72) / imageSize.height,
          1
        )
      : 1

  return {
    width: imageSize.width * fitScale,
    height: imageSize.height * fitScale,
  }
}

function getTouchDistance(touches: TouchPair) {
  const [firstTouch, secondTouch] = [touches[0], touches[1]]

  return Math.hypot(
    secondTouch.clientX - firstTouch.clientX,
    secondTouch.clientY - firstTouch.clientY
  )
}

function getTouchAngle(touches: TouchPair) {
  const [firstTouch, secondTouch] = [touches[0], touches[1]]

  return (
    (Math.atan2(
      secondTouch.clientY - firstTouch.clientY,
      secondTouch.clientX - firstTouch.clientX
    ) *
      180) /
    Math.PI
  )
}

function getShortestAngleDelta(currentAngle: number, startAngle: number) {
  return ((((currentAngle - startAngle) % 360) + 540) % 360) - 180
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
  isPreviewing?: boolean
  badge?: ReactNode
  overlay?: ReactNode
  onOpen: (originRect: ImageStackOriginRect | null) => void
}

interface ImageStackPreviewProps {
  images: string[]
  layoutId: string
  originRect?: ImageStackOriginRect | null
  open: boolean
  onClose: () => void
}

function PreviewImage({
  src,
  alt,
  fitMode,
  useCoverMode,
  onLoadSize,
}: {
  src: string
  alt: string
  fitMode: FitMode
  useCoverMode?: boolean
  onLoadSize?: (size: { width: number; height: number }) => void
}) {
  const [status, setStatus] = useState<PreviewImageStatus>("loading")

  const imageClassName = useCoverMode
    ? "h-full w-full select-none rounded-xl object-cover shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
    : fitMode === "fit"
      ? "h-full w-full max-h-[72vh] max-w-[82vw] select-none rounded-xl object-contain shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
      : "max-h-none max-w-none select-none rounded-xl object-contain shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"

  return (
    <div className="relative flex h-full min-h-[220px] w-full min-w-[220px] items-center justify-center overflow-visible rounded-xl">
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-background px-8 text-muted-foreground shadow-[0_18px_48px_rgba(29,29,27,0.08)] dark:border-white/10 dark:bg-zinc-900">
          <HugeiconsIcon icon={Image01Icon} size={32} strokeWidth={1.5} />
          <span className="font-mono text-[12px] uppercase tracking-[0.32em]">图片不可用</span>
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
        className={`${imageClassName} relative z-10 ${status === "error" ? "pointer-events-none absolute opacity-0" : "opacity-100"}`}
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
  isPreviewing = false,
  badge,
  overlay,
  onOpen,
}: ImageStackThumbnailProps) {
  const primaryFrameRef = useRef<HTMLDivElement>(null)
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<{
    src: string
    aspectRatio: string | null
  } | null>(null)
  const visibleBackImages = images.slice(1, 4)
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

  const handleOpen = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    const rect = primaryFrameRef.current?.getBoundingClientRect()
    const image = primaryFrameRef.current?.querySelector("img")
    onOpen(
      rect
        ? {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            imageWidth: image?.naturalWidth || undefined,
            imageHeight: image?.naturalHeight || undefined,
          }
        : null
    )
  }

  return (
    <motion.button
      type="button"
      onClick={handleOpen}
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      className={cn(
        "group relative block w-full overflow-visible rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      aria-label={`打开 ${images.length} 张图片的预览`}
    >
      {isStacked && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-100",
            isPreviewing && "opacity-0"
          )}
        >
          {visibleBackImages.map((src, index) => {
            const offset = index + 1
            const spread = getStackSpread(offset)
            const direction = getStackOffsetDirection(index)
            const stackRotation = Math.abs(getImageRotation(src, offset)) * direction

            return (
              <motion.div
                key={`${src}-${index}`}
                animate={{
                  x: direction * spread * 12,
                  y: spread * 5,
                  rotate: stackRotation,
                }}
                variants={{
                  hover: {
                    x: direction * spread * 16,
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
        ref={primaryFrameRef}
        data-image-stack-primary
        variants={{ hover: { scale: 1.01, y: -2 } }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className={cn(
          "relative overflow-hidden rounded-xl shadow-[0_16px_40px_rgba(29,29,27,0.08)] ring-1 transition-[background-color,box-shadow] duration-100",
          isPreviewing ? "bg-transparent shadow-none ring-transparent" : "bg-card ring-border/35"
        )}
        style={{ aspectRatio: thumbnailAspectRatio, zIndex: 10 }}
      >
        <motion.div
          data-image-stack-layout-id={layoutId}
          className="absolute inset-0 overflow-hidden rounded-xl"
          animate={{ opacity: isPreviewing ? 0 : 1 }}
          transition={{ duration: isPreviewing ? 0 : 0.08, ease: "easeOut" }}
        >
          <SmartImage
            src={images[0]}
            alt={alt}
            containerClassName={cn(
              "h-full min-h-[140px] w-full rounded-xl",
              imageContainerClassName
            )}
            className={cn("h-full w-full object-cover", imageClassName)}
            loading="lazy"
          />
        </motion.div>
        {!isPreviewing && overlay}
        {!isPreviewing && badge}
      </motion.div>
    </motion.button>
  )
}

export function ImageStackPreview({
  images,
  layoutId,
  originRect,
  open,
  onClose,
}: ImageStackPreviewProps) {
  const shouldReduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [fitMode, setFitMode] = useState<FitMode>("fit")
  const [rotation, setRotation] = useState(0)
  const [currentScale, setCurrentScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const [isOpeningCover, setIsOpeningCover] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined"
      ? { width: 1000, height: 1000 }
      : { width: window.innerWidth, height: window.innerHeight }
  )
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>(
    () => {
      const firstSrc = images[0]
      if (!firstSrc || !originRect?.imageWidth || !originRect.imageHeight) return {}

      return {
        [firstSrc]: {
          width: originRect.imageWidth,
          height: originRect.imageHeight,
        },
      }
    }
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const swipeX = useMotionValue(0)
  const rawScale = useMotionValue(1)
  const scale = useSpring(rawScale, { stiffness: 260, damping: 32, mass: 0.72 })
  const pinchGestureRef = useRef<TouchGestureState | null>(null)
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
  const showSwipeHint =
    canNavigate && isBrowseMode && isDragging && !isPinching && swipeDistance > 12
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
  const previewFrameSize = getPreviewFrameSize(activeImageSize, viewport, fitMode)
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
    : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const }
  const previewCloseTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: IMAGE_STACK_RETURN_DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] as const }
  const originMotion = originRect
    ? {
        x: originRect.left + originRect.width / 2 - viewport.width / 2,
        y: originRect.top + originRect.height / 2 - viewport.height / 2,
        width: originRect.width,
        height: originRect.height,
      }
    : null

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
    setIsPinching(false)
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

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return

    event.stopPropagation()
    x.stop()
    y.stop()
    swipeX.stop()
    swipeX.set(0)
    setIsPinching(true)
    setSwipeOffset(0)
    pinchGestureRef.current = {
      startDistance: getTouchDistance(event.touches),
      startAngle: getTouchAngle(event.touches),
      startScale: rawScale.get(),
      startRotation: rotation,
      hasRotated: false,
    }
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const gesture = pinchGestureRef.current
    if (!gesture || event.touches.length !== 2 || gesture.startDistance <= 0) return

    event.preventDefault()
    event.stopPropagation()

    const distanceRatio = getTouchDistance(event.touches) / gesture.startDistance
    rawScale.set(clampPreviewScale(gesture.startScale * distanceRatio))

    const angleDelta = getShortestAngleDelta(getTouchAngle(event.touches), gesture.startAngle)
    const shouldRotate = gesture.hasRotated || Math.abs(angleDelta) >= PINCH_ROTATION_THRESHOLD
    if (!shouldRotate) return

    gesture.hasRotated = true
    setRotation(gesture.startRotation + angleDelta)
  }

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!pinchGestureRef.current || event.touches.length >= 2) return

    pinchGestureRef.current = null
    setIsPinching(false)
    setTimeout(() => setIsDragging(false), 100)
  }

  const handleClose = useCallback(() => {
    if (isClosing) return

    resetPreviewState()
    setIsClosing(true)

    window.requestAnimationFrame(() => {
      onClose()
    })
  }, [isClosing, onClose, resetPreviewState])

  const handleBackgroundClick = () => {
    if (isDragging || isPinching) return
    handleClose()
  }

  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(
      () => {
        setIsOpeningCover(false)
      },
      shouldReduceMotion ? 0 : 120
    )

    return () => window.clearTimeout(timer)
  }, [open, shouldReduceMotion])

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
      image.onerror = () => {
        setImageSizes((prev) => {
          const cached = prev[src]
          if (
            cached &&
            cached.width === PREVIEW_FALLBACK_IMAGE_SIZE.width &&
            cached.height === PREVIEW_FALLBACK_IMAGE_SIZE.height
          ) {
            return prev
          }

          return { ...prev, [src]: PREVIEW_FALLBACK_IMAGE_SIZE }
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

      const nextScale = clampPreviewScale(rawScale.get() - wheelEvent.deltaY * 0.01)
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
      exit={{ opacity: 1 }}
      transition={{ duration: IMAGE_STACK_RETURN_DURATION_MS / 1000 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-5 py-8 md:px-10"
    >
      <motion.button
        type="button"
        aria-label="关闭图片预览"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.24,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute inset-0 bg-background/62 backdrop-blur-xl dark:bg-black/48"
        onClick={handleBackgroundClick}
      />

      <motion.div
        data-image-stack-layout-id={layoutId}
        className="pointer-events-none relative z-10 flex h-[76vh] w-[92vw] transform-gpu items-center justify-center will-change-transform"
      >
        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : originMotion
                ? { opacity: 1, ...originMotion }
                : { opacity: 0, scale: 0.98 }
          }
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            width: previewFrameSize.width,
            height: previewFrameSize.height,
          }}
          exit={
            shouldReduceMotion
              ? undefined
              : originMotion
                ? { opacity: 1, ...originMotion, transition: previewCloseTransition }
                : { opacity: 0, scale: 0.98, transition: previewCloseTransition }
          }
          transition={previewOpenTransition}
          className="relative flex transform-gpu items-center justify-center overflow-visible rounded-xl will-change-transform"
          style={{
            width: previewFrameSize.width,
            height: previewFrameSize.height,
            transformOrigin: "50% 50%",
          }}
        >
          <motion.div
            className="relative flex h-full w-full transform-gpu cursor-grab items-center justify-center active:cursor-grabbing"
            drag={!isBrowseMode && !isPinching}
            dragElastic={0}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 36 }}
            onDragStart={
              !isBrowseMode && !isPinching
                ? () => {
                    setIsDragging(true)
                    x.stop()
                    y.stop()
                  }
                : undefined
            }
            onDragEnd={
              !isBrowseMode && !isPinching
                ? () => {
                    setTimeout(() => setIsDragging(false), 100)
                  }
                : undefined
            }
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{
              scale,
              touchAction: "none",
              transformOrigin: "50% 50%",
              ...(!isBrowseMode && !isPinching ? { x, y } : {}),
            }}
          >
            {stackImages
              .slice()
              .reverse()
              .map(({ src, imageIndex, offset }) => {
                const isTop = offset === 0
                const imageSize = imageSizes[src]
                const frameSize = getPreviewFrameSize(imageSize, viewport, fitMode)
                const spread = getStackSpread(offset)
                const restingX = spread * 18 * stackOffsetCompensation
                const restingY = spread * 10 * stackOffsetCompensation
                const restingScale = Math.max(0.72, 1 - spread * 0.035)
                const restingRotate =
                  getPreviewImageRotation(src, imageIndex, imageCount) + (isTop ? rotation : 0)
                const dragStyle =
                  isTop && isBrowseMode && isDragging && !isPinching
                    ? { x: visualSwipeX, rotate: browseSwipeRotate }
                    : {}

                return (
                  <motion.div
                    key={`${imageIndex}-${src}`}
                    drag={isTop && isBrowseMode && !isPinching ? "x" : false}
                    dragConstraints={isBrowseMode && !isPinching ? { left: 0, right: 0 } : false}
                    dragElastic={isBrowseMode && !isPinching ? 0.24 : 0}
                    dragMomentum={isBrowseMode && !isPinching}
                    dragTransition={
                      isBrowseMode && !isPinching
                        ? { bounceStiffness: 280, bounceDamping: 24 }
                        : { bounceStiffness: 500, bounceDamping: 36 }
                    }
                    onDragStart={
                      isTop && isBrowseMode && !isPinching
                        ? () => {
                            setIsDragging(true)
                            setSwipeOffset(0)
                            swipeX.stop()
                          }
                        : undefined
                    }
                    onDrag={
                      isTop && isBrowseMode && !isPinching
                        ? (_, info) => {
                            setSwipeOffset(info.offset.x)
                          }
                        : undefined
                    }
                    onDragEnd={isTop && isBrowseMode && !isPinching ? handleSwipeEnd : undefined}
                    initial={false}
                    animate={{
                      scale: restingScale,
                      x: restingX,
                      y: restingY,
                      rotate: restingRotate,
                    }}
                    transition={stackTransition}
                    className="pointer-events-auto absolute left-1/2 top-1/2 flex items-center justify-center"
                    style={{
                      width: frameSize.width,
                      height: frameSize.height,
                      marginLeft: -frameSize.width / 2,
                      marginTop: -frameSize.height / 2,
                      zIndex: imageCount - offset,
                      touchAction: "none",
                      transformOrigin: "50% 50%",
                      ...dragStyle,
                    }}
                  >
                    <PreviewImage
                      src={src}
                      alt={`图片 ${imageIndex + 1}`}
                      fitMode={fitMode}
                      useCoverMode={isOpeningCover || isClosing}
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
        transition={{
          delay: shouldReduceMotion ? 0 : 0.08,
          duration: 0.26,
          ease: [0.16, 1, 0.3, 1],
        }}
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
          onClick={() => rawScale.set(clampPreviewScale(rawScale.get() - 0.25))}
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
          onClick={() => rawScale.set(clampPreviewScale(rawScale.get() + 0.25))}
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
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{
          opacity: { duration: shouldReduceMotion ? 0 : 0.1, ease: "easeOut" },
          scale: { duration: shouldReduceMotion ? 0 : 0.1, ease: "easeOut" },
        }}
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
