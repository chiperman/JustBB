import { Memo } from "@/types/memo"

export interface ParsedMemo extends Partial<Memo> {
  content: string
  created_at: string
}

/**
 * 解析原生 JSON 备份
 */
export function parseJSON(content: string): ParsedMemo[] {
  try {
    const data = JSON.parse(content)
    if (Array.isArray(data)) {
      return data as ParsedMemo[]
    }
    return []
  } catch (e) {
    console.error("解析 JSON 失败:", e)
    return []
  }
}

/**
 * 解析原生 Markdown 备份
 * 格式：### [YYYY/M/D HH:mm:ss] 🌍 公开/🔒 私密\n\n内容\n\n---
 */
export function parseMarkdown(content: string): ParsedMemo[] {
  const memos: ParsedMemo[] = []
  // 更加灵活的正则：匹配 ### [时间]，后面的 🌍/🔒 为可选（兼容旧版），然后是可选的元数据注释
  const regex =
    /### \[(.*?)\](?: .*?)?\r?\n(?:<!-- (.*?) -->\r?\n)?\r?\n([\s\S]*?)(?=\r?\n\r?\n---|\r?\n?$)/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const [, dateStr, metadataStr, memoContent] = match
    const cleanContent = memoContent.trim()

    if (cleanContent) {
      let metadata: Record<string, unknown> = {}
      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr) as Record<string, unknown>
        } catch (e) {
          console.warn("解析元数据失败:", e)
        }
      }

      memos.push({
        ...metadata,
        content: cleanContent,
        created_at:
          (metadata.created_at as string) ||
          new Date(dateStr.replace(/\//g, "-")).toISOString(),
        is_private: (metadata.is_private as boolean) ?? false, // 默认设为公开，元数据中会有真实值
      } as ParsedMemo)
    }
  }

  return memos
}

/**
 * 解析 LeanCloud JSONL 格式
 */
export function parseLeanCloud(content: string): ParsedMemo[] {
  const lines = content.split("\n")
  const memos: ParsedMemo[] = []

  for (const line of lines) {
    if (!line.trim() || line.startsWith("#filetype")) continue

    try {
      const data = JSON.parse(line)
      if (data.content) {
        // 提取标签：例如 "# 💤梦 # 标签2" -> ["💤梦", "标签2"]
        const tags: string[] = []
        if (data.tag) {
          const rawTags = data.tag
            .split("#")
            .map((t: string) => t.trim())
            .filter(Boolean)
          tags.push(...rawTags)
        }

        memos.push({
          content: data.content,
          created_at:
            data.createdAt || data.updatedAt || new Date().toISOString(),
          updated_at: data.updatedAt,
          tags: tags,
          is_private: false, // LeanCloud 默认公开，除非有特殊逻辑
        })
      }
    } catch (err) {
      console.warn("跳过无效行:", line, err)
    }
  }

  return memos
}
