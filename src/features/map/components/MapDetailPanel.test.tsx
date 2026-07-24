// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { MapMarker } from "@/shared/lib/location-cache"
import { UnlockedMemosProvider } from "@/state/UnlockedMemosContext"
import type { Memo } from "@/types/memo"

vi.mock("@/features/memos", () => ({
  MemoCard: ({ memo }: { memo: Memo }) => (
    <article>
      <span>{memo.content}</span>
      <span>{memo.tags.join(",")}</span>
      <span>{memo.images.join(",")}</span>
      <span>{JSON.stringify(memo.image_metadata)}</span>
      <span>{memo.word_count}</span>
    </article>
  ),
}))

import { MapDetailPanel } from "./MapDetailPanel"

function createLockedMemo(): Memo {
  return {
    id: "00000000-0000-4000-8000-000000000025",
    memo_number: 25,
    owner_id: "owner-1",
    content: "不应泄露的锁定正文",
    tags: ["不应泄露的标签"],
    access_code_hint: "四位数字",
    created_at: "2026-07-24T00:00:00.000Z",
    updated_at: "2026-07-24T00:00:00.000Z",
    deleted_at: null,
    pinned_at: null,
    is_pinned: false,
    is_private: true,
    word_count: 42,
    locations: [],
    images: ["https://example.com/secret-image.jpg"],
    image_metadata: {
      "https://example.com/secret-image.jpg": {
        width: 100,
        height: 100,
      },
    },
    is_owner: false,
    is_locked: true,
  }
}

describe("MapDetailPanel", () => {
  it("同一页面已解锁的 Memo 重新打开地点详情时保持可读", () => {
    const lockedMemo = createLockedMemo()
    const unlockedMemo: Memo = {
      ...lockedMemo,
      content: "已解锁的完整正文",
      tags: ["已解锁标签"],
      images: ["https://example.com/unlocked-image.jpg"],
      image_metadata: {
        "https://example.com/unlocked-image.jpg": {
          width: 100,
          height: 100,
        },
      },
      word_count: 24,
      is_locked: false,
    }
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [lockedMemo],
    }

    render(
      <UnlockedMemosProvider initialUnlockedMemos={{ [unlockedMemo.id]: unlockedMemo }}>
        <MapDetailPanel marker={marker} onClose={vi.fn()} />
      </UnlockedMemosProvider>
    )

    expect(screen.getByText("已解锁的完整正文")).toBeTruthy()
    expect(screen.getByText("已解锁标签")).toBeTruthy()
    expect(screen.getByText("https://example.com/unlocked-image.jpg")).toBeTruthy()
    expect(screen.getByText("24")).toBeTruthy()
  })

  it("锁定 Memo 不向卡片传递正文、标签、图片或字数", () => {
    const marker: MapMarker = {
      name: "上海 · 外滩",
      lat: 31.2401,
      lng: 121.4905,
      items: [createLockedMemo()],
    }

    render(<MapDetailPanel marker={marker} onClose={vi.fn()} />)

    expect(screen.queryByText("不应泄露的锁定正文")).toBeNull()
    expect(screen.queryByText("不应泄露的标签")).toBeNull()
    expect(screen.queryByText("https://example.com/secret-image.jpg")).toBeNull()
    expect(screen.queryByText("42")).toBeNull()
  })
})
