// @vitest-environment jsdom

import type { ComponentType } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"
import type { Memo } from "@/types/memo"

vi.mock("./hooks/useMapMemos", () => ({
  useMapMemos: vi.fn(),
}))

vi.mock("@/shared/hooks/useDelayedLoadingVisibility", () => ({
  useDelayedLoadingVisibility: () => false,
}))

vi.mock("@/shared/layout/ContextPageShell", () => ({
  ContextPageShell: ({
    header,
    children,
  }: {
    header: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      {header}
      {children}
    </div>
  ),
  ContextPageHeader: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}))

vi.mock("@/features/memos", () => ({
  MemoCard: ({ memo }: { memo: Memo }) => <article>{memo.content}</article>,
}))

import { useMapMemos } from "./hooks/useMapMemos"
import { MapPageContent } from "./index"

function createMemo(): Memo {
  return {
    id: "00000000-0000-4000-8000-000000000025",
    memo_number: 25,
    owner_id: "owner-1",
    content: "公开的地图记录",
    tags: ["地图"],
    access_code_hint: null,
    created_at: "2026-07-24T00:00:00.000Z",
    updated_at: "2026-07-24T00:00:00.000Z",
    deleted_at: null,
    pinned_at: null,
    is_pinned: false,
    is_private: false,
    word_count: 8,
    locations: [],
    images: [],
    image_metadata: {},
    is_owner: true,
    is_locked: false,
  }
}

const marker: MapMarker = {
  name: "上海 · 外滩",
  lat: 31.2401,
  lng: 121.4905,
  items: [createMemo()],
}

describe("MapPageContent 地点详情", () => {
  beforeEach(() => {
    const FakeMapView = ({
      onMarkerClick,
    }: {
      onMarkerClick?: (nextMarker: MapMarker) => void
    }) => (
      <button type="button" onClick={() => onMarkerClick?.(marker)}>
        打开坐标
      </button>
    )

    vi.mocked(useMapMemos).mockReturnValue({
      markers: [marker],
      isLoading: false,
      MapView: FakeMapView as ComponentType<{
        markers: MapMarker[]
        mode: "mini" | "full"
        className?: string
        onMarkerClick?: (nextMarker: MapMarker) => void
      }>,
    })
  })

  it("点击坐标打开详情面板，关闭后仍可再次打开", async () => {
    render(<MapPageContent />)

    fireEvent.click(screen.getByRole("button", { name: "打开坐标" }))
    expect(screen.getByRole("heading", { name: "上海 · 外滩" })).toBeTruthy()
    expect(screen.getByText("1 条记录")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "关闭地点详情" }))
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "上海 · 外滩" })).toBeNull()
    })

    fireEvent.click(screen.getByRole("button", { name: "打开坐标" }))
    expect(screen.getByRole("heading", { name: "上海 · 外滩" })).toBeTruthy()
  })
})
