"use client"

import { useState, useEffect, ComponentType, useCallback } from "react"
import { getMemosWithLocations } from "@/server/actions/memos/query"
import { locationCache, type MapMarker } from "@/shared/lib/location-cache"
import { groupMemosByLocation } from "@/shared/lib/map-markers"
import { getMapCacheKey } from "@/shared/lib/page-cache-keys"
import { usePageDataCache } from "@/state/PageDataCache"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { shouldRefreshMemoDerivedData, useMemoSync } from "@/lib/memos/events"

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

  const refreshMapMemos = useCallback(
    async (isMounted: () => boolean = () => true) => {
      const [result, mapModule] = await Promise.all([
        getMemosWithLocations(unlockedMemoIds),
        mapViewPromise,
      ])

      if (!isMounted()) return

      setMapView(() => mapModule.MapView)

      if (result.success) {
        const data = result.data || []
        const allMarkers = groupMemosByLocation(data)
        locationCache.setMarkers(allMarkers)
        setCache(cacheKey, { markers: allMarkers, memos: data })
        setMarkers(allMarkers)
      }

      setIsLoading(false)
    },
    [cacheKey, setCache, unlockedMemoIds]
  )

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
        return
      }

      const hasCache =
        !cachedMarkers && locationCache.getInitialized() && unlockedMemoIds.length === 0
      if (hasCache) {
        setMarkers(locationCache.getMarkers())
      }

      await refreshMapMemos(() => isMounted)
    }

    load()

    return () => {
      isMounted = false
      setIsLoading(true)
    }
  }, [cacheKey, getCache, refreshMapMemos, unlockedMemoIds])

  useMemoSync(
    useCallback(
      (payload) => {
        if (shouldRefreshMemoDerivedData(payload)) {
          void refreshMapMemos()
        }
      },
      [refreshMapMemos]
    )
  )

  return { markers, isLoading, MapView }
}
