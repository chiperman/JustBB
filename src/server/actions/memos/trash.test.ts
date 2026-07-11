import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  batchTrashAction,
  deleteMemo,
  emptyTrash,
  getTrashMemos,
  permanentDeleteMemo,
  restoreMemo,
} from "./trash"

const MEMO_ID = "11111111-1111-1111-1111-111111111111"

const { getClient, getCurrentUserId, isAdmin } = vi.hoisted(() => ({
  getClient: vi.fn(),
  getCurrentUserId: vi.fn(),
  isAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  getClient,
}))

vi.mock("@/features/auth/actions", () => ({
  getCurrentUserId,
  isAdmin,
}))

describe("trash actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAdmin.mockResolvedValue(false)
    getCurrentUserId.mockResolvedValue("user-1")
  })

  it.each([
    ["deleteMemo", () => deleteMemo(MEMO_ID)],
    ["restoreMemo", () => restoreMemo(MEMO_ID)],
    ["permanentDeleteMemo", () => permanentDeleteMemo(MEMO_ID)],
    ["emptyTrash", () => emptyTrash()],
    ["getTrashMemos", () => getTrashMemos()],
    ["batchTrashAction", () => batchTrashAction([MEMO_ID], "delete")],
  ])("普通账号调用 %s 时应被拒绝", async (_name, action) => {
    const result = await action()

    expect(result).toMatchObject({
      success: false,
      error: "权限不足，仅操作者可操作回收站",
    })
    if (_name === "getTrashMemos") {
      expect(result).toMatchObject({ data: [] })
    }
    expect(getClient).not.toHaveBeenCalled()
    expect(getCurrentUserId).not.toHaveBeenCalled()
  })
})
