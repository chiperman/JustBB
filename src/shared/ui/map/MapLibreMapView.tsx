"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from "maplibre-gl"

import type { MapMarker } from "@/shared/lib/location-cache"
import { cn } from "@/shared/lib/utils"
import type { MapProjection, MapViewProps } from "./types"

const SOURCE_ID = "memo-markers"
const CLUSTER_LAYER_ID = "memo-marker-clusters"
const CLUSTER_COUNT_LAYER_ID = "memo-marker-cluster-count"
const MARKER_LAYER_ID = "memo-markers"
const MARKER_COUNT_LAYER_ID = "memo-marker-count"
const AUTO_ROTATE_MAX_ZOOM = 2
const AUTO_ROTATE_DEGREES_PER_MILLISECOND = 0.0015
const AUTO_ROTATE_MAX_FRAME_DURATION = 100
const AUTO_ROTATE_INTERACTION_EVENTS = [
  "dragstart",
  "zoomstart",
  "touchstart",
  "keydown",
  "click",
] as const

interface MapFeatureProperties {
  markerId: string
  count: number
  locked: boolean
}

interface MapLibreMapViewProps extends MapViewProps {
  onUnavailable: () => void
  projection: MapProjection
  onProjectionChange: (projection: MapProjection) => void
}

function getTileUrls(theme: string | undefined) {
  const variant = theme === "dark" ? "dark_all" : "light_all"

  return ["a", "b", "c", "d"].map(
    (subdomain) =>
      `https://${subdomain}.basemaps.cartocdn.com/rastertiles/${variant}/{z}/{x}/{y}.png`
  )
}

function createStyle(theme: string | undefined, projection: MapProjection): StyleSpecification {
  return {
    version: 8,
    projection: {
      type: projection === "globe" ? "globe" : "mercator",
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
  projection,
  onProjectionChange,
}: MapLibreMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const cameraRef = useRef<{ center: [number, number]; zoom: number } | null>(null)
  const markerMapRef = useRef(new Map<string, MapMarker>())
  const markerClickRef = useRef(onMarkerClick)
  const unavailableRef = useRef(onUnavailable)
  const userStoppedAutoRotateRef = useRef(false)
  const didPositionInitiallyRef = useRef(false)
  const projectionRef = useRef(projection)
  const [readyMap, setReadyMap] = useState<MapLibreMap | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()

  const markerData = useMemo(() => createMarkerData(markers), [markers])
  projectionRef.current = projection

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
          style: createStyle(resolvedTheme, projectionRef.current),
          center: cameraRef.current?.center ?? [108.9398, 34.3416],
          zoom: cameraRef.current?.zoom ?? 2,
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
          setReadyMap(map)
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
      if (map) {
        const center = map.getCenter()
        cameraRef.current = {
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
        }
        map.remove()
      }
      if (mapRef.current === map) {
        mapRef.current = null
      }
      setReadyMap((currentMap) => (currentMap === map ? null : currentMap))
    }
  }, [markerData, markers, resolvedTheme])

  useEffect(() => {
    mapRef.current?.setProjection({
      type: projection === "globe" ? "globe" : "mercator",
    })
  }, [projection])

  useEffect(() => {
    if (!readyMap) return

    let animationFrame: number | null = null
    let previousFrameTime: number | null = null

    const stopAutoRotate = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
      previousFrameTime = null
    }

    const stopForUserInteraction = () => {
      userStoppedAutoRotateRef.current = true
      stopAutoRotate()
    }

    AUTO_ROTATE_INTERACTION_EVENTS.forEach((event) => {
      readyMap.on(event, stopForUserInteraction)
    })

    const canAutoRotate =
      projection === "globe" &&
      !shouldReduceMotion &&
      !userStoppedAutoRotateRef.current &&
      readyMap.getZoom() <= AUTO_ROTATE_MAX_ZOOM

    if (canAutoRotate) {
      const rotate = (timestamp: number) => {
        if (
          projectionRef.current !== "globe" ||
          userStoppedAutoRotateRef.current ||
          shouldReduceMotion
        ) {
          stopAutoRotate()
          return
        }

        if (previousFrameTime !== null) {
          const elapsed = Math.min(timestamp - previousFrameTime, AUTO_ROTATE_MAX_FRAME_DURATION)
          readyMap.rotateTo(readyMap.getBearing() + elapsed * AUTO_ROTATE_DEGREES_PER_MILLISECOND, {
            duration: 0,
          })
        }

        previousFrameTime = timestamp
        animationFrame = requestAnimationFrame(rotate)
      }

      animationFrame = requestAnimationFrame(rotate)
    }

    return () => {
      stopAutoRotate()
      AUTO_ROTATE_INTERACTION_EVENTS.forEach((event) => {
        readyMap.off(event, stopForUserInteraction)
      })
    }
  }, [projection, readyMap, shouldReduceMotion])

  return (
    <div className={cn("map-view map-view--full group relative h-full w-full", className)}>
      <div ref={containerRef} data-testid="maplibre-map" className="h-full w-full" />
      <div
        aria-label="地图视图"
        className="pointer-events-auto absolute left-3 top-3 z-20 inline-flex overflow-hidden rounded-inner border border-border/40 bg-popover/90 p-0.5 text-xs shadow-sm backdrop-blur-xl"
        role="group"
      >
        <button
          type="button"
          aria-pressed={projection === "flat"}
          className={cn(
            "rounded-[calc(var(--radius-inner)-2px)] px-2.5 py-1.5 transition-colors",
            projection === "flat"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onProjectionChange("flat")}
        >
          平面
        </button>
        <button
          type="button"
          aria-pressed={projection === "globe"}
          className={cn(
            "rounded-[calc(var(--radius-inner)-2px)] px-2.5 py-1.5 transition-colors",
            projection === "globe"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onProjectionChange("globe")}
        >
          地球
        </button>
      </div>
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
