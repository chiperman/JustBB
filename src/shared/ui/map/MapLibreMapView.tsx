"use client"

import { useEffect, useMemo, useRef } from "react"
import { useTheme } from "next-themes"
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from "maplibre-gl"

import type { MapMarker } from "@/shared/lib/location-cache"
import { cn } from "@/shared/lib/utils"
import type { MapViewProps } from "./types"

const SOURCE_ID = "memo-markers"
const CLUSTER_LAYER_ID = "memo-marker-clusters"
const CLUSTER_COUNT_LAYER_ID = "memo-marker-cluster-count"
const MARKER_LAYER_ID = "memo-markers"
const MARKER_COUNT_LAYER_ID = "memo-marker-count"

interface MapFeatureProperties {
  markerId: string
  count: number
  locked: boolean
}

interface MapLibreMapViewProps extends MapViewProps {
  onUnavailable: () => void
}

function getTileUrls(theme: string | undefined) {
  const variant = theme === "dark" ? "dark_all" : "light_all"

  return ["a", "b", "c", "d"].map(
    (subdomain) =>
      `https://${subdomain}.basemaps.cartocdn.com/rastertiles/${variant}/{z}/{x}/{y}.png`
  )
}

function createStyle(theme: string | undefined): StyleSpecification {
  return {
    version: 8,
    projection: {
      type: "mercator",
    },
    sources: {
      carto: {
        type: "raster",
        tiles: getTileUrls(theme),
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> © <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: "carto",
        type: "raster",
        source: "carto",
      },
    ],
  }
}

function createMarkerData(markers: MapMarker[]) {
  return {
    type: "FeatureCollection" as const,
    features: markers.map((marker, index) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [marker.lng, marker.lat],
      },
      properties: {
        markerId: String(index),
        count: marker.items.length,
        locked: marker.items.length > 0 && marker.items.every((memo) => memo.is_locked),
      } satisfies MapFeatureProperties,
    })),
  }
}

function getBounds(markers: MapMarker[]) {
  if (markers.length === 0) return null

  let west = markers[0].lng
  let east = markers[0].lng
  let south = markers[0].lat
  let north = markers[0].lat

  for (const marker of markers.slice(1)) {
    west = Math.min(west, marker.lng)
    east = Math.max(east, marker.lng)
    south = Math.min(south, marker.lat)
    north = Math.max(north, marker.lat)
  }

  return [
    [west, south],
    [east, north],
  ] as [[number, number], [number, number]]
}

function combineMarkers(markers: MapMarker[]): MapMarker | null {
  if (markers.length === 0) return null

  const [first] = markers
  const sameLocation = markers.every(
    (marker) => marker.lat === first.lat && marker.lng === first.lng
  )

  return {
    name: sameLocation ? first.name : "聚合地点",
    lat: first.lat,
    lng: first.lng,
    items: markers.flatMap((marker) => marker.items),
  }
}

