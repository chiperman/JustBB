import { beforeEach, describe, expect, it, vi } from "vitest"

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("next/cache", () => ({ revalidatePath }))

import { createMemoRecord, updateMemoContentRecord } from "./write"

const OWNER_ID = "00000000-0000-4000-8000-000000000001"
const MEMO_ID = "00000000-0000-4000-8000-000000000002"

type ChainResult = { data: unknown; error: unknown }

/** 构造一个记录调用参数的链式 supabase mock。 */
function createMockClient(handlers: {
  insertResult?: ChainResult
  updateResult?: ChainResult
  selectOneResult?: ChainResult
}) {
  const calls = { insert: [] as unknown[], update: [] as unknown[] }
  const client = {
    from: vi.fn(() => ({
      insert: (payload: unknown) => {
        calls.insert.push(payload)
        return {
          select: () => ({
            single: async () => handlers.insertResult ?? { data: null, error: null },
          }),
        }
      },
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => handlers.selectOneResult ?? { data: null, error: null },
          }),
        }),
      }),
      update: (payload: unknown) => {
        calls.update.push(payload)
        return {
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: async () => handlers.updateResult ?? { data: null, error: null },
              }),
            }),
          }),
        }
      },
    })),
  }
  return { client, calls }
}

const createdRow = { id: MEMO_ID, owner_id: OWNER_ID, memo_number: 42 }

describe("createMemoRecord", () => {
  beforeEach(() => vi.clearAllMocks())

  it("构建派生字段并失效首页与画廊", async () => {
    const { client, calls } = createMockClient({ insertResult: { data: createdRow, error: null } })

    const result = await createMemoRecord(client as never, OWNER_ID, {
      content: "今天去了外滩 #旅行",
      isPrivate: false,
      isPinned: true,
    })

    expect(result.success).toBe(true)
    const payload = calls.insert[0] as Record<string, unknown>
    expect(payload.owner_id).toBe(OWNER_ID)
    expect(payload.tags).toEqual(["旅行"])
    expect(payload.is_pinned).toBe(true)
    expect(payload.pinned_at).toBeTruthy()
    expect(payload.word_count).toBeGreaterThan(0)
    expect(revalidatePath).toHaveBeenCalledWith("/")
    expect(revalidatePath).toHaveBeenCalledWith("/gallery")
  })

  it("图片元数据只保留最终图片清单内的条目", async () => {
    const { client, calls } = createMockClient({ insertResult: { data: createdRow, error: null } })

    await createMemoRecord(client as never, OWNER_ID, {
      content: "图文",
      images: ["https://example.com/a.png"],
      imageMetadata: {
        "https://example.com/a.png": { width: 100, height: 80 },
        "https://example.com/stale.png": { width: 1, height: 1 },
      },
      isPrivate: false,
      isPinned: false,
    })

    const payload = calls.insert[0] as Record<string, unknown>
    expect(payload.image_metadata).toEqual({
      "https://example.com/a.png": { width: 100, height: 80 },
    })
  })

  it("私密 Memo 缺少口令时拒绝创建", async () => {
    const { client, calls } = createMockClient({})

    const result = await createMemoRecord(client as never, OWNER_ID, {
      content: "秘密",
      isPrivate: true,
      isPinned: false,
    })

    expect(result).toEqual({ success: false, reason: "private_requires_code" })
    expect(calls.insert).toHaveLength(0)
  })

  it("私密 Memo 的口令只存哈希", async () => {
    const { client, calls } = createMockClient({ insertResult: { data: createdRow, error: null } })

    await createMemoRecord(client as never, OWNER_ID, {
      content: "秘密",
      isPrivate: true,
      isPinned: false,
      accessCode: "my-secret-code",
      accessCodeHint: "提示",
    })

    const payload = calls.insert[0] as Record<string, unknown>
    expect(payload.access_code_hash).toBeTruthy()
    expect(payload.access_code_hash).not.toBe("my-secret-code")
    expect(payload.access_code_hint).toBe("提示")
  })

  it("正文与图片都为空时拒绝创建", async () => {
    const { client } = createMockClient({})

    const result = await createMemoRecord(client as never, OWNER_ID, {
      content: "   ",
      isPrivate: false,
      isPinned: false,
    })

    expect(result).toEqual({ success: false, reason: "empty_content" })
  })

  it("数据库错误透传给调用方", async () => {
    const dbError = { code: "XX000", message: "boom" }
    const { client } = createMockClient({ insertResult: { data: null, error: dbError } })

    const result = await createMemoRecord(client as never, OWNER_ID, {
      content: "正文",
      isPrivate: false,
      isPinned: false,
    })

    expect(result).toEqual({ success: false, reason: "db", dbError })
  })
})

describe("updateMemoContentRecord", () => {
  const existing = {
    id: MEMO_ID,
    images: ["https://example.com/a.png"],
    image_metadata: { "https://example.com/a.png": { width: 100, height: 80 } },
  }

  beforeEach(() => vi.clearAllMocks())

  it("调用方未提供元数据时保留服务端已有元数据", async () => {
    const { client, calls } = createMockClient({
      selectOneResult: { data: existing, error: null },
      updateResult: { data: createdRow, error: null },
    })

    const result = await updateMemoContentRecord(client as never, OWNER_ID, {
      id: MEMO_ID,
      content: "新正文",
      images: ["https://example.com/a.png"],
    })

    expect(result.success).toBe(true)
    const payload = calls.update[0] as Record<string, unknown>
    expect(payload.image_metadata).toEqual({
      "https://example.com/a.png": { width: 100, height: 80 },
    })
  })

  it("调用方提供的元数据优先于已有元数据", async () => {
    const { client, calls } = createMockClient({
      selectOneResult: { data: existing, error: null },
      updateResult: { data: createdRow, error: null },
    })

    await updateMemoContentRecord(client as never, OWNER_ID, {
      id: MEMO_ID,
      content: "新正文",
      images: ["https://example.com/a.png"],
      imageMetadata: { "https://example.com/a.png": { width: 200, height: 160 } },
    })

    const payload = calls.update[0] as Record<string, unknown>
    expect(payload.image_metadata).toEqual({
      "https://example.com/a.png": { width: 200, height: 160 },
    })
  })

  it("未重传图片时沿用现有图片参与正文解析", async () => {
    const { client, calls } = createMockClient({
      selectOneResult: { data: existing, error: null },
      updateResult: { data: createdRow, error: null },
    })

    await updateMemoContentRecord(client as never, OWNER_ID, {
      id: MEMO_ID,
      content: "只有正文没有图片链接",
    })

    const payload = calls.update[0] as Record<string, unknown>
    expect(payload.images).toEqual(["https://example.com/a.png"])
  })

  it("找不到记录时返回 not_found", async () => {
    const { client, calls } = createMockClient({
      selectOneResult: { data: null, error: null },
    })

    const result = await updateMemoContentRecord(client as never, OWNER_ID, {
      id: MEMO_ID,
      content: "新正文",
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.reason).toBe("not_found")
    expect(calls.update).toHaveLength(0)
  })

  it("content 与 images 都未提供时返回 nothing_to_update", async () => {
    const { client } = createMockClient({})

    const result = await updateMemoContentRecord(client as never, OWNER_ID, { id: MEMO_ID })

    expect(result).toEqual({ success: false, reason: "nothing_to_update" })
  })
})
