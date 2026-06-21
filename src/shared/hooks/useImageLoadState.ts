"use client"

import { useEffect, useSyncExternalStore } from "react"

export type ImageLoadStatus = "idle" | "loading" | "loaded" | "error"

export interface ImageLoadSnapshot {
  status: ImageLoadStatus
  width?: number
  height?: number
}

const EMPTY_SNAPSHOT: ImageLoadSnapshot = { status: "idle" }
const ERROR_SNAPSHOT: ImageLoadSnapshot = { status: "error" }
const imageSnapshots = new Map<string, ImageLoadSnapshot>()
const listeners = new Map<string, Set<() => void>>()

function getListeners(src: string) {
  let srcListeners = listeners.get(src)

  if (!srcListeners) {
    srcListeners = new Set()
    listeners.set(src, srcListeners)
  }

  return srcListeners
}

function emit(src: string) {
  listeners.get(src)?.forEach((listener) => listener())
}

function setImageSnapshot(src: string, next: ImageLoadSnapshot) {
  if (!src) return

  const current = imageSnapshots.get(src)
  if (current?.status === "loaded" && next.status !== "loaded") return
  if (
    current?.status === next.status &&
    current.width === next.width &&
    current.height === next.height
  ) {
    return
  }

  imageSnapshots.set(src, next)
  emit(src)
}

export function getImageLoadSnapshot(src: string | undefined): ImageLoadSnapshot {
  if (!src) return ERROR_SNAPSHOT

  return imageSnapshots.get(src) || EMPTY_SNAPSHOT
}

export function markImageLoaded(src: string | undefined, size?: { width: number; height: number }) {
  if (!src) return

  setImageSnapshot(src, {
    status: "loaded",
    width: size?.width,
    height: size?.height,
  })
}

export function markImageError(src: string | undefined) {
  if (!src) return

  setImageSnapshot(src, { status: "error" })
}

export function ensureImageLoad(src: string | undefined) {
  if (!src || typeof window === "undefined") return

  const current = imageSnapshots.get(src)
  if (current?.status === "loading" || current?.status === "loaded") return

  setImageSnapshot(src, { status: "loading" })

  const image = new window.Image()
  image.referrerPolicy = "no-referrer"
  image.onload = () => {
    markImageLoaded(src, {
      width: image.naturalWidth,
      height: image.naturalHeight,
    })
  }
  image.onerror = () => {
    markImageError(src)
  }
  image.src = src
  image
    .decode?.()
    .then(() => {
      markImageLoaded(src, {
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    })
    .catch(() => undefined)
}

export function useImageLoadState(src: string | undefined): ImageLoadSnapshot {
  const snapshot = useSyncExternalStore(
    (listener) => {
      if (!src) return () => undefined

      const srcListeners = getListeners(src)
      srcListeners.add(listener)

      return () => {
        srcListeners.delete(listener)
      }
    },
    () => getImageLoadSnapshot(src),
    () => getImageLoadSnapshot(src)
  )

  useEffect(() => {
    ensureImageLoad(src)
  }, [src])

  return snapshot
}
