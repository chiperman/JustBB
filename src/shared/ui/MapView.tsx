"use client"

import React, { useRef, useEffect } from "react"
import type * as Leaflet from "leaflet"
import "leaflet/dist/leaflet.css"
import { cn } from "@/shared/lib/utils"
import type { MapMarker } from "@/shared/lib/location-cache"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location04Icon } from "@hugeicons/core-free-icons"
import { createRoot, Root } from "react-dom/client"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { UIProvider } from "@/state/UIContext"
import { Memo } from "@/types/memo"
import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons"
import { MapMemoPopupContent } from "./map/MapMemoPopupContent"
import { UnlockedMemosProvider } from "@/state/UnlockedMemosContext"

export interface MapViewProps {
  markers: MapMarker[]
  mode: "mini" | "full"
  className?: string
  interactive?: boolean
  onMapClick?: (lat: number, lng: number) => void
  onMarkerDragEnd?: (lat: number, lng: number) => void
}

export function MapView({
  markers,
  mode,
  className,
  interactive = false,
  onMapClick,
  onMarkerDragEnd,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<Leaflet.Map | null>(null)
  const clusterLayer = useRef<
    Leaflet.MarkerClusterGroup | Leaflet.LayerGroup | null
  >(null)
  const [L, setL] = React.useState<typeof Leaflet | null>(null)
  const pathname = usePathname() || "/"
  const { resolvedTheme } = useTheme()
  const [currentZoom, setCurrentZoom] = React.useState<number>(0)
  const [showZoomIndicator, setShowZoomIndicator] = React.useState(false)
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstLoadRef = useRef(true)
  // 聚合弹窗 Toggle 状态：记录上次打开弹窗的坐标 key，用于可靠的 toggle 关闭判断
  const lastClusterPopupKeyRef = useRef<string | null>(null)
  const popupRootRef = useRef<Root | null>(null)

  const invalidateMapSize = React.useCallback(() => {
    if (!mapInstance.current) return
    mapInstance.current.invalidateSize({
      pan: false,
      debounceMoveend: true,
    })
  }, [])

  const getMinZoomForContainer = React.useCallback((container: HTMLElement) => {
    const longestEdge = Math.max(container.clientWidth, container.clientHeight)
    if (longestEdge <= 256) return 0

    return Math.max(0, Math.ceil(Math.log2(longestEdge / 256)))
  }, [])

  // 计算分段 Tile URL
  const getTileUrl = (theme: string | undefined) => {
    if (theme === "dark")
      return "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
    if (theme === "light")
      return "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
    return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
  }

  const handleZoomChange = () => {
    if (!mapInstance.current) return
    const zoom = Math.round(mapInstance.current.getZoom())
    setCurrentZoom(zoom)
    setShowZoomIndicator(true)

    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
    zoomTimeoutRef.current = setTimeout(() => setShowZoomIndicator(false), 1500)
  }

  useEffect(() => {
    const initLeaflet = async () => {
      if (!L) {
        const Leaflet_mod = (await import("leaflet")).default
        // 动态导入 MarkerCluster 插件
        await import("leaflet.markercluster")
        // 导入样式项 (通常在 globals 导入，这里确保存在)
        setL(Leaflet_mod)
      }
    }
    initLeaflet()
  }, [L])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !L) return

    const minZoom = getMinZoomForContainer(mapRef.current)

    const map = L.map(mapRef.current, {
      center: [34.3416, 108.9398],
      zoom: mode === "mini" ? 12 : 2, // 初始固定为广域 Level 2
      minZoom: minZoom,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: mode === "full" || interactive,
      zoomAnimation: mode === "full",
      fadeAnimation: mode === "full",
      markerZoomAnimation: mode === "full",
      worldCopyJump: false, // 禁止副本跳转
      maxBounds: [
        [-90, -180],
        [90, 180],
      ], // 锁定全球边界
      maxBoundsViscosity: 1.0, // 边界粘性设为最高，防止拖出
    })

    L.tileLayer(getTileUrl(resolvedTheme), {
      maxZoom: 18,
      subdomains: "abcd",
      noWrap: true, // 关键：禁止瓦片重复显示
    }).addTo(map)

    // 拦截坐标图标上的双击，阻止触发地图缩放（双击空白区域仍可缩放）
    map.getContainer().addEventListener(
      "dblclick",
      (e) => {
        if ((e.target as HTMLElement).closest(".leaflet-marker-icon")) {
          e.stopPropagation()
        }
      },
      true
    ) // 捕获阶段

    if (mode === "full" || interactive) {
      map.on("zoomend", handleZoomChange)
      setCurrentZoom(Math.round(map.getZoom()))
    }

    if (interactive) {
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        onMapClick?.(e.latlng.lat, e.latlng.lng)
      })
    }

    mapInstance.current = map

    const scheduleInvalidate = () => {
      requestAnimationFrame(() => {
        const nextMinZoom = getMinZoomForContainer(map.getContainer())
        if (map.getMinZoom() !== nextMinZoom) {
          map.setMinZoom(nextMinZoom)
        }
        if (map.getZoom() < nextMinZoom) {
          map.setZoom(nextMinZoom)
        }
        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        })
      })
    }

    // Leaflet 在缩放中的弹窗内初始化时容易拿到过期尺寸，缩放后会露出白边。
    // 这里在初始化、动画结束和容器尺寸变更后都重新计算一次地图尺寸。
    const invalidateTimers = [0, 150, 320].map((delay) =>
      setTimeout(scheduleInvalidate, delay)
    )
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => scheduleInvalidate())
    resizeObserver?.observe(map.getContainer())

    const dialogContent = map.getContainer().closest('[role="dialog"]')
    dialogContent?.addEventListener("transitionend", scheduleInvalidate)
    dialogContent?.addEventListener("animationend", scheduleInvalidate)
    window.addEventListener("resize", scheduleInvalidate)

    // 依据文档开启聚合逻辑 (MarkerCluster)
    if (mode === "full") {
      const clusterGroup = (
        L as typeof Leaflet & {
          markerClusterGroup: (options?: object) => Leaflet.MarkerClusterGroup
        }
      ).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: false, // 彻底禁用蜘蛛展开行为，采用弹窗列表
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false, // 禁用默认缩放，由下方手动接管
        animate: true, // 启用内置动画，实现聚合点展开时的平滑散开效果
        animateAddingMarkers: false, // 初始添加时不播放动画，交由自定义的“呼吸入场”逻辑通过 CSS 管理
        iconCreateFunction: (cluster: Leaflet.MarkerCluster) => {
          const markers = cluster.getAllChildMarkers() as Leaflet.Marker[]
          const totalMemos = markers.reduce((acc, m) => {
            const options = m.options as Leaflet.MarkerOptions & {
              memos?: Memo[]
            }
            return acc + (options.memos?.length || 0)
          }, 0)

          return L.divIcon({
            html: `<div class="relative w-10 h-10 flex items-center justify-center shrink-0 aspect-square group">
                                ${isFirstLoadRef.current ? `<div class="animate-marker-ring shrink-0 aspect-square"></div>` : ""}
                                <div class="w-10 h-10 bg-primary/20 backdrop-blur-sm border-2 border-primary rounded-full flex items-center justify-center text-primary font-bold transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/30 shrink-0 aspect-square ${isFirstLoadRef.current ? "animate-marker-pop" : ""}">
                                    <span class="text-xs leading-none">${totalMemos}</span>
                                </div>
                               </div>`,
            className: "custom-cluster-icon",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          })
        },
      })

      // 标记地图进入“入场动画”状态
      const container = map.getContainer()
      container.classList.add("map-intro-active")

      // 2.5s 后移除入场标识，防止缩放时重新触发动画 (1.5s 错峰 + 1s 动画延时/缓冲)
      introTimeoutRef.current = setTimeout(() => {
        container.classList.remove("map-intro-active")
      }, 2500)

      // 监听 popupclose 事件，清理 React root 并延迟清理聚合弹窗的 toggle 状态
      // 延迟原因：Leaflet 的 closeOnClick 会在 clusterclick 之前触发 popupclose，
      // 如果同步清空 ref，clusterclick handler 中的 toggle 判断会失效
      map.on("popupclose", () => {
        if (popupRootRef.current) {
          popupRootRef.current.unmount()
          popupRootRef.current = null
        }
        setTimeout(() => {
          lastClusterPopupKeyRef.current = null
        }, 100)
      })

      // 手动接管点击事件，实现 2.5s 缓慢推进，并处理重合点
      clusterGroup.on("clusterclick", (a: { layer: Leaflet.MarkerCluster }) => {
        const cluster = a.layer
        const bounds = cluster.getBounds()
        const isSameLocation = bounds
          .getNorthEast()
          .equals(bounds.getSouthWest(), 0.0001)
        const currentZoom = map.getZoom()

        // 如果坐标重合，或者是已达最大缩放，则直接弹出该聚合下的所有 Memo 列表
        if (isSameLocation || currentZoom >= 18) {
          const targetLatLng = cluster.getLatLng()
          const targetKey = `${targetLatLng.lat.toFixed(6)}-${targetLatLng.lng.toFixed(6)}`

          // --- Toggle Off：基于独立 ref 判断，不依赖 map._popup ---
          // flyTo 会触发 markercluster 刷新导致旧 Popup 被销毁，
          // 因此用 ref 记录上次打开的坐标 key 来可靠判断
          if (lastClusterPopupKeyRef.current === targetKey) {
            map.closePopup()
            lastClusterPopupKeyRef.current = null
            return // 物理中断
          }

          const childMarkers = cluster.getAllChildMarkers() as Leaflet.Marker[]
          const allMemos = childMarkers.flatMap((m) => {
            const options = m.options as Leaflet.MarkerOptions & {
              memos?: Memo[]
            }
            return options.memos || []
          })
          const firstMarkerOptions = childMarkers[0]
            ?.options as Leaflet.MarkerOptions & { locationName?: string }
          const locationName = firstMarkerOptions?.locationName || "聚合地点"

          // 弹出聚合列表
          const popupEl = document.createElement("div")
          popupEl.className =
            "w-[340px] max-h-[480px] overflow-hidden flex flex-col"

          const root = createRoot(popupEl)
          popupRootRef.current = root
          root.render(
            <UnlockedMemosProvider>
              <UIProvider currentPathname={pathname}>
                <MapMemoPopupContent
                  title={locationName}
                  memos={allMemos}
                  onClose={() => map.closePopup()}
                />
              </UIProvider>
            </UnlockedMemosProvider>
          )

          const openPopup = () => {
            L.popup({
              maxWidth: 360,
              className: "modern-map-popup",
              offset: [0, -10],
              autoPan: true,
              autoPanPadding: [50, 50],
            })
              .setLatLng(targetLatLng)
              .setContent(popupEl)
              .openOn(map)
            // 记录当前打开的聚合坐标 key
            lastClusterPopupKeyRef.current = targetKey
          }

          // 直接打开，autoPan 会自动平移地图确保 popup 完全可见
          setTimeout(openPopup, 50)
        } else {
          map.flyToBounds(bounds, {
            duration: 2.5,
            easeLinearity: 0.25,
          })
        }
      })

      clusterGroup.addTo(map)
      clusterLayer.current = clusterGroup
    } else {
      clusterLayer.current = L.layerGroup().addTo(map)
    }

    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current)
      invalidateTimers.forEach((timer) => clearTimeout(timer))
      resizeObserver?.disconnect()
      dialogContent?.removeEventListener("transitionend", scheduleInvalidate)
      dialogContent?.removeEventListener("animationend", scheduleInvalidate)
      window.removeEventListener("resize", scheduleInvalidate)
      if (popupRootRef.current) {
        popupRootRef.current.unmount()
        popupRootRef.current = null
      }
      map.off()
      map.remove()
      mapInstance.current = null
    }
  }, [
    L,
    mode,
    interactive,
    onMapClick,
    pathname,
    resolvedTheme,
    getMinZoomForContainer,
  ]) // 监听主题变化

  useEffect(() => {
    if (!mapInstance.current || !clusterLayer.current || !L) return

    clusterLayer.current.clearLayers()

    const bounds: Leaflet.LatLngExpression[] = []

    // 按时间顺序（从新到旧）排序 markers，以实现有序入场
    const sortedMarkers = [...markers].sort((a, b) => {
      const timeA = Math.min(
        ...a.items.map((m) => {
          const date = new Date(m.created_at)
          return isNaN(date.getTime()) ? 0 : date.getTime()
        })
      )
      const timeB = Math.min(
        ...b.items.map((m) => {
          const date = new Date(m.created_at)
          return isNaN(date.getTime()) ? 0 : date.getTime()
        })
      )
      return timeB - timeA // 逆序：从新到旧
    })

    // 动态计算错峰间隔：总时长控制在 1.5s 左右，营造一种从容的“溯源”入场感
    const staggerDelay = Math.max(
      5,
      Math.min(50, 1500 / (sortedMarkers.length || 1))
    )

    sortedMarkers.forEach((marker, index) => {
      const pos: Leaflet.LatLngExpression = [marker.lat, marker.lng]
      bounds.push(pos)

      const isDraggable = mode === "mini" && interactive
      // 仅在首次加载的大图模式下应用错峰动画
      const delay =
        isFirstLoadRef.current && mode === "full" ? index * staggerDelay : 0

      const leafMarker = L.marker(pos, {
        draggable: isDraggable,
        // 将数据存入 options 以备聚合后回溯
        ...({
          memos: marker.items,
          locationName: marker.name,
        } as Leaflet.MarkerOptions & { memos: Memo[]; locationName: string }),
        icon: L.divIcon({
          className: "custom-div-icon",
          html: `<div class="relative w-8 h-8 flex items-center justify-center shrink-0 aspect-square group">
                            ${
                              isFirstLoadRef.current && mode === "full"
                                ? `<div class="animate-marker-ring shrink-0 aspect-square" style="animation-delay: ${delay}ms;"></div>`
                                : ""
                            }
                            <div class="w-8 h-8 bg-primary/20 backdrop-blur-sm border-2 border-primary rounded-full flex items-center justify-center text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/30 shrink-0 aspect-square ${isFirstLoadRef.current && mode === "full" ? "animate-marker-pop" : ""}" 
                                style="${isFirstLoadRef.current && mode === "full" ? `animation-delay: ${delay}ms;` : ""}">
                                ${
                                  mode === "mini"
                                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="drop-"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
                                    : `<span class="text-[10px] font-bold leading-none">${marker.items.length || 1}</span>`
                                }
                            </div>
                           </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })

      if (isDraggable) {
        leafMarker.on("dragend", (e: Leaflet.LeafletEvent) => {
          const target = e.target as Leaflet.Marker
          const position = target.getLatLng()
          onMarkerDragEnd?.(position.lat, position.lng)
        })
      } else if (marker.items.length > 0) {
        // 弹出层 (仅非编辑模式)
        const popupEl = document.createElement("div")
        popupEl.className =
          "w-[340px] max-h-[480px] overflow-hidden flex flex-col"

        const root = createRoot(popupEl)
        root.render(
          <UnlockedMemosProvider>
            <UIProvider currentPathname={pathname}>
              <MapMemoPopupContent
                title={marker.name}
                memos={marker.items}
                onClose={() => mapInstance.current?.closePopup()}
              />
            </UIProvider>
          </UnlockedMemosProvider>
        )

        leafMarker.bindPopup(popupEl, {
          maxWidth: 360,
          className: "modern-map-popup",
          offset: [0, -10],
          autoPanPadding: [50, 50],
        })
      }

      leafMarker.addTo(clusterLayer.current!)
    })

    if (bounds.length > 0 && mode === "full") {
      const latLngBounds = L.latLngBounds(bounds)

      if (isFirstLoadRef.current) {
        // 首次加载：执行瞬时定位 (无动画)，确保初始视角在标记点中心且维持 Level 2 或自动适应
        mapInstance.current.fitBounds(latLngBounds, {
          padding: [50, 50],
          animate: false, // 禁用入场动画
        })
        isFirstLoadRef.current = false
      } else {
        // 后续更新：使用 flyToBounds 实现“一次性精确跳转”设计 (同步为 2.5s)
        mapInstance.current.flyToBounds(latLngBounds, {
          padding: [50, 50],
          maxZoom: 15,
          duration: 2.5,
        })
      }
    } else if (bounds.length > 0 && mode === "mini") {
      mapInstance.current.setView(bounds[0], 13)
    }

    invalidateMapSize()
  }, [
    L,
    markers,
    mode,
    interactive,
    onMarkerDragEnd,
    pathname,
    invalidateMapSize,
  ])

  return (
    <div
      className={cn(
        "map-view relative w-full h-full group",
        mode === "mini" && "map-view--mini",
        mode === "full" && "map-view--full",
        interactive && "map-view--interactive",
        className
      )}
    >
      <div ref={mapRef} className="w-full h-full z-0" />
      {(mode === "full" || interactive) && (
        <>
          {mode === "full" ? (
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
              <div className="bg-background/80 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-full flex items-center gap-2">
                <HugeiconsIcon
                  icon={Location04Icon}
                  size={14}
                  className="text-primary"
                />
                <span className="text-[11px] font-medium tracking-tight">
                  空间锚点预览
                </span>
              </div>
            </div>
          ) : (
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <div className="bg-background/82 text-foreground/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold border border-border/50 tracking-[0.18em] uppercase">
                LEVEL {currentZoom}
              </div>
            </div>
          )}

          {/* 缩放指示器：居中、白色、现代 */}
          <AnimatePresence>
            {mode === "full" && showZoomIndicator && (
              <motion.div
                initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-8 left-1/2 z-10"
              >
                <div className="bg-background/80 text-foreground/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold border border-border/50 tracking-[0.2em] uppercase">
                  LEVEL {currentZoom}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 自定义胶囊缩放控件：对齐空间预览风格 */}
          {mode === "full" && (
            <div className="absolute bottom-6 right-6 z-10 hidden md:block">
              <div className="flex flex-col bg-background/80 backdrop-blur-md border border-border/50 rounded-full overflow-hidden">
                <button
                  onClick={() => mapInstance.current?.zoomIn()}
                  className="p-2.5 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors border-b border-border/40"
                  title="Zoom In"
                >
                  <HugeiconsIcon icon={Add01Icon} size={16} />
                </button>
                <button
                  onClick={() => mapInstance.current?.zoomOut()}
                  className="p-2.5 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors"
                  title="Zoom Out"
                >
                  <HugeiconsIcon icon={MinusSignIcon} size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
