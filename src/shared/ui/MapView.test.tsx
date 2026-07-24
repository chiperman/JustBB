// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"
import type { Memo } from "@/types/memo"

interface FakeMarkerOptions {
  memos?: Memo[]
  locationName?: string
}

interface FakeLeafletMarker {
  options: FakeMarkerOptions
  on: (event: string, handler: unknown) => FakeLeafletMarker
  addTo: (layer: unknown) => FakeLeafletMarker
  bindPopup: (content: unknown, options: unknown) => FakeLeafletMarker
}

interface MarkerRecord {
  options: FakeMarkerOptions
  click?: () => void
  instance: FakeLeafletMarker
}

interface FakeCluster {
  getBounds: () => {
    getNorthEast: () => { equals: (other: unknown, tolerance: number) => boolean }
    getSouthWest: () => unknown
  }
  getLatLng: () => { lat: number; lng: number }
  getAllChildMarkers: () => FakeLeafletMarker[]
}

interface ClusterClickEvent {
  layer: FakeCluster
}

const leafletHarness = vi.hoisted(() => ({
  markerRecords: [] as MarkerRecord[],
  clusterClick: undefined as ((event: ClusterClickEvent) => void) | undefined,
  operations: [] as string[],
  popupBindings: [] as unknown[],
}))

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

vi.mock("leaflet", () => {
  const fakeLeaflet = {
    map: (container: HTMLElement) => {
      const map = {
        getContainer: () => container,
        on: () => map,
        off: () => map,
        remove: () => undefined,
        getZoom: () => 18,
        getMinZoom: () => 0,
        setMinZoom: () => map,
        setZoom: () => map,
        invalidateSize: () => map,
        closePopup: () => map,
        fitBounds: () => {
          leafletHarness.operations.push("fitBounds")
          return map
        },
        flyToBounds: () => map,
        setView: () => map,
        zoomIn: () => map,
        zoomOut: () => map,
      }
      return map
    },
    tileLayer: () => ({
      addTo: () => undefined,
    }),
    markerClusterGroup: () => {
      const group = {
        on: (event: string, handler: unknown) => {
          if (event === "clusterclick") {
            leafletHarness.clusterClick = handler as (event: ClusterClickEvent) => void
          }
          return group
        },
        addTo: () => group,
        clearLayers: () => undefined,
      }
      return group
    },
    layerGroup: () => {
      const group = {
        addTo: () => group,
        clearLayers: () => undefined,
      }
      return group
    },
    marker: (_position: unknown, options: FakeMarkerOptions) => {
      leafletHarness.operations.push("marker")
      const record = {
        options,
      } as MarkerRecord
      const marker = {
        options,
        on: (event: string, handler: unknown) => {
          if (event === "click") {
            record.click = handler as () => void
          }
          return marker
        },
        addTo: () => marker,
        bindPopup: (content: unknown) => {
          leafletHarness.popupBindings.push(content)
          return marker
        },
      }
      record.instance = marker
      leafletHarness.markerRecords.push(record)
      return marker
    },
    divIcon: (options: unknown) => options,
    latLngBounds: () => ({}),
  }

  return { default: fakeLeaflet }
})

import { LeafletMapView } from "./MapView"

function createMemo(id: string): Memo {
  return {
    id,
    memo_number: Number(id.slice(-1)),
    owner_id: "owner-1",
    content: `memo-${id}`,
    tags: [],
    access_code_hint: null,
    created_at: "2026-07-24T00:00:00.000Z",
    updated_at: "2026-07-24T00:00:00.000Z",
    deleted_at: null,
    pinned_at: null,
    is_pinned: false,
    is_private: false,
    word_count: 1,
    locations: [],
    images: [],
    image_metadata: {},
    is_owner: true,
    is_locked: false,
  }
}

beforeEach(() => {
  leafletHarness.markerRecords.length = 0
  leafletHarness.clusterClick = undefined
  leafletHarness.operations.length = 0
  leafletHarness.popupBindings.length = 0
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("LeafletMapView 降级路径", () => {
  it("首次加载先定位地图，再显示标记", async () => {
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1")],
    }

    render(<LeafletMapView markers={[marker]} mode="full" onMarkerClick={vi.fn()} />)

    await waitFor(() => expect(leafletHarness.markerRecords).toHaveLength(1))

    expect(leafletHarness.operations.indexOf("fitBounds")).toBeLessThan(
      leafletHarness.operations.indexOf("marker")
    )
  })

  it("点击普通坐标时把完整 marker 交给详情区域", async () => {
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1")],
    }
    const onMarkerClick = vi.fn()

    render(<LeafletMapView markers={[marker]} mode="full" onMarkerClick={onMarkerClick} />)

    await waitFor(() => {
      expect(leafletHarness.markerRecords).toHaveLength(1)
      expect(leafletHarness.markerRecords[0].click).toBeTypeOf("function")
    })

    act(() => leafletHarness.markerRecords[0].click?.())

    expect(onMarkerClick).toHaveBeenCalledWith(marker)
  })

  it("点击重合聚合坐标时把聚合 Memo 交给详情区域", async () => {
    const firstMarker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1")],
    }
    const secondMarker: MapMarker = {
      ...firstMarker,
      items: [createMemo("memo-2")],
    }
    const onMarkerClick = vi.fn()

    render(
      <LeafletMapView
        markers={[firstMarker, secondMarker]}
        mode="full"
        onMarkerClick={onMarkerClick}
      />
    )

    await waitFor(() => {
      expect(leafletHarness.markerRecords).toHaveLength(2)
      expect(leafletHarness.clusterClick).toBeTypeOf("function")
    })

    const cluster: FakeCluster = {
      getBounds: () => ({
        getNorthEast: () => ({ equals: () => true }),
        getSouthWest: () => ({}),
      }),
      getLatLng: () => ({ lat: 31.2401, lng: 121.4905 }),
      getAllChildMarkers: () => leafletHarness.markerRecords.map((record) => record.instance),
    }

    act(() => leafletHarness.clusterClick?.({ layer: cluster }))

    expect(onMarkerClick).toHaveBeenCalledWith({
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [firstMarker.items[0], secondMarker.items[0]],
    })
  })

  it("全页降级路径不创建 Popup", async () => {
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createMemo("memo-1")],
    }

    render(<LeafletMapView markers={[marker]} mode="full" />)

    await waitFor(() => expect(leafletHarness.markerRecords).toHaveLength(1))

    expect(leafletHarness.popupBindings).toHaveLength(0)
  })
})
