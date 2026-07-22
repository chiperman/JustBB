// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { dispatchMemoEvent } from "@/lib/memos/events"
import { PageDataCacheProvider } from "@/state/PageDataCache"
import type { Memo } from "@/types/memo"

import { removeMemoFromTrash, useTrashMemos } from "./useTrashMemos"

vi.mock("@/server/actions/memos/trash", () => ({
  getTrashMemos: vi.fn(async () => ({
    success: true,
    error: null,
    data: [createMemo("memo-1"), createMemo("memo-2")],
  })),
  emptyTrash: vi.fn(),
}))

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({ user: { id: "user-1" } }),
}))

function createMemo(id: string): Memo {
  return {
    id,
    content: id,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    is_pinned: false,
    is_private: false,
    memo_number: Number(id.replace(/\D/g, "")) || 0,
    owner_id: "user-1",
    tags: [],
    access_code_hint: null,
    pinned_at: null,
    deleted_at: "2026-01-02T00:00:00.000Z",
    word_count: 1,
    locations: [],
  }
}

function TrashProbe() {
  const { memos } = useTrashMemos()

  return <div data-testid="trash-ids">{memos.map((memo) => memo.id).join(",")}</div>
}

describe("removeMemoFromTrash", () => {
  it("从回收站列表移除指定记录", () => {
    expect(removeMemoFromTrash([createMemo("memo-1"), createMemo("memo-2")], "memo-1")).toEqual([
      createMemo("memo-2"),
    ])
  })
})

describe("useTrashMemos", () => {
  it("收到全局删除事件后移除当前回收站记录", async () => {
    render(
      <PageDataCacheProvider>
        <TrashProbe />
      </PageDataCacheProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("trash-ids").textContent).toBe("memo-1,memo-2")
    })

    act(() => {
      dispatchMemoEvent({ type: "delete", id: "memo-1" })
    })

    await waitFor(() => {
      expect(screen.getByTestId("trash-ids").textContent).toBe("memo-2")
    })
  })
})