export function MapLibreMapView({
  markers,
  className,
  onMarkerClick,
  onUnavailable,
}: MapLibreMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerMapRef = useRef(new Map<string, MapMarker>())
  const markerClickRef = useRef(onMarkerClick)
  const unavailableRef = useRef(onUnavailable)
  const didPositionInitiallyRef = useRef(false)
  const { resolvedTheme } = useTheme()

  const markerData = useMemo(() => createMarkerData(markers), [markers])

  useEffect(() => {
    markerMapRef.current = new Map(markers.map((marker, index) => [String(index), marker]))
  }, [markers])

  useEffect(() => {
    markerClickRef.current = onMarkerClick
  }, [onMarkerClick])

  useEffect(() => {
    unavailableRef.current = onUnavailable
  }, [onUnavailable])

  useEffect(() => {
    if (!containerRef.current) return
    if (typeof window.WebGLRenderingContext === "undefined") {
      unavailableRef.current()
      return
    }

    let disposed = false
    let map: MapLibreMap | null = null

    const initialize = async () => {
      try {
        const maplibre = await import("maplibre-gl")
        if (disposed || !containerRef.current) return

        map = new maplibre.Map({
          container: containerRef.current,
          style: createStyle(resolvedTheme),
          center: [108.9398, 34.3416],
          zoom: 2,
          minZoom: 0,
          maxZoom: 18,
          attributionControl: false,
          renderWorldCopies: false,
        })
        mapRef.current = map

        map.once("load", () => {
          if (!map || disposed) return

          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: createMarkerData([]),
            cluster: true,
            clusterRadius: 40,
            clusterMaxZoom: 17,
            clusterProperties: {
              memoCount: ["+", ["get", "count"]],
            },
          })

          map.addLayer({
            id: CLUSTER_LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#a5634f",
              "circle-opacity": 0.22,
              "circle-stroke-color": "#a5634f",
              "circle-stroke-width": 2,
              "circle-radius": 20,
            },
          })
          map.addLayer({
            id: CLUSTER_COUNT_LAYER_ID,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["to-string", ["get", "memoCount"]],
              "text-size": 11,
              "text-font": ["Open Sans Bold"],
            },
            paint: {
              "text-color": "#a5634f",
            },
          })
          map.addLayer({
            id: MARKER_LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": ["case", ["get", "locked"], "#696865", "#a5634f"],
              "circle-opacity": 0.22,
              "circle-stroke-color": ["case", ["get", "locked"], "#696865", "#a5634f"],
              "circle-stroke-width": 2,
              "circle-radius": 16,
            },
          })
          map.addLayer({
            id: MARKER_COUNT_LAYER_ID,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": ["to-string", ["get", "count"]],
              "text-size": 10,
              "text-font": ["Open Sans Bold"],
            },
            paint: {
              "text-color": ["case", ["get", "locked"], "#696865", "#a5634f"],
            },
          })

          const source = map.getSource(SOURCE_ID) as GeoJSONSource
          const bounds = getBounds(markers)

          // 先同步相机，再写入 GeoJSON，避免首次加载时标记从世界视图漂移。
          if (!didPositionInitiallyRef.current && bounds) {
            map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 15,
              animate: false,
            })
            didPositionInitiallyRef.current = true
          }
          source.setData(markerData)
        })

        map.on("click", MARKER_LAYER_ID, (event) => {
          const markerId = event.features?.[0]?.properties?.markerId
          const marker = markerId ? markerMapRef.current.get(String(markerId)) : undefined
          if (marker) markerClickRef.current?.(marker)
        })

        map.on("click", CLUSTER_LAYER_ID, async (event) => {
          const cluster = event.features?.[0]
          const clusterId = Number(cluster?.properties?.cluster_id)
          if (!Number.isFinite(clusterId) || !map) return

          const source = map.getSource(SOURCE_ID) as GeoJSONSource
          const leaves = await source.getClusterLeaves(clusterId, Infinity, 0)
          const nextMarker = combineMarkers(
            leaves
              .map((leaf) => markerMapRef.current.get(String(leaf.properties?.markerId)))
              .filter((marker): marker is MapMarker => Boolean(marker))
          )

          if (nextMarker) markerClickRef.current?.(nextMarker)
        })

        map.on("mouseenter", CLUSTER_LAYER_ID, () => {
          if (map) map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", CLUSTER_LAYER_ID, () => {
          if (map) map.getCanvas().style.cursor = ""
        })
        map.on("mouseenter", MARKER_LAYER_ID, () => {
          if (map) map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", MARKER_LAYER_ID, () => {
          if (map) map.getCanvas().style.cursor = ""
        })
      } catch {
        if (!disposed) unavailableRef.current()
      }
    }

    void initialize()

    return () => {
      disposed = true
      map?.remove()
      mapRef.current = null
    }
  }, [markerData, markers, resolvedTheme])

  return (
    <div className={cn("map-view map-view--full group relative h-full w-full", className)}>
      <div ref={containerRef} data-testid="maplibre-map" className="h-full w-full" />
      <div
        aria-label="地图版权归属"
        className="pointer-events-auto absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-3 z-20 rounded-inner border border-border/40 bg-popover/90 px-2 py-1 text-[10px] leading-none text-muted-foreground shadow-sm backdrop-blur-xl md:bottom-3"
      >
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          © OpenStreetMap contributors
        </a>{" "}
        <a
          href="https://carto.com/attributions"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          © CARTO
        </a>
      </div>
    </div>
  )
}
