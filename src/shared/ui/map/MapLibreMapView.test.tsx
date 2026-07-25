// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"
import type { Memo } from "@/types/memo"
import { MapLibreMapView } from "./MapLibreMapView"

interface MapEvent {
  features?: Array<{ properties?: Record<string, unknown> }>
}

const mapLibreHarness = vi.hoisted(() => {
  const clickHandlers = new Map<string, (event: MapEvent) => void | Promise<void>>()
  const eventHandlers = new Map<string, Set<() => void>>()
  const operations: string[] = []
  const source = {
    setData: vi.fn((data: unknown) => {
      operations.push("setData")
      return data
    }),
    setTiles: vi.fn((tiles: string[]) => {
      operations.push("setTiles")
      return tiles
    }),
    getClusterLeaves: vi.fn(async () => [
      { properties: { markerId: "0" } },
      { properties: { markerId: "1" } },
    ]),
  }

  return {
    clickHandlers,
    eventHandlers,
    operations,
    source,
    sourceOptions: undefined as Record<string, unknown> | undefined,
    options: undefined as Record<string, unknown> | undefined,
    constructCount: 0,
    removeCount: 0,
    currentZoom: 9,
    currentBearing: 0,
    currentCenter: { lng: 121.4905, lat: 31.2401 },
    setProjection: vi.fn(),
    setCenter: vi.fn((center: [number, number]) => {
      mapLibreHarness.currentCenter = { lng: center[0], lat: center[1] }
    }),
    rotateTo: vi.fn((bearing: number) => {
      mapLibreHarness.currentBearing = bearing
    }),
    throwOnConstruct: false,
    emit(event: string) {
      eventHandlers.get(event)?.forEach((handler) => handler())
    },
  }
})

const themeHarness = vi.hoisted(() => ({
  resolvedTheme: "dark" as "dark" | "light",
}))

const motionHarness = vi.hoisted(() => ({
  shouldReduceMotion: false,
}))

const animationHarness = vi.hoisted(() => ({
  callbacks: new Map<number, FrameRequestCallback>(),
  nextId: 1,
}))

const containerSizeHarness = vi.hoisted(() => ({
  width: 0,
  height: 0,
}))

const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth")
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight")

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: themeHarness.resolvedTheme }),
}))

vi.mock("framer-motion", () => ({
  useReducedMotion: () => motionHarness.shouldReduceMotion,
}))

vi.mock("maplibre-gl", () => ({
  Map: class {
    constructor(options: Record<string, unknown>) {
      if (mapLibreHarness.throwOnConstruct) throw new Error("MapLibre 初始化失败")
      mapLibreHarness.constructCount += 1
      mapLibreHarness.options = options
    }

    once(_event: string, handler: () => void) {
      handler()
    }

    addSource(_id: string, options: Record<string, unknown>) {
      mapLibreHarness.sourceOptions = options
    }

    addLayer() {}

    getSource() {
      return mapLibreHarness.source
    }

    fitBounds() {
      mapLibreHarness.operations.push("fitBounds")
    }

    setProjection(projection: unknown) {
      mapLibreHarness.setProjection(projection)
    }

    getCenter() {
      return mapLibreHarness.currentCenter
    }

    getZoom() {
      return mapLibreHarness.currentZoom
    }

    getBearing() {
      return mapLibreHarness.currentBearing
    }

    on(
      event: string,
      layerOrHandler: string | (() => void),
      maybeHandler?: (event: MapEvent) => void
    ) {
      if (typeof layerOrHandler === "string" && maybeHandler && event === "click") {
        mapLibreHarness.clickHandlers.set(layerOrHandler, maybeHandler)
        return
      }
      if (typeof layerOrHandler === "function") {
        const handlers = mapLibreHarness.eventHandlers.get(event) ?? new Set<() => void>()
        handlers.add(layerOrHandler)
        mapLibreHarness.eventHandlers.set(event, handlers)
      }
    }

    off(event: string, handler: () => void) {
      mapLibreHarness.eventHandlers.get(event)?.delete(handler)
    }

    rotateTo(bearing: number) {
      mapLibreHarness.rotateTo(bearing)
    }

    setCenter(center: [number, number]) {
      mapLibreHarness.setCenter(center)
    }

    getCanvas() {
      return { style: {} }
    }

    remove() {
      mapLibreHarness.removeCount += 1
    }
  },
}))

function renderMap(projection: "flat" | "globe") {
  return render(
    <MapLibreMapView
      markers={[]}
      mode="full"
      onMarkerClick={vi.fn()}
      onUnavailable={vi.fn()}
      projection={projection}
      onProjectionChange={vi.fn()}
    />
  )
}

