import { describe, expect, it } from "vitest"
import { memoFilterHref, readMemoFilterValues, updateMemoFilterParams } from "./memo-filter-params"

describe("memo filter params", () => {
  it("规范化并去重多值筛选", () => {
    const params = new URLSearchParams("tag=%20旅行%20,%E7%94%9F%E6%B4%BB,%E6%97%85%E8%A1%8C")
    expect(readMemoFilterValues(params, "tag")).toEqual(["旅行", "生活"])
  })

  it("切换 tag 时保留其他 URL 状态，空集合时删除参数", () => {
    const added = updateMemoFilterParams(new URLSearchParams("year=2026"), {
      type: "toggle-value",
      key: "tag",
      value: "旅行",
    })
    expect(added.toString()).toBe("year=2026&tag=%E6%97%85%E8%A1%8C")

    const removed = updateMemoFilterParams(added, {
      type: "toggle-value",
      key: "tag",
      value: "旅行",
    })
    expect(removed.toString()).toBe("year=2026")
  })

  it("删除年月 chip 时同时删除 year 与 month", () => {
    const result = updateMemoFilterParams(new URLSearchParams("year=2026&month=07&sort=oldest"), {
      type: "remove-chip",
      chip: { type: "year-month", value: "2026-07" },
    })
    expect(result.toString()).toBe("sort=oldest")
  })

  it("解析搜索 token 并合并 tag 与编号", () => {
    const result = updateMemoFilterParams(new URLSearchParams("tag=%E7%94%9F%E6%B4%BB"), {
      type: "apply-search",
      term: "上海 tag:旅行 n:123 tag:生活",
    })
    expect(result.get("query")).toBe("上海")
    expect(result.get("tag")).toBe("生活,旅行")
    expect(result.get("num")).toBe("123")
  })

  it("清空上下文筛选但保留正文查询和排序", () => {
    const result = updateMemoFilterParams(
      new URLSearchParams("query=上海&tag=旅行&num=123&year=2026&month=07&tagMode=or&sort=oldest"),
      { type: "clear-context" }
    )
    expect(result.toString()).toBe("query=%E4%B8%8A%E6%B5%B7&sort=oldest")
  })

  it("AND 模式不写入 URL，空参数生成根路径", () => {
    const orParams = updateMemoFilterParams(new URLSearchParams("tag=a,b"), {
      type: "toggle-tag-mode",
    })
    expect(orParams.get("tagMode")).toBe("or")
    const andParams = updateMemoFilterParams(orParams, { type: "toggle-tag-mode" })
    expect(andParams.get("tagMode")).toBeNull()
    expect(memoFilterHref(new URLSearchParams())).toBe("/")
  })
})
