// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"
import type { Memo } from "@/types/memo"

interface MapEvent {
  features?: Array<{ properties?: Record<string, unknown> }>
}

const mapLibreHarness = vi.hoisted(() => {
  const clickHandlers = new Map<string, (event: MapEvent) => void | Promise<void>>()
  const operations: string[] = []
  const source = {
    setData: vi.fn((data: unknown) => {
      operations.push("setData")
      return data
    }),
    getClusterLeaves: vi.fn(async () => [
      { properties: { markerId: "0" } },
      { properties: { markerId: "1" } },
    ]),
  }

  return {
    clickHandlers,
    operations,
    source,
    sourceOptions: undefined as Record<string, unknown> | undefined,
    options: undefined as Record<string, unknown> | undefined,
    constructCount: 0,
    removeCount: 0,
    setProjection: vi.fn(),
    throwOnConstruct: false,
  }
})

const themeHarness = vi.hoisted(() => ({
  resolvedTheme: "dark" as "dark" | "light",
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: themeHarness.resolvedTheme }),
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
      return { lng: 121.4905, lat: 31.2401 }
    }

    getZoom() {
      return 9
    }

    on(
      event: string,
      layerOrHandler: string | (() => void),
      maybeHandler?: (event: MapEvent) => void
    ) {
      if (typeof layerOrHandler === "string" && maybeHandler && event === "click") {
        mapLibreHarness.clickHandlers.set(layerOrHandler, maybeHandler)
      }
    }

    getCanvas() {
      return { style: {} }
    }

    remove() {
      mapLibreHarness.removeCount += 1
    }
  },
}))

import { MapLibreMapView } from "./MapLibreMapView"

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
  mapLibreHarness.operations.length = 0
  mapLibreHarness.source.setData.mockClear()
  mapLibreHarness.source.getClusterLeaves.mockClear()
  mapLibreHarness.options = undefined
  mapLibreHarness.sourceOptions = undefined
  mapLibreHarness.constructCount = 0
  mapLibreHarness.removeCount = 0
  mapLibreHarness.setProjection.mockClear()
  mapLibreHarness.throwOnConstruct = false
  themeHarness.resolvedTheme = "dark"
  vi.stubGlobal("WebGLRenderingContext", class WebGLRenderingContext {})
})

afterEach(() => {
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
    ).toContain("https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png")
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
    ).toEqual({ type: "globe" })

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

  it("主题切换重建底图时恢复当前镜头和投影", async () => {
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

    await waitFor(() => expect(mapLibreHarness.constructCount).toBe(2))
    expect(mapLibreHarness.options?.center).toEqual([121.4905, 31.2401])
    expect(mapLibreHarness.options?.zoom).toBe(9)
    expect(
      (mapLibreHarness.options?.style as { projection?: { type?: string } }).projection
    ).toEqual({ type: "globe" })
  })
})