function runNextAnimationFrame(timestamp = 1000) {
  const [id, callback] = animationHarness.callbacks.entries().next().value ?? []
  if (id === undefined || !callback) {
    throw new Error("没有待执行的动画帧")
  }
  animationHarness.callbacks.delete(id)
  callback(timestamp)
}

function createMemo(id: string, locked = false): Memo {
  return {
    id,
    memo_number: Number(id.slice(-1)),
    owner_id: "owner-1",
    content: locked ? "" : `memo-${id}`,
    tags: [],
    access_code_hint: null,
    created_at: "2026-07-24T00:00:00.000Z",
    updated_at: "2026-07-24T00:00:00.000Z",
    deleted_at: null,
    pinned_at: null,
    is_pinned: false,
    is_private: locked,
    word_count: 1,
    locations: [],
    images: [],
    image_metadata: {},
    is_owner: false,
    is_locked: locked,
  }
}

beforeEach(() => {
  mapLibreHarness.clickHandlers.clear()
  mapLibreHarness.eventHandlers.clear()
  mapLibreHarness.operations.length = 0
  mapLibreHarness.source.setData.mockClear()
  mapLibreHarness.source.setTiles.mockClear()
  mapLibreHarness.source.getClusterLeaves.mockClear()
  mapLibreHarness.options = undefined
  mapLibreHarness.sourceOptions = undefined
  mapLibreHarness.constructCount = 0
  mapLibreHarness.removeCount = 0
  mapLibreHarness.currentZoom = 9
  mapLibreHarness.currentBearing = 0
  mapLibreHarness.currentCenter = { lng: 121.4905, lat: 31.2401 }
  mapLibreHarness.setProjection.mockClear()
  mapLibreHarness.setCenter.mockClear()
  mapLibreHarness.rotateTo.mockClear()
  mapLibreHarness.throwOnConstruct = false
  themeHarness.resolvedTheme = "dark"
  motionHarness.shouldReduceMotion = false
  animationHarness.callbacks.clear()
  animationHarness.nextId = 1
  containerSizeHarness.width = 0
  containerSizeHarness.height = 0
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => containerSizeHarness.width,
  })
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => containerSizeHarness.height,
  })
  vi.stubGlobal("WebGLRenderingContext", class WebGLRenderingContext {})
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = animationHarness.nextId
    animationHarness.nextId += 1
    animationHarness.callbacks.set(id, callback)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    animationHarness.callbacks.delete(id)
  })
})

afterEach(() => {
  if (originalClientWidth) {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth)
  } else {
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
  }
  if (originalClientHeight) {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight)
  } else {
    delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
  }
  vi.unstubAllGlobals()
})

