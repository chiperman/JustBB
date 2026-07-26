"use client"

import { useState, useEffect, ComponentType, useCallback } from "react"
import type { MapMarker } from "@/shared/lib/location-cache"
import { groupMemosByLocation } from "@/shared/lib/map-markers"
import { useViewerQuery } from "@/shared/hooks/useViewerQuery"
import { getViewerMapMemos } from "@/shared/lib/viewer-memo-queries"
import { usePageDataCache } from "@/state/PageDataCache"
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
  const { cacheKey: viewerCacheKey, query } = useViewerQuery()
  const { getCache, setCache } = usePageDataCache()
  const cacheKey = viewerCacheKey("/map")
  const cached = getCache(cacheKey)
  const cachedMarkers = cached?.markers as MapMarker[] | undefined
  const [markers, setMarkers] = useState<MapMarker[]>(cachedMarkers ?? [])
  const [isLoading, setIsLoading] = useState(true)
  const [MapView, setMapView] = useState<ComponentType<MapViewProps> | null>(null)
  const [previousCacheKey, setPreviousCacheKey] = useState(cacheKey)

  if (cacheKey !== previousCacheKey) {
    const nextCachedMarkers = getCache(cacheKey)?.markers as MapMarker[] | undefined
    setPreviousCacheKey(cacheKey)
    setMarkers(nextCachedMarkers ?? [])
    setIsLoading(true)
  }

  const refreshMapMemos = useCallback(
    async (isMounted: () => boolean = () => true) => {
      const [result, mapModule] = await Promise.all([query(getViewerMapMemos), mapViewPromise])

      if (!isMounted()) return

      setMapView(() => mapModule.MapView)

      if (result.success) {
        const data = result.data || []
        const allMarkers = groupMemosByLocation(data)
        setCache(cacheKey, { markers: allMarkers, memos: data })
        setMarkers(allMarkers)
      }

      setIsLoading(false)
    },
    [cacheKey, query, setCache]
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
        void refreshMapMemos(() => isMounted)
        return
      }

      await refreshMapMemos(() => isMounted)
    }

    load()

    return () => {
      isMounted = false
    }
  }, [cacheKey, getCache, refreshMapMemos])

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
