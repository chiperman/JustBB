function getUnlockedCacheKey(unlockedMemoIds: string[]) {
  return unlockedMemoIds.length > 0 ? [...unlockedMemoIds].sort().join(",") : "none"
}

export function getGalleryCacheKey(unlockedMemoIds: string[]) {
  return `/gallery::unlocked=${getUnlockedCacheKey(unlockedMemoIds)}`
}

export function getMapCacheKey(unlockedMemoIds: string[]) {
  return `/map::unlocked=${getUnlockedCacheKey(unlockedMemoIds)}`
}
