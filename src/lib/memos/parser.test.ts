import { mergeTagsIntoContent, removeTagsFromContent } from "./parser"

describe("mergeTagsIntoContent", () => {
  it("应该能向已有内容中添加新标签", () => {
    const content = "这是一条笔记"
    const existingTags = ["旧标签"]
    const newTags = ["新标签"]

    const result = mergeTagsIntoContent(content, existingTags, newTags)

    expect(result.tags).toContain("旧标签")
    expect(result.tags).toContain("新标签")
    expect(result.content).toBe("这是一条笔记 #新标签")
  })

  it("不应该重复添加已存在的标签", () => {
    const content = "笔记 #已有标签"
    const existingTags = ["已有标签"]
    const newTags = ["已有标签", "新标签"]

    const result = mergeTagsIntoContent(content, existingTags, newTags)

    expect(result.tags).toHaveLength(2)
    expect(result.content).toBe("笔记 #已有标签 #新标签")
  })

  it("在内容已有标签但标签数组缺失时应能正确合并", () => {
    const content = "笔记 #手动标签"
    const existingTags: string[] = []
    const newTags = ["手动标签"]

    const result = mergeTagsIntoContent(content, existingTags, newTags)

    expect(result.tags).toEqual(["手动标签"])
    expect(result.content).toBe("笔记 #手动标签") // 不应重复追加内容
  })

  it("处理空内容和空数组时应保持健壮", () => {
    const result = mergeTagsIntoContent("", [], ["标签"])
    expect(result.content).toBe("#标签")
    expect(result.tags).toEqual(["标签"])
  })
})

describe("removeTagsFromContent", () => {
  it("应该从内容中安全移除存在的标签", () => {
    const content = "这是一条笔记 #标签1 #标签2"
    const existingTags = ["标签1", "标签2", "其他"]
    const tagsToRemove = ["标签1"]

    const result = removeTagsFromContent(content, existingTags, tagsToRemove)

    expect(result.tags).toEqual(["标签2", "其他"])
    expect(result.content).toBe("这是一条笔记 #标签2")
  })

  it("移除中英文和含特殊字符的标签时，正则转义应正常工作", () => {
    const content = "内容 #work/study #中文-标签 #test-tag"
    const existingTags = ["work/study", "中文-标签", "test-tag"]

    const result1 = removeTagsFromContent(content, existingTags, ["work/study"])
    expect(result1.content).toBe("内容 #中文-标签 #test-tag")
    expect(result1.tags).toEqual(["中文-标签", "test-tag"])

    const result2 = removeTagsFromContent(content, existingTags, ["中文-标签"])
    expect(result2.content).toBe("内容 #work/study #test-tag")
    expect(result2.tags).toEqual(["work/study", "test-tag"])
  })

  it("移除不存在的标签时内容和数组应保持原样", () => {
    const content = "这是一条笔记 #标签1"
    const existingTags = ["标签1"]
    const tagsToRemove = ["不存在的标签"]

    const result = removeTagsFromContent(content, existingTags, tagsToRemove)

    expect(result.tags).toEqual(["标签1"])
    expect(result.content).toBe("这是一条笔记 #标签1")
  })

  it("处理空内容时应保持健壮", () => {
    const result = removeTagsFromContent("", [], ["标签"])
    expect(result.content).toBe("")
    expect(result.tags).toEqual([])
  })
})
