// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"

vi.mock("next/navigation", () => ({
  usePathname: () => "/map",
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
  MapLibreMapView: ({ onUnavailable }: { onUnavailable: () => void }) => (
    <button type="button" data-testid="maplibre-map" onClick={onUnavailable}>
      触发回退
    </button>
  ),
}))

import { MapView } from "./MapView"

describe("MapView 全页渲染器", () => {
  it("默认使用 MapLibre 平面地图", () => {
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [],
    }

    render(<MapView markers={[marker]} mode="full" onMarkerClick={vi.fn()} />)

    expect(screen.getByTestId("maplibre-map")).toBeTruthy()
  })

  it("MapLibre 不可用时自动回退 Leaflet，且不重新请求地图数据", async () => {
    render(<MapView markers={[]} mode="full" onMarkerClick={vi.fn()} />)

    fireEvent.click(screen.getByTestId("maplibre-map"))

    await waitFor(() => {
      expect(screen.queryByTestId("maplibre-map")).toBeNull()
      expect(document.querySelector(".map-view--full")).toBeTruthy()
    })
  })
})
