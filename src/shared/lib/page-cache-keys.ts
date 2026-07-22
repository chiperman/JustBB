import { generateCacheKey } from "@/shared/lib/utils"

function getUnlockedCacheKey(unlockedMemoIds: string[]) {
  return unlockedMemoIds.length > 0 ? [...unlockedMemoIds].sort().join(",") : "none"
}

function getViewerCacheKey(viewerId?: string | null) {
  return viewerId || "anonymous"
}

function withVisibilityScope(
  path: string,
  viewerId: string | null | undefined,
  unlockedMemoIds: string[]
) {
  return `${path}::viewer=${getViewerCacheKey(viewerId)}::unlocked=${getUnlockedCacheKey(unlockedMemoIds)}`
}

export function getHomeCacheKey(
  searchParams: Record<string, string | string[] | undefined>,
  viewerId: string | null | undefined,
  unlockedMemoIds: string[]
) {
  return withVisibilityScope(generateCacheKey(searchParams), viewerId, unlockedMemoIds)
}

export function getGalleryCacheKey(viewerId: string | null | undefined, unlockedMemoIds: string[]) {
  return withVisibilityScope("/gallery", viewerId, unlockedMemoIds)
}

export function getMapCacheKey(viewerId: string | null | undefined, unlockedMemoIds: string[]) {
  return withVisibilityScope("/map", viewerId, unlockedMemoIds)
}

export function getTagsCacheKey(viewerId?: string | null) {
  return `/tags::viewer=${getViewerCacheKey(viewerId)}`
}

export function getTrashCacheKey(viewerId?: string | null) {
  return `/trash::viewer=${getViewerCacheKey(viewerId)}`
}
