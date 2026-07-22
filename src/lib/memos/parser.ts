/**
 * 笔记内容解析工具类
 * 负责从 Markdown 文本中提取标签、定位信息及统计字数
 */

import { Location } from "@/types/memo"

// Re-export for convenience
export type { Location }

/**
 * 从文本中提取 #标签
 */
export function extractTags(content: string): string[] {
  const tagRegex = /#([\w\u4e00-\u9fa5]+)/g
  const tags = new Set<string>()
  let match
  while ((match = tagRegex.exec(content)) !== null) {
    tags.add(match[1])
  }
  return Array.from(tags)
}

/**
 * 从文本中提取定位信息 📍[名称](lat, lng)
 */
export function extractLocations(content: string): Location[] {
  const locationRegex = /📍\[([^\]]+)\]\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/g
  const locations: Location[] = []
  let match
  while ((match = locationRegex.exec(content)) !== null) {
    locations.push({
      name: match[1],
      lat: parseFloat(match[2]),
      lng: parseFloat(match[3]),
    })
  }
  return locations
}

/**
 * 计算字数（去除首尾空格）
 */
export function calculateWordCount(content: string): number {
  return content.trim().length
}

/**
 * 将正文中的图片标记迁移到独立图片数组。
 */
export function extractImagesFromContent(
  content: string,
  existingImages: string[] = []
): { content: string; images: string[] } {
  const images = new Set(existingImages.filter(Boolean))
  let updatedContent = content || ""

  const collectImage = (_match: string, _title: string, url: string) => {
    images.add(url)
    return ""
  }

  updatedContent = updatedContent
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, collectImage)
    .replace(/🔗\[([^\]]+)\]\((https?:\/\/[^\s|]+)\|image\)/g, collectImage)
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
    .filter((line, index, lines) => line.trim() || (index > 0 && index < lines.length - 1))
    .join("\n")
    .trim()

  return {
    content: updatedContent,
    images: Array.from(images),
  }
}

/**
 * 将新的标签合并到现有的内容和标签数组中
 */
export function mergeTagsIntoContent(
  content: string,
  existingTags: string[],
  newTags: string[]
): { content: string; tags: string[] } {
  const combinedTags = Array.from(new Set([...(existingTags || []), ...newTags]))

  let updatedContent = content || ""
  const currentTagsInContent = new Set(extractTags(updatedContent))

  const tagsToAppend = newTags.filter((tag) => !currentTagsInContent.has(tag))

  if (tagsToAppend.length > 0) {
    const suffix = tagsToAppend.map((t) => `#${t}`).join(" ")
    updatedContent = updatedContent.trimEnd() + (updatedContent.trim() ? " " : "") + suffix
  }

  return {
    content: updatedContent,
    tags: combinedTags,
  }
}

/**
 * 从内容中移除指定的标签，更新正文和标签数组
 */
export function removeTagsFromContent(
  content: string,
  existingTags: string[],
  tagsToRemove: string[]
): { content: string; tags: string[] } {
  const remainingTags = (existingTags || []).filter((t) => !tagsToRemove.includes(t))

  let updatedContent = content || ""
  for (const tag of tagsToRemove) {
    // 匹配 #tag，并处理前后的空格，确保不破坏周围的排版。
    // 支持中文和英文标签。
    const escapedTag = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    // (?=\s|$) 确保后面是空白字符或行尾
    const regex = new RegExp(`\\s*#${escapedTag}(?=\\s|$)`, "g")
    updatedContent = updatedContent.replace(regex, "")
  }

  return {
    content: updatedContent.trim(),
    tags: remainingTags,
  }
}

export function renameTagInContent(content: string, oldTag: string, newTag: string) {
  const escaped = oldTag.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
  return content.replace(new RegExp(`(^|\\s)#${escaped}(?=\\s|$)`, "g"), `$1#${newTag}`)
}
