"use client"

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { createPortal } from "react-dom"
import {
  AnimatePresence,
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
  BookOpen01Icon,
  Cancel01Icon,
  RotateTopRightIcon,
  SearchAddIcon,
  SearchMinusIcon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons"
import { ImageErrorState, ImageLoadingState, SmartImage } from "./SmartImage"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import { MemoContent } from "@/features/memos/components/MemoContent"
import {
  getImageLoadSnapshot,
  markImageError,
  markImageLoaded,
  useImageLoadState,
} from "@/shared/hooks/useImageLoadState"

type FitMode = "fit" | "original"

const SWIPE_DISTANCE_THRESHOLD = 140
const QUICK_SWIPE_DISTANCE = 44
const QUICK_SWIPE_VELOCITY = 360
const STACK_FULL_SPREAD_LAYERS = 5
const THUMBNAIL_MIN_ASPECT_RATIO = 0.96
const THUMBNAIL_MAX_ASPECT_RATIO = 1.55
const PINCH_ROTATION_THRESHOLD = 3
const PREVIEW_SWITCH_DURATION_MS = 420
const KEYBOARD_REPEAT_NAVIGATION_INTERVAL_MS = 560
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

interface PreviewSwitchAnimation {
  mode: "incoming" | "outgoing"
  src: string
  imageIndex: number
  direction: 1 | -1
  size: { width: number; height: number }
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

function getSwipeDragRotation(offset: number) {
  return Math.max(-4.5, Math.min(4.5, offset / 58))
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
          (viewport.height * 0.72) / imageSize.height
        )
      : 1

  return {
    width: imageSize.width * fitScale,
    height: imageSize.height * fitScale,
  }
}

function formatPreviewDate(value: string | Date) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().slice(0, 10)
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
  memo?: {
    content: string
    memoNumber?: number | string | null
    createdAt?: string | Date | null
  }
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
  const imageState = useImageLoadState(src)
  const isLoaded = imageState.status === "loaded"
  const isError = imageState.status === "error"
  const isLoading = !isError && !isLoaded

  const imageClassName = useCoverMode
    ? "h-full w-full select-none rounded-xl object-cover shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
    : fitMode === "fit"
      ? "h-auto w-full max-h-none max-w-none select-none rounded-xl object-contain shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
      : "h-auto w-auto max-h-none max-w-none select-none rounded-xl object-contain shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]"

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl shadow-[0_18px_48px_rgba(29,29,27,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
      {isLoading && <ImageLoadingState isFullPage className="rounded-xl border border-border/50" />}
      {isError && <ImageErrorState isFullPage className="rounded-xl border border-border/50" />}

      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={(event) => {
          const size = {
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          }

          markImageLoaded(src, size)
          onLoadSize?.(size)
        }}
        onError={() => markImageError(src)}
        className={cn(
          imageClassName,
          "relative z-10 transition-opacity duration-200",
          isLoaded ? "opacity-100" : "pointer-events-none absolute opacity-0"
        )}
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
  const [prevIsPreviewing, setPrevIsPreviewing] = useState(isPreviewing)
  const [localHoverEnabled, setLocalHoverEnabled] = useState(true)

  if (isPreviewing !== prevIsPreviewing) {
    setPrevIsPreviewing(isPreviewing)
    if (isPreviewing) {
      setLocalHoverEnabled(false)
    }
  }

  const visibleBackImages = images.slice(1, 4)
  const isStacked = images.length > 1
  const thumbnailContentOpacity = isPreviewing ? 0 : 1
  const primaryImage = images[0]
  const matchedNaturalAspectRatio =
    naturalAspectRatio?.src === primaryImage ? naturalAspectRatio.aspectRatio : null
  const thumbnailAspectRatio = preserveNaturalAspectRatio
    ? matchedNaturalAspectRatio || aspectRatio
    : aspectRatio

  useEffect(() => {
    if (!isPreviewing) {
      const timer = setTimeout(() => {
        setLocalHoverEnabled(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isPreviewing])

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

    if (rect && primaryFrameRef.current) {
      let left = rect.left
      let top = rect.top
      let width = rect.width
      let height = rect.height

      try {
        const style = window.getComputedStyle(primaryFrameRef.current)
        const transform = style.transform
        if (transform && transform !== "none") {
          const matches = transform.match(
            /^matrix\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)\)$/
          )
          if (matches) {
            const a = parseFloat(matches[1]) // scaleX
            const d = parseFloat(matches[4]) // scaleY
            const e = parseFloat(matches[5]) // translateX
            const f = parseFloat(matches[6]) // translateY

            width = rect.width / a
            height = rect.height / d
            const cx = rect.left + rect.width / 2 - e
            const cy = rect.top + rect.height / 2 - f
            left = cx - width / 2
            top = cy - height / 2
          }
        }
      } catch (e) {
        console.error("Failed to parse transform matrix for origin rect calculation", e)
      }

      onOpen({
        top,
        left,
        width,
        height,
        imageWidth: image?.naturalWidth || undefined,
        imageHeight: image?.naturalHeight || undefined,
      })
    } else {
      onOpen(null)
    }
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
            "absolute inset-0 transition-opacity ease-out",
            isPreviewing ? "opacity-0 duration-0" : "opacity-100 duration-100"
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
                variants={
                  localHoverEnabled
                    ? {
                        hover: {
                          x: direction * spread * 16,
                          y: spread * 6,
                          rotate: stackRotation * 1.18,
                        },
                      }
                    : {}
                }
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
        variants={localHoverEnabled ? { hover: { scale: 1.01, y: -2 } } : {}}
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
          animate={{ opacity: thumbnailContentOpacity }}
          transition={{ duration: isPreviewing ? 0 : 0.1, ease: "easeOut" }}
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
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: thumbnailContentOpacity }}
          transition={{ duration: isPreviewing ? 0 : 0.1, ease: "easeOut" }}
        >
          {overlay}
          {badge}
        </motion.div>
      </motion.div>
    </motion.button>
  )
}

export function ImageStackPreview({
  images,
  layoutId,
  originRect,
  memo,
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
  const [isMemoPanelOpen, setIsMemoPanelOpen] = useState(false)
  const [switchAnimation, setSwitchAnimation] = useState<PreviewSwitchAnimation | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [swipeDragRotation, setSwipeDragRotation] = useState(0)
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined"
      ? { width: 1000, height: 1000 }
      : { width: window.innerWidth, height: window.innerHeight }
  )
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>(
    () => {
      const firstSrc = images[0]
      if (!firstSrc) return {}

      const cached = getImageLoadSnapshot(firstSrc)
      if (cached.status === "loaded" && cached.width && cached.height) {
        return {
          [firstSrc]: {
            width: cached.width,
            height: cached.height,
          },
        }
      }

      if (!originRect?.imageWidth || !originRect.imageHeight) return {}

      return {
        [firstSrc]: {
          width: originRect.imageWidth,
          height: originRect.imageHeight,
        },
      }
    }
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const touchContainerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const swipeX = useMotionValue(0)
  const rawScale = useMotionValue(1)
  const scale = useSpring(rawScale, { stiffness: 260, damping: 32, mass: 0.72 })
  const pinchGestureRef = useRef<TouchGestureState | null>(null)
  const lastKeyboardNavigationAtRef = useRef(0)
  const imageCount = images.length
  const canNavigate = imageCount > 1
  const canNavigatePrevious = activeIndex > 0
  const canNavigateNext = activeIndex < imageCount - 1
  const activeSrc = images[activeIndex]
  const activeImageSize = activeSrc ? imageSizes[activeSrc] : null
  const memoContent = memo?.content.trim() || ""
  const memoCreatedDate = memo?.createdAt ? formatPreviewDate(memo.createdAt) : null
  const hasMemoContent = memoContent.length > 0
  const effectiveFitMode = isMemoPanelOpen ? "fit" : fitMode
  const fitBaseScale = activeImageSize
    ? Math.min(
        (viewport.width * 0.82) / activeImageSize.width,
        (viewport.height * 0.72) / activeImageSize.height
      )
    : 1
  const displayScale = (effectiveFitMode === "fit" ? fitBaseScale : 1) * currentScale
  const defaultScaleTolerance = Math.max(0.02, fitBaseScale * 0.04)
  const isBrowseMode = Math.abs(displayScale - fitBaseScale) <= defaultScaleTolerance
  const stackOffsetCompensation = 1
  const swipeDistance = Math.abs(swipeOffset)
  const canNavigateSwipeDirection = swipeOffset < 0 ? canNavigateNext : canNavigatePrevious
  const showSwipeHint =
    canNavigateSwipeDirection && isBrowseMode && isDragging && !isPinching && swipeDistance > 12
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
  const previewFrameSize = getPreviewFrameSize(activeImageSize, viewport, effectiveFitMode)
  const memoMaxScale = isMemoPanelOpen
    ? Math.max(
        1,
        Math.min(
          1.8,
          (viewport.width * 0.9) / Math.max(previewFrameSize.width, 1),
          (viewport.height * 0.78) / Math.max(previewFrameSize.height, 1)
        )
      )
    : 3
  const memoPanelOffset =
    hasMemoContent && isMemoPanelOpen ? -Math.min(190, viewport.width * 0.13) : 0
  const visualSwipeX = useTransform(swipeX, (value) => value * stackOffsetCompensation)
  const stackTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 340, damping: 38, mass: 0.75 }
  const switchTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration: PREVIEW_SWITCH_DURATION_MS / 1000,
        ease: [0.22, 1, 0.36, 1] as const,
        times: [0, 0.58, 1],
      }
  const outgoingSwitchTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        ...switchTransition,
        opacity: {
          duration: PREVIEW_SWITCH_DURATION_MS / 1000,
          times: [0, 0.8, 1],
          ease: "linear" as const,
        },
      }
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
    setSwipeDragRotation(0)
    setRotation(0)
  }, [rawScale, swipeX, x, y])

  const resetPreviewState = useCallback(() => {
    setActiveIndex(0)
    setFitMode("fit")
    setIsDragging(false)
    setIsPinching(false)
    resetTransform()
  }, [resetTransform])

  const clampInteractiveScale = useCallback(
    (value: number) => Math.min(clampPreviewScale(value), memoMaxScale),
    [memoMaxScale]
  )

  const handleToggleMemoPanel = useCallback(() => {
    if (!isMemoPanelOpen) {
      setFitMode("fit")
      resetTransform()
    }

    setIsMemoPanelOpen((value) => !value)
  }, [isMemoPanelOpen, resetTransform])

  const prepareSwitchAnimation = useCallback(
    (fromIndex: number, toIndex: number, direction: 1 | -1) => {
      const imageIndex = direction > 0 ? fromIndex : toIndex
      const src = images[imageIndex]
      if (!src) return

      setSwitchAnimation({
        mode: direction > 0 ? "outgoing" : "incoming",
        src,
        imageIndex,
        direction,
        size: imageSizes[src] || PREVIEW_FALLBACK_IMAGE_SIZE,
      })
    },
    [imageSizes, images]
  )

  const moveBy = useCallback(
    (direction: number) => {
      if (imageCount <= 1) return
      const nextIndex = activeIndex + direction
      if (nextIndex < 0 || nextIndex >= imageCount) return

      resetTransform()
      setIsDragging(false)
      prepareSwitchAnimation(activeIndex, nextIndex, direction < 0 ? -1 : 1)
      setActiveIndex(nextIndex)
    },
    [activeIndex, imageCount, prepareSwitchAnimation, resetTransform]
  )

  const moveTo = useCallback(
    (nextIndex: number) => {
      if (imageCount <= 1) return
      const boundedNextIndex = Math.min(Math.max(nextIndex, 0), imageCount - 1)
      if (boundedNextIndex === activeIndex) return

      resetTransform()
      setIsDragging(false)
      prepareSwitchAnimation(activeIndex, boundedNextIndex, boundedNextIndex > activeIndex ? 1 : -1)
      setActiveIndex(boundedNextIndex)
    },
    [activeIndex, imageCount, prepareSwitchAnimation, resetTransform]
  )

  const handleSwipeEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setTimeout(() => {
      setIsDragging(false)
      setSwipeOffset(0)
      setSwipeDragRotation(0)
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
    setSwipeDragRotation(0)
  }

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length !== 2) return

      event.stopPropagation()
      x.stop()
      y.stop()
      swipeX.stop()
      swipeX.set(0)
      setIsPinching(true)
      setSwipeOffset(0)
      setSwipeDragRotation(0)
      pinchGestureRef.current = {
        startDistance: getTouchDistance(event.touches),
        startAngle: getTouchAngle(event.touches),
        startScale: rawScale.get(),
        startRotation: rotation,
        hasRotated: false,
      }
    },
    [x, y, swipeX, rawScale, rotation]
  )

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      const gesture = pinchGestureRef.current
      if (!gesture || event.touches.length !== 2 || gesture.startDistance <= 0) return

      event.preventDefault()
      event.stopPropagation()

      const distanceRatio = getTouchDistance(event.touches) / gesture.startDistance
      rawScale.set(clampInteractiveScale(gesture.startScale * distanceRatio))

      const angleDelta = getShortestAngleDelta(getTouchAngle(event.touches), gesture.startAngle)
      const shouldRotate = gesture.hasRotated || Math.abs(angleDelta) >= PINCH_ROTATION_THRESHOLD
      if (!shouldRotate) return

      gesture.hasRotated = true
      setRotation(gesture.startRotation + angleDelta)
    },
    [clampInteractiveScale, rawScale]
  )

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!pinchGestureRef.current || event.touches.length >= 2) return

    pinchGestureRef.current = null
    setIsPinching(false)
    setTimeout(() => setIsDragging(false), 100)
  }, [])

  useEffect(() => {
    const container = touchContainerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
      container.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const handleClose = useCallback(() => {
    if (isClosing) return

    resetPreviewState()
    setIsMemoPanelOpen(false)
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

    const coverTimer = window.setTimeout(
      () => {
        setIsOpeningCover(false)
      },
      shouldReduceMotion ? 0 : 300
    )

    return () => {
      window.clearTimeout(coverTimer)
    }
  }, [open, shouldReduceMotion])

  useEffect(() => {
    if (!open) return

    images.forEach((src) => {
      const cached = getImageLoadSnapshot(src)
      if (cached.status === "loaded" && cached.width && cached.height) {
        const cachedSize = { width: cached.width, height: cached.height }

        setImageSizes((prev) => {
          const existing = prev[src]
          if (
            existing &&
            existing.width === cachedSize.width &&
            existing.height === cachedSize.height
          ) {
            return prev
          }

          return { ...prev, [src]: cachedSize }
        })
        return
      }

      const image = new window.Image()
      image.referrerPolicy = "no-referrer"
      image.onload = () => {
        const size = { width: image.naturalWidth, height: image.naturalHeight }
        markImageLoaded(src, size)
        setImageSizes((prev) => {
          const cached = prev[src]
          if (cached && cached.width === size.width && cached.height === size.height) {
            return prev
          }

          return { ...prev, [src]: size }
        })
      }
      image.onerror = () => {
        markImageError(src)
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
          const size = { width: image.naturalWidth, height: image.naturalHeight }
          markImageLoaded(src, size)
          setImageSizes((prev) => {
            const cached = prev[src]
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

    const canRunKeyboardNavigation = (event: KeyboardEvent) => {
      if (!event.repeat) return true

      const now = Date.now()
      if (now - lastKeyboardNavigationAtRef.current < KEYBOARD_REPEAT_NAVIGATION_INTERVAL_MS) {
        return false
      }

      lastKeyboardNavigationAtRef.current = now
      return true
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose()
      } else if (event.key === "ArrowLeft" && canNavigate) {
        event.preventDefault()
        if (!canRunKeyboardNavigation(event)) return
        moveBy(-1)
      } else if (event.key === "ArrowRight" && canNavigate) {
        event.preventDefault()
        if (!canRunKeyboardNavigation(event)) return
        moveBy(1)
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

      const nextScale = clampInteractiveScale(rawScale.get() - wheelEvent.deltaY * 0.01)
      rawScale.set(nextScale)
    }

    window.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => window.removeEventListener("wheel", onWheel, { capture: true })
  }, [clampInteractiveScale, open, rawScale])

  useEffect(() => {
    if (!isMemoPanelOpen) return

    rawScale.set(clampInteractiveScale(rawScale.get()))
  }, [clampInteractiveScale, isMemoPanelOpen, rawScale])

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

  useEffect(() => {
    if (!switchAnimation) return

    const timer = window.setTimeout(() => {
      setSwitchAnimation(null)
    }, PREVIEW_SWITCH_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [switchAnimation])

  const stackImages = Array.from({ length: imageCount - activeIndex }, (_, offset) => offset)
    .map((offset) => ({
      src: images[activeIndex + offset],
      imageIndex: activeIndex + offset,
      offset,
    }))
    .filter(
      ({ imageIndex, src }) =>
        Boolean(src) &&
        !(switchAnimation?.mode === "outgoing" && imageIndex === switchAnimation.imageIndex)
    )
  const outgoingFrameSize =
    switchAnimation?.mode === "outgoing"
      ? getPreviewFrameSize(switchAnimation.size, viewport, effectiveFitMode)
      : null
  const switchTravelDistance = Math.min(500, Math.max(280, viewport.width * 0.34))
  const switchLiftDistance = Math.min(110, Math.max(56, viewport.height * 0.1))
  const switchDirection = switchAnimation?.direction ?? 1
  const incomingStartX =
    switchAnimation?.mode === "incoming" ? switchTravelDistance * 0.34 * switchDirection : 0
  const incomingStartY = switchAnimation?.mode === "incoming" ? switchLiftDistance * 1.15 : 0
  const incomingStartRotate = switchAnimation?.mode === "incoming" ? 2.8 * switchDirection : 0
  const incomingMidX =
    switchAnimation?.mode === "incoming" ? switchTravelDistance * 0.82 * switchDirection : 0
  const incomingMidY = switchAnimation?.mode === "incoming" ? -switchLiftDistance * 0.25 : 0
  const incomingMidRotate = switchAnimation?.mode === "incoming" ? 6.5 * switchDirection : 0
  const outgoingExitX = switchAnimation?.mode === "outgoing" ? -switchTravelDistance * 0.82 : 0
  const outgoingExitY = switchAnimation?.mode === "outgoing" ? -switchLiftDistance * 0.25 : 0
  const outgoingExitRotate = switchAnimation?.mode === "outgoing" ? -6.5 : 0
  const outgoingReturnX = switchAnimation?.mode === "outgoing" ? -switchTravelDistance * 0.34 : 0
  const outgoingReturnY = switchAnimation?.mode === "outgoing" ? switchLiftDistance * 1.15 : 0
  const outgoingReturnRotate = switchAnimation?.mode === "outgoing" ? -2.8 : 0
  const outgoingPreviewImage = switchAnimation?.mode === "outgoing" ? switchAnimation : null
  const incomingImageIndex =
    switchAnimation?.mode === "incoming" ? switchAnimation.imageIndex : null

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
        className="absolute inset-0 bg-background/62 backdrop-blur-xl dark:bg-background/78"
        onClick={handleBackgroundClick}
      />

      <motion.div
        data-image-stack-layout-id={layoutId}
        animate={{ x: memoPanelOffset }}
        transition={previewOpenTransition}
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
            ref={touchContainerRef}
            className="relative flex h-full w-full transform-gpu items-center justify-center"
            style={{
              touchAction: "none",
              transformOrigin: "50% 50%",
            }}
          >
            {stackImages
              .slice()
              .reverse()
              .map(({ src, imageIndex, offset }) => {
                const isTop = offset === 0
                const imageSize = imageSizes[src]
                const frameSize = getPreviewFrameSize(imageSize, viewport, effectiveFitMode)
                const originFrameSize = originRect
                  ? { width: originRect.width, height: originRect.height }
                  : frameSize
                const originFrameMotion = {
                  width: originFrameSize.width,
                  height: originFrameSize.height,
                  marginLeft: -originFrameSize.width / 2,
                  marginTop: -originFrameSize.height / 2,
                }
                const previewFrameMotion = {
                  width: frameSize.width,
                  height: frameSize.height,
                  marginLeft: -frameSize.width / 2,
                  marginTop: -frameSize.height / 2,
                }
                const spread = getStackSpread(offset)
                const restingX = spread * 18 * stackOffsetCompensation
                const restingY = spread * 10 * stackOffsetCompensation
                const restingScale = Math.max(0.72, 1 - spread * 0.035)
                const restingRotate = isTop
                  ? rotation + swipeDragRotation
                  : getPreviewImageRotation(src, imageIndex, imageCount)
                const dragStyle =
                  isTop && isBrowseMode && isDragging && !isPinching ? { x: visualSwipeX } : {}
                const isIncomingTop = isTop && incomingImageIndex === imageIndex
                const isOutgoingRevealTop = isTop && switchAnimation?.mode === "outgoing"

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
                            setSwipeDragRotation(0)
                            swipeX.stop()
                          }
                        : undefined
                    }
                    onDrag={
                      isTop && isBrowseMode && !isPinching
                        ? (_, info) => {
                            setSwipeOffset(info.offset.x)
                            setSwipeDragRotation(getSwipeDragRotation(info.offset.x))
                          }
                        : undefined
                    }
                    onDragEnd={isTop && isBrowseMode && !isPinching ? handleSwipeEnd : undefined}
                    initial={shouldReduceMotion ? false : originFrameMotion}
                    animate={
                      isIncomingTop
                        ? {
                            ...previewFrameMotion,
                            scale: [0.78, 0.94, restingScale],
                            x: [incomingStartX, incomingMidX, restingX],
                            y: [incomingStartY, incomingMidY, restingY],
                            rotate: [incomingStartRotate, incomingMidRotate, restingRotate],
                            opacity: [0.45, 0.88, 1],
                            zIndex: [70, 72, imageCount - offset],
                          }
                        : isOutgoingRevealTop
                          ? {
                              ...previewFrameMotion,
                              scale: restingScale,
                              x: restingX,
                              y: restingY,
                              rotate: restingRotate,
                            }
                          : {
                              ...previewFrameMotion,
                              scale: restingScale,
                              x: restingX,
                              y: restingY,
                              rotate: restingRotate,
                            }
                    }
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : {
                            ...originFrameMotion,
                            x: restingX,
                            y: restingY,
                            scale: restingScale,
                            rotate: restingRotate,
                            transition: previewCloseTransition,
                          }
                    }
                    transition={
                      isIncomingTop || isOutgoingRevealTop ? switchTransition : stackTransition
                    }
                    className="pointer-events-auto absolute flex items-center justify-center"
                    style={{
                      left: "50%",
                      top: "50%",
                      zIndex: imageCount - offset,
                      touchAction: "none",
                      transformOrigin: "50% 50%",
                      ...dragStyle,
                    }}
                  >
                    <motion.div
                      className={cn(
                        "flex h-full w-full items-center justify-center",
                        isTop &&
                          !isBrowseMode &&
                          !isPinching &&
                          "cursor-grab active:cursor-grabbing"
                      )}
                      drag={isTop && !isBrowseMode && !isPinching}
                      dragElastic={0}
                      dragMomentum={false}
                      dragTransition={{ bounceStiffness: 500, bounceDamping: 36 }}
                      onDragStart={
                        isTop && !isBrowseMode && !isPinching
                          ? () => {
                              setIsDragging(true)
                              x.stop()
                              y.stop()
                            }
                          : undefined
                      }
                      onDragEnd={
                        isTop && !isBrowseMode && !isPinching
                          ? () => {
                              setTimeout(() => setIsDragging(false), 100)
                            }
                          : undefined
                      }
                      style={
                        isTop
                          ? {
                              scale,
                              x: !isBrowseMode && !isPinching ? x : undefined,
                              y: !isBrowseMode && !isPinching ? y : undefined,
                              transformOrigin: "50% 50%",
                            }
                          : undefined
                      }
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
                  </motion.div>
                )
              })}
            {outgoingPreviewImage && outgoingFrameSize && (
              <motion.div
                key={`outgoing-${outgoingPreviewImage.imageIndex}-${outgoingPreviewImage.src}`}
                initial={{
                  width: outgoingFrameSize.width,
                  height: outgoingFrameSize.height,
                  marginLeft: -outgoingFrameSize.width / 2,
                  marginTop: -outgoingFrameSize.height / 2,
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  zIndex: 60,
                }}
                animate={{
                  width: outgoingFrameSize.width,
                  height: outgoingFrameSize.height,
                  marginLeft: -outgoingFrameSize.width / 2,
                  marginTop: -outgoingFrameSize.height / 2,
                  scale: [1, 0.97, 0.68],
                  x: [0, outgoingExitX, outgoingReturnX],
                  y: [0, outgoingExitY, outgoingReturnY],
                  rotate: [0, outgoingExitRotate, outgoingReturnRotate],
                  opacity: [1, 1, 0],
                  zIndex: 60,
                }}
                transition={outgoingSwitchTransition}
                className="pointer-events-none absolute left-1/2 top-1/2 z-[60] flex items-center justify-center"
                style={{
                  touchAction: "none",
                  transformOrigin: "50% 50%",
                }}
              >
                <PreviewImage
                  src={outgoingPreviewImage.src}
                  alt={`图片 ${outgoingPreviewImage.imageIndex + 1}`}
                  fitMode={fitMode}
                  useCoverMode={false}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hasMemoContent && isMemoPanelOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 18, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto absolute top-1/2 right-[6vw] z-20 flex max-h-[72vh] w-[min(400px,32vw)] -translate-y-1/2 flex-col text-left"
          >
            <div className="mb-5">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-primary/80">
                  Memo Content
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                  {memo?.memoNumber ? <span>#{memo.memoNumber}</span> : <span>正文</span>}
                  {memoCreatedDate && (
                    <span className="truncate font-mono text-[11px] font-normal text-muted-foreground">
                      {memoCreatedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <MemoContent
              content={memoContent}
              disablePreview
              className="min-h-0 overflow-y-auto pr-2 text-[15px] leading-7 text-foreground/78 [&_.link-preview-card]:my-2 [&_.link-preview-card]:max-w-full"
            />
          </motion.aside>
        )}
      </AnimatePresence>

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
        className="pointer-events-auto absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-inner border border-border/40 bg-popover px-3 py-1.5 backdrop-blur-xl"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => moveTo(activeIndex - 1)}
              disabled={!canNavigatePrevious}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-foreground/20 disabled:hover:bg-transparent disabled:hover:text-foreground/20"
              aria-label="上一张 (←)"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">上一张 (←)</TooltipContent>
        </Tooltip>
        <span className="flex h-8 min-w-[42px] select-none items-center justify-center font-mono text-[11px] text-foreground/90">
          {activeIndex + 1}/{imageCount}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => moveTo(activeIndex + 1)}
              disabled={!canNavigateNext}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-foreground/20 disabled:hover:bg-transparent disabled:hover:text-foreground/20"
              aria-label="下一张 (→)"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">下一张 (→)</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-3.5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => rawScale.set(clampInteractiveScale(rawScale.get() - 0.25))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95"
              aria-label="缩小"
            >
              <HugeiconsIcon icon={SearchMinusIcon} size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">缩小</TooltipContent>
        </Tooltip>
        <span className="flex h-8 min-w-[36px] select-none items-center justify-center font-mono text-[11px] text-foreground">
          {Math.round(displayScale * 100)}%
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => rawScale.set(clampInteractiveScale(rawScale.get() + 0.25))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95"
              aria-label="放大"
            >
              <HugeiconsIcon icon={SearchAddIcon} size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">放大</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                if (isMemoPanelOpen) return
                setFitMode((value) => (value === "fit" ? "original" : "fit"))
                resetTransform()
              }}
              disabled={isMemoPanelOpen}
              className={
                isMemoPanelOpen
                  ? "flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md text-foreground/25"
                  : fitMode === "original"
                    ? "flex h-8 w-8 items-center justify-center rounded-md text-primary transition-all hover:bg-muted hover:text-primary [@media(pointer:coarse)]:active:scale-95"
                    : "flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95"
              }
              aria-label={
                isMemoPanelOpen
                  ? "查看正文时不可用原始尺寸"
                  : fitMode === "fit"
                    ? "原始尺寸"
                    : "适应页面"
              }
            >
              <HugeiconsIcon icon={ZoomInAreaIcon} size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isMemoPanelOpen
              ? "查看正文时不可用原始尺寸"
              : fitMode === "fit"
                ? "原始尺寸"
                : "适应页面"}
          </TooltipContent>
        </Tooltip>

        <div className="mx-1 h-3.5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setRotation((value) => value + 90)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95"
              aria-label="顺时针旋转 90°"
            >
              <HugeiconsIcon icon={RotateTopRightIcon} size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">顺时针旋转 90°</TooltipContent>
        </Tooltip>
        {hasMemoContent && (
          <>
            <div className="mx-1 h-3.5 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleToggleMemoPanel}
                  className={
                    isMemoPanelOpen
                      ? "flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-all hover:bg-primary/14 [@media(pointer:coarse)]:active:scale-95"
                      : "flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:active:scale-95"
                  }
                  aria-label={isMemoPanelOpen ? "隐藏正文" : "查看正文"}
                >
                  <HugeiconsIcon icon={BookOpen01Icon} size={15} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isMemoPanelOpen ? "隐藏正文" : "查看正文"}
              </TooltipContent>
            </Tooltip>
          </>
        )}
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
        className="group/close absolute top-[calc(2rem+env(safe-area-inset-top))] right-8 z-20 rounded-2xl border border-border/50 bg-background/70 p-3 text-foreground shadow-[0_12px_34px_rgba(29,29,27,0.12)] backdrop-blur-md transition-all hover:bg-accent [@media(pointer:coarse)]:active:scale-95 dark:bg-card/72 dark:shadow-none"
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
