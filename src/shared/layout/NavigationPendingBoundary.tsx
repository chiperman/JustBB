"use client"

import { usePathname } from "next/navigation"

import { useLayout } from "@/state/LayoutContext"
import { NavigationPageSkeleton } from "@/shared/layout/NavigationPageSkeleton"
import { useDelayedLoadingVisibility } from "@/shared/hooks/useDelayedLoadingVisibility"
import { usePageDataCache } from "@/state/PageDataCache"
import { useOptionalUnlockedMemos } from "@/state/UnlockedMemosContext"
import { useUser } from "@/state/UserContext"
import { getGalleryCacheKey, getTagsCacheKey, getTrashCacheKey } from "@/shared/lib/page-cache-keys"

export function isNavigationPendingForPath(pendingPath: string | null, pathname: string) {
  if (!pendingPath) return false
  if (pendingPath === "/") return pathname !== "/"
  return pathname !== pendingPath && !pathname.startsWith(`${pendingPath}/`)
}

export function NavigationPendingBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const { pendingNavigationPath } = useLayout()
  const showDelayedSkeleton = useDelayedLoadingVisibility(Boolean(pendingNavigationPath))
  const { getCache } = usePageDataCache()
  const { user } = useUser()
  const unlockedMemoIds = useOptionalUnlockedMemos()?.unlockedMemoIds ?? []
  const galleryCache =
    pendingNavigationPath === "/gallery"
      ? getCache(getGalleryCacheKey(user?.id, unlockedMemoIds))
      : null
  const tagsCache = pendingNavigationPath === "/tags" ? getCache(getTagsCacheKey(user?.id)) : null
  const trashCache =
    pendingNavigationPath === "/trash" ? getCache(getTrashCacheKey(user?.id)) : null
  const galleryIsKnownEmpty = Array.isArray(galleryCache?.memos) && galleryCache.memos.length === 0
  const tagsAreKnownEmpty = Array.isArray(tagsCache?.tags) && tagsCache.tags.length === 0
  const trashIsKnownEmpty = Array.isArray(trashCache?.memos) && trashCache.memos.length === 0
  const hasKnownEmptyState = galleryIsKnownEmpty || tagsAreKnownEmpty || trashIsKnownEmpty

  if (isNavigationPendingForPath(pendingNavigationPath, pathname)) {
    return (
      <NavigationPageSkeleton
        href={pendingNavigationPath || "/"}
        showSkeleton={!hasKnownEmptyState && showDelayedSkeleton}
        galleryIsKnownEmpty={galleryIsKnownEmpty}
        tagsAreKnownEmpty={tagsAreKnownEmpty}
        trashIsKnownEmpty={trashIsKnownEmpty}
      />
    )
  }

  return children
}
