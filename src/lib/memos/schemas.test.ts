import { describe, it, expect } from "vitest"
import { batchAddTagsSchema, createMemoSchema } from "./schemas"

describe("createMemoSchema", () => {
  it("空正文且没有图片时应该校验失败", () => {
    const result = createMemoSchema.safeParse({
      content: "",
      images: "[]",
    })

    expect(result.success).toBe(false)
  })

  it("空正文但有图片时应该允许保存", () => {
    const result = createMemoSchema.safeParse({
      content: "",
      images: JSON.stringify(["https://example.com/photo.jpg"]),
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.images).toEqual(["https://example.com/photo.jpg"])
    }
  })
})

describe("batchAddTagsSchema", () => {
  const validUuid1 = "12345678-1234-1234-1234-123456789012"
  const validUuid2 = "87654321-4321-4321-4321-210987654321"

  it("应该通过标准的数组输入校验", () => {
    const data = {
      ids: [validUuid1, validUuid2],
      tags: ["tag1", "tag2"],
    }
    const result = batchAddTagsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ids).toEqual([validUuid1, validUuid2])
      expect(result.data.tags).toEqual(["tag1", "tag2"])
    }
  })

  it("应该通过逗号分割的字符串输入校验", () => {
    const data = {
      ids: `${validUuid1},${validUuid2}`,
      tags: "tag1, tag2",
    }
    const result = batchAddTagsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ids).toEqual([validUuid1, validUuid2])
      expect(result.data.tags).toEqual(["tag1", "tag2"])
    }
  })

  it("应该通过 JSON 数组字符串的输入校验", () => {
    const data = {
      ids: JSON.stringify([validUuid1, validUuid2]),
      tags: JSON.stringify(["tag1", "tag2"]),
    }
    const result = batchAddTagsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ids).toEqual([validUuid1, validUuid2])
      expect(result.data.tags).toEqual(["tag1", "tag2"])
    }
  })

  it("应该通过 removeTags 输入校验", () => {
    const data = {
      ids: validUuid1,
      tags: "tag1",
      removeTags: "tag2, tag3",
    }
    const result = batchAddTagsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.removeTags).toEqual(["tag2", "tag3"])
    }
  })

  it("为空或无效输入时应该校验失败", () => {
    // ids 为空
    const res1 = batchAddTagsSchema.safeParse({
      ids: "",
      tags: "tag1",
    })
    expect(res1.success).toBe(false)

    // tags 为空，但有有效 ids，此时校验应成功且数据默认值正确
    const res2 = batchAddTagsSchema.safeParse({
      ids: validUuid1,
      tags: "",
    })
    expect(res2.success).toBe(true)
    if (res2.success) {
      expect(res2.data.tags).toEqual([])
      expect(res2.data.removeTags).toEqual([])
    }

    // 无效的 UUID
    const res3 = batchAddTagsSchema.safeParse({
      ids: "invalid-uuid",
      tags: "tag1",
    })
    expect(res3.success).toBe(false)
  })
})