describe("MapLibreMapView", () => {
  it("先定位再显示安全 GeoJSON 标记", async () => {
    const lockedMarker: MapMarker = {
      name: "锁定地点",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1", true)],
    }

    render(
      <MapLibreMapView
        markers={[lockedMarker]}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.source.setData).toHaveBeenCalledTimes(1))

    expect(
      (mapLibreHarness.options?.style as { projection?: { type?: string } }).projection
    ).toEqual({
      type: "mercator",
    })
    expect(
      (
        mapLibreHarness.options?.style as {
          sources: { carto: { tiles: string[] } }
        }
      ).sources.carto.tiles
    ).toContain("https://a.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}@2x.png")
    expect(mapLibreHarness.sourceOptions?.clusterMaxZoom).toBe(17)
    expect(mapLibreHarness.sourceOptions?.clusterProperties).toEqual({
      memoCount: ["+", ["get", "count"]],
    })
    expect(mapLibreHarness.operations.indexOf("fitBounds")).toBeLessThan(
      mapLibreHarness.operations.lastIndexOf("setData")
    )

    const data = mapLibreHarness.source.setData.mock.calls.at(-1)?.[0] as {
      features: Array<{ properties: Record<string, unknown> }>
    }
    expect(data.features[0].properties).toEqual({
      markerId: "0",
      count: 1,
      locked: true,
    })
    expect(JSON.stringify(data)).not.toContain("memo-1")
    expect(JSON.stringify(data)).not.toContain("锁定地点")
    expect(JSON.stringify(data)).not.toContain("content")
    expect(JSON.stringify(data)).not.toContain("images")
    expect(JSON.stringify(data)).not.toContain("tags")
    expect(screen.getByLabelText("地图版权归属").textContent).toContain(
      "© OpenStreetMap contributors"
    )
    expect(screen.getByLabelText("地图版权归属").textContent).toContain("© CARTO")
  })

  it("单点与聚合点击都交给页面级详情回调，不创建 Popup", async () => {
    const firstMarker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1")],
    }
    const secondMarker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-2")],
    }
    const onMarkerClick = vi.fn()

    render(
      <MapLibreMapView
        markers={[firstMarker, secondMarker]}
        mode="full"
        onMarkerClick={onMarkerClick}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(mapLibreHarness.clickHandlers.get("memo-markers")).toBeTypeOf("function")
      expect(mapLibreHarness.clickHandlers.get("memo-marker-clusters")).toBeTypeOf("function")
    })

    act(() => {
      void mapLibreHarness.clickHandlers.get("memo-markers")?.({
        features: [{ properties: { markerId: "0" } }],
      })
    })
    expect(onMarkerClick).toHaveBeenLastCalledWith(firstMarker)

    await act(async () => {
      await mapLibreHarness.clickHandlers.get("memo-marker-clusters")?.({
        features: [{ properties: { cluster_id: 12 } }],
      })
    })

    expect(onMarkerClick).toHaveBeenLastCalledWith({
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [firstMarker.items[0], secondMarker.items[0]],
    })
    expect(document.querySelector(".maplibregl-popup")).toBeNull()
  })

  it("空地图保持 MapLibre 渲染，不触发回退", async () => {
    const onUnavailable = vi.fn()

    render(
      <MapLibreMapView
        markers={[]}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={onUnavailable}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.source.setData).toHaveBeenCalledTimes(1))
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it("页面级详情状态更新时复用当前地图实例", async () => {
    const markers: MapMarker[] = [
      {
        name: "上海 · 外滩",
        lat: 31.2401,
        lng: 121.4905,
        items: [createMemo("memo-1")],
      },
    ]
    const { rerender } = render(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.source.setData).toHaveBeenCalledTimes(1))

    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    expect(mapLibreHarness.removeCount).toBe(0)
    expect(mapLibreHarness.constructCount).toBe(1)
  })

  it("初始化异常时请求外层回退", async () => {
    mapLibreHarness.throwOnConstruct = true
    const onUnavailable = vi.fn()

    render(
      <MapLibreMapView
        markers={[]}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={onUnavailable}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1))
  })

  it("默认以平面投影显示，并可切换到地球", async () => {
    const onProjectionChange = vi.fn()

    render(
      <MapLibreMapView
        markers={[]}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={onProjectionChange}
      />
    )

    await waitFor(() => expect(mapLibreHarness.constructCount).toBe(1))

    expect(screen.getByRole("button", { name: "平面" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "地球" }).getAttribute("aria-pressed")).toBe("false")
    expect(
      (mapLibreHarness.options?.style as { projection?: { type?: string } }).projection
    ).toEqual({ type: "mercator" })

    act(() => screen.getByRole("button", { name: "地球" }).click())

    expect(onProjectionChange).toHaveBeenCalledWith("globe")
  })

  it("view=globe 对应地球投影，切换时复用地图和当前镜头", async () => {
    const markers: MapMarker[] = []
    const { rerender } = render(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.constructCount).toBe(1))

    expect(
      (mapLibreHarness.options?.style as { projection?: { type?: string } }).projection
    ).toEqual({ type: "vertical-perspective" })
    expect(mapLibreHarness.setProjection).toHaveBeenCalledWith({
      type: "vertical-perspective",
    })

    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )

    expect(mapLibreHarness.constructCount).toBe(1)
    expect(mapLibreHarness.removeCount).toBe(0)
    expect(mapLibreHarness.setProjection).toHaveBeenCalledWith({ type: "mercator" })
    expect(
      mapLibreHarness.operations.filter((operation) => operation === "fitBounds")
    ).toHaveLength(0)
  })

  it("平面视图不创建自动旋转任务", async () => {
    mapLibreHarness.currentZoom = 2

    renderMap("flat")

    await waitFor(() => expect(mapLibreHarness.constructCount).toBe(1))

    expect(animationHarness.callbacks.size).toBe(0)
    expect(mapLibreHarness.rotateTo).not.toHaveBeenCalled()
  })

  it("地球低缩放视图沿经度自转且保持北向，不重建地图或重写 GeoJSON", async () => {
    mapLibreHarness.currentZoom = 2

    renderMap("globe")

    await waitFor(() => expect(animationHarness.callbacks.size).toBe(1))
    expect(mapLibreHarness.constructCount).toBe(1)
    expect(mapLibreHarness.source.setData).toHaveBeenCalledTimes(1)

    act(() => {
      runNextAnimationFrame(1000)
      runNextAnimationFrame(2000)
    })

    expect(mapLibreHarness.setCenter).toHaveBeenCalledWith([121.7905, 31.2401])
    expect(mapLibreHarness.currentBearing).toBe(0)
    expect(mapLibreHarness.rotateTo).not.toHaveBeenCalled()
    expect(mapLibreHarness.constructCount).toBe(1)
    expect(mapLibreHarness.source.setData).toHaveBeenCalledTimes(1)
  })

  it("直达地球视图时以全球镜头显示地点，并启动自动旋转", async () => {
    containerSizeHarness.width = 1440
    containerSizeHarness.height = 900
    mapLibreHarness.currentZoom = 0.5
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1")],
    }

    render(
      <MapLibreMapView
        markers={[marker]}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.source.setData).toHaveBeenCalledTimes(1))

    expect(mapLibreHarness.options?.zoom).toBeCloseTo(1.96, 2)
    expect(mapLibreHarness.setProjection).toHaveBeenCalledWith({
      type: "vertical-perspective",
    })
    expect(mapLibreHarness.operations).not.toContain("fitBounds")
    expect(animationHarness.callbacks.size).toBe(1)
  })

  it("拖动停止自转后，空闲一段时间自动恢复自转", async () => {
    mapLibreHarness.currentZoom = 2

    renderMap("globe")

    await waitFor(() => expect(animationHarness.callbacks.size).toBe(1))

    act(() => mapLibreHarness.emit("dragstart"))
    expect(animationHarness.callbacks.size).toBe(0)

    // 恢复计时器为真实 5 秒，放宽 waitFor 与测试超时等待其触发。
    await waitFor(() => expect(animationHarness.callbacks.size).toBe(1), { timeout: 6000 })
  }, 8000)

  it("切回平面立即停止旋转，交互后再切回地球不会绕过停止状态", async () => {
    mapLibreHarness.currentZoom = 2
    const markers: MapMarker[] = []
    const { rerender } = render(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(animationHarness.callbacks.size).toBe(1))
    act(() => {
      runNextAnimationFrame(1000)
      runNextAnimationFrame(2000)
    })
    expect(mapLibreHarness.currentCenter.lng).toBeGreaterThan(121.4905)
    expect(mapLibreHarness.currentBearing).toBe(0)

    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )
    expect(animationHarness.callbacks.size).toBe(0)
    expect(mapLibreHarness.currentBearing).toBe(0)

    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(animationHarness.callbacks.size).toBe(1))
    act(() => mapLibreHarness.emit("dragstart"))
    expect(animationHarness.callbacks.size).toBe(0)

    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="flat"
        onProjectionChange={vi.fn()}
      />
    )
    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )
    expect(animationHarness.callbacks.size).toBe(0)
  })

  it.each(["dragstart", "zoomstart", "touchstart", "keydown", "click"])(
    "%s 地图交互会停止自动旋转且不会自行恢复",
    async (event) => {
      mapLibreHarness.currentZoom = 2
      const { rerender } = renderMap("globe")

      await waitFor(() => expect(animationHarness.callbacks.size).toBe(1))
      act(() => mapLibreHarness.emit(event))
      expect(animationHarness.callbacks.size).toBe(0)

      rerender(
        <MapLibreMapView
          markers={[]}
          mode="full"
          onMarkerClick={vi.fn()}
          onUnavailable={vi.fn()}
          projection="globe"
          onProjectionChange={vi.fn()}
        />
      )
      expect(animationHarness.callbacks.size).toBe(0)
    }
  )

  it("减少动态效果偏好时不启动自动旋转", async () => {
    motionHarness.shouldReduceMotion = true
    mapLibreHarness.currentZoom = 2

    renderMap("globe")

    await waitFor(() => expect(mapLibreHarness.constructCount).toBe(1))
    expect(animationHarness.callbacks.size).toBe(0)
    expect(mapLibreHarness.rotateTo).not.toHaveBeenCalled()
  })

  it("主题切换通过 setTiles 换底图，不重建地图", async () => {
    const markers: MapMarker[] = []
    const { rerender } = render(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.constructCount).toBe(1))
    themeHarness.resolvedTheme = "light"

    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.source.setTiles).toHaveBeenCalledTimes(1))
    expect(mapLibreHarness.source.setTiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        "https://a.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}@2x.png",
      ])
    )
    expect(mapLibreHarness.constructCount).toBe(1)
    expect(mapLibreHarness.removeCount).toBe(0)
  })

  it("主题切换后保留镜头与已停止的旋转状态", async () => {
    mapLibreHarness.currentZoom = 2
    const markers: MapMarker[] = []
    const { rerender } = render(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(animationHarness.callbacks.size).toBe(1))
    act(() => mapLibreHarness.emit("zoomstart"))
    expect(animationHarness.callbacks.size).toBe(0)

    themeHarness.resolvedTheme = "light"
    rerender(
      <MapLibreMapView
        markers={markers}
        mode="full"
        onMarkerClick={vi.fn()}
        onUnavailable={vi.fn()}
        projection="globe"
        onProjectionChange={vi.fn()}
      />
    )

    await waitFor(() => expect(mapLibreHarness.source.setTiles).toHaveBeenCalledTimes(1))
    expect(mapLibreHarness.constructCount).toBe(1)
    expect(mapLibreHarness.removeCount).toBe(0)
    expect(animationHarness.callbacks.size).toBe(0)
  })
})
