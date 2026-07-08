import { describe, expect, it, beforeEach, vi } from "vitest"
import type { Memo } from "@/types/memo"

vi.mock("@/server/actions/memos/query", () => ({
  getMemoById: vi.fn(),
}))

vi.mock("@/features/memos/components/MemoContent", () => ({
  MemoContent: ({ content }: { content: string }) => <div>{content}</div>,
}))

vi.mock("@/shared/lib/share", () => ({
  getPublicAppUrl: () => "https://memo.example.com",
}))

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

import MemoSharePage, { generateMetadata } from "./page"
import { getMemoById } from "@/server/actions/memos/query"

const memoId = "9b0f1e24-76d8-4ef9-a889-81e7e3b0d1b2"

const createMemo = (overrides: Partial<Memo> = {}) =>
  ({
    id: memoId,
    memo_number: 12,
    owner_id: "owner-1",
    content: "公开 Memo 内容",
    tags: ["公开"],
    is_private: false,
    is_locked: false,
    is_owner: false,
    is_pinned: false,
    pinned_at: null,
    created_at: "2026-07-08T00:00:00.000Z",
    updated_at: "2026-07-08T00:00:00.000Z",
    deleted_at: null,
    word_count: 8,
    locations: [],
    images: [],
    image_metadata: {},
    ...overrides,
  }) as Memo

describe("MemoSharePage metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("非法 UUID 不查询数据库并返回 noindex metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "not-a-real-id" }),
    })

    expect(getMemoById).not.toHaveBeenCalled()
    expect(metadata.title).toBe("分享内容不可用")
    expect(metadata.robots).toMatchObject({ index: false, follow: false })
  })

  it("私密 Memo 不生成可索引分享 metadata", async () => {
    vi.mocked(getMemoById).mockResolvedValue({
      success: true,
      error: null,
      data: createMemo({ is_private: true, is_owner: true }),
    })

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: memoId }),
    })

    expect(metadata.title).toBe("分享内容不可用")
    expect(metadata.robots).toMatchObject({ index: false, follow: false })
  })

  it("公开 Memo 生成 canonical 和可索引 metadata", async () => {
    vi.mocked(getMemoById).mockResolvedValue({
      success: true,
      error: null,
      data: createMemo(),
    })

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: memoId }),
    })

    expect(metadata.title).toBe("JustMemo 分享 #12")
    expect(metadata.alternates).toEqual({
      canonical: `https://memo.example.com/share/${memoId}`,
    })
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
  })
})

describe("MemoSharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("非法 UUID 直接返回 404", async () => {
    await expect(
      MemoSharePage({ params: Promise.resolve({ id: "not-a-real-id" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(getMemoById).not.toHaveBeenCalled()
  })

  it("私密 Memo 直接返回 404", async () => {
    vi.mocked(getMemoById).mockResolvedValue({
      success: true,
      error: null,
      data: createMemo({ is_private: true, is_owner: true }),
    })

    await expect(MemoSharePage({ params: Promise.resolve({ id: memoId }) })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
  })
})
