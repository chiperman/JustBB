"use client"

import { useState, useEffect, ComponentType } from "react"
import { getMemosWithLocations } from "@/server/actions/memos/query"
import { locationCache, type MapMarker } from "@/shared/lib/location-cache"
import { groupMemosByLocation } from "@/shared/lib/map-markers"
import { getMapCacheKey } from "@/shared/lib/page-cache-keys"
import { usePageDataCache } from "@/state/PageDataCache"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"

// 模块级预加载
const mapViewPromise = import("@/shared/ui/MapView")

interface MapViewProps {
  markers: MapMarker[]
  mode: "mini" | "full"
  className?: string
  onMarkerClick?: (marker: MapMarker) => void
  onMapClick?: () => void
}

export function useMapMemos() {
  const { unlockedMemoIds } = useUnlockedMemos()
  const { getCache, setCache } = usePageDataCache()
  const cacheKey = getMapCacheKey(unlockedMemoIds)
  const cached = getCache(cacheKey)
  const cachedMarkers = cached?.markers as MapMarker[] | undefined
  const [markers, setMarkers] = useState<MapMarker[]>(cachedMarkers ?? [])
  const [isLoading, setIsLoading] = useState(true)
  const [MapView, setMapView] = useState<ComponentType<MapViewProps> | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const cachedData = getCache(cacheKey)
      const cachedMarkers = cachedData?.markers as MapMarker[] | undefined
      if (cachedMarkers) {
        setMarkers(cachedMarkers)
        const mapModule = await mapViewPromise
        if (!isMounted) return

        setMapView(() => mapModule.MapView)
        setIsLoading(false)
      }

      const hasCache =
        !cachedMarkers && locationCache.getInitialized() && unlockedMemoIds.length === 0
      if (hasCache) {
        setMarkers(locationCache.getMarkers())
      }

      const [result, mapModule] = await Promise.all([
        getMemosWithLocations(unlockedMemoIds),
        mapViewPromise,
      ])

      if (!isMounted) return

      setMapView(() => mapModule.MapView)

      if (result.success && isMounted) {
        const data = result.data || []
        const allMarkers = groupMemosByLocation(data)
        locationCache.setMarkers(allMarkers)
        setCache(cacheKey, { markers: allMarkers, memos: data })
        setMarkers(allMarkers)
      }

      if (isMounted && mapModule) {
        setIsLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
      setIsLoading(true)
    }
  }, [cacheKey, getCache, setCache, unlockedMemoIds])

  return { markers, isLoading, MapView }
}
