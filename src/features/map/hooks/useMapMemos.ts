"use client"

import { useState, useEffect, ComponentType } from "react"
import { getMemosWithLocations } from "@/server/actions/memos/query"
import { locationCache, type MapMarker } from "@/shared/lib/location-cache"
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
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [MapView, setMapView] = useState<ComponentType<MapViewProps> | null>(
    null
  )

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const hasCache =
        locationCache.getInitialized() && unlockedMemoIds.length === 0
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
        const groupedMap = new Map<string, MapMarker>()
        const data = result.data || []

        data.forEach((memo) => {
          memo.locations.forEach((loc) => {
            const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`
            if (groupedMap.has(key)) {
              groupedMap.get(key)!.items.push(memo)
            } else {
              groupedMap.set(key, { ...loc, items: [memo] })
            }
          })
        })

        const allMarkers = Array.from(groupedMap.values())
        locationCache.setMarkers(allMarkers)
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
  }, [unlockedMemoIds])

  return { markers, isLoading, MapView }
}
