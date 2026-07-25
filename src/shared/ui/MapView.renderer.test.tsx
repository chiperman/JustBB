// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"

const navigation = vi.hoisted(() => ({
  pathname: "/map",
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
  push: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({
    replace: navigation.replace,
    push: navigation.push,
  }),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}))

vi.mock("@/state/UIContext", () => ({
  UIProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/state/UnlockedMemosContext", () => ({
  UnlockedMemosProvider: ({ children }: { children: React.ReactNode }) => children,
  useOptionalUnlockedMemos: () => null,
}))

vi.mock("./map/MapMemoPopupContent", () => ({
  MapMemoPopupContent: () => null,
}))

vi.mock("leaflet.markercluster", () => ({}))

vi.mock("leaflet", () => ({
  default: {
    map: () => ({
      getContainer: () => document.createElement("div"),
      on: () => undefined,
      off: () => undefined,
      remove: () => undefined,
      getZoom: () => 2,
      getMinZoom: () => 0,
      setMinZoom: () => undefined,
      setZoom: () => undefined,
      invalidateSize: () => undefined,
    }),
    tileLayer: () => ({ addTo: () => undefined }),
    markerClusterGroup: () => ({
      on: () => undefined,
      addTo: () => undefined,
      clearLayers: () => undefined,
    }),
    layerGroup: () => ({ addTo: () => undefined, clearLayers: () => undefined }),
  },
}))

vi.mock("./map/MapLibreMapView", () => ({
  MapLibreMapView: ({
    onUnavailable,
    projection,
    onProjectionChange,
  }: {
    onUnavailable: () => void
    projection: "flat" | "globe"
    onProjectionChange: (projection: "flat" | "globe") => void
  }) => (
    <>
      <button type="button" data-testid="maplibre-map" onClick={onUnavailable}>
        触发回退
      </button>
      <button
        type="button"
        data-testid="switch-to-globe"
        aria-pressed={projection === "globe"}
        onClick={() => onProjectionChange("globe")}
      >
        地球
      </button>
    </>
  ),
}))

import { MapView } from "./MapView"

describe("MapView 全页渲染器", () => {
  beforeEach(() => {
    navigation.searchParams = new URLSearchParams()
    navigation.replace.mockReset()
    navigation.push.mockReset()
  })

  it("默认使用 MapLibre 平面地图", () => {
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [],
    }

    render(<MapView markers={[marker]} mode="full" onMarkerClick={vi.fn()} />)

    expect(screen.getByTestId("maplibre-map")).toBeTruthy()
    expect(screen.getByTestId("switch-to-globe").getAttribute("aria-pressed")).toBe("false")
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  it("view=globe 首次加载地球，未知 view 仍按平面处理", () => {
    navigation.searchParams = new URLSearchParams("view=globe")
    const { rerender } = render(<MapView markers={[]} mode="full" onMarkerClick={vi.fn()} />)

    expect(screen.getByTestId("switch-to-globe").getAttribute("aria-pressed")).toBe("true")

    navigation.searchParams = new URLSearchParams("view=unknown")
    rerender(<MapView markers={[]} mode="full" onMarkerClick={vi.fn()} />)

    expect(screen.getByTestId("switch-to-globe").getAttribute("aria-pressed")).toBe("false")
  })

  it("切换地球视图时 replace URL，保留已有参数且不 push", () => {
    navigation.searchParams = new URLSearchParams("tag=旅行")

    render(<MapView markers={[]} mode="full" onMarkerClick={vi.fn()} />)

    fireEvent.click(screen.getByTestId("switch-to-globe"))

    expect(navigation.replace).toHaveBeenCalledWith("/map?tag=%E6%97%85%E8%A1%8C&view=globe")
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it("MapLibre 不可用时自动回退 Leaflet，且不重新请求地图数据", async () => {
    navigation.searchParams = new URLSearchParams("view=globe&tag=旅行")

    render(<MapView markers={[]} mode="full" onMarkerClick={vi.fn()} />)

    fireEvent.click(screen.getByTestId("maplibre-map"))

    await waitFor(() => {
      expect(screen.queryByTestId("maplibre-map")).toBeNull()
      expect(screen.queryByTestId("switch-to-globe")).toBeNull()
      expect(document.querySelector(".map-view--full")).toBeTruthy()
    })

    expect(navigation.replace).toHaveBeenCalledWith("/map?tag=%E6%97%85%E8%A1%8C")
    expect(navigation.push).not.toHaveBeenCalled()
  })
})
