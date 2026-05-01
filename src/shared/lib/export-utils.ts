import { format } from "date-fns"
import { Memo } from "@/types/memo"

/**
 * 根据 Memo 内容生成安全的文件名
 * 格式：YYYYMMDD-摘要.png
 */
export function getExportFileName(memo: Memo): string {
  const dateStr = format(new Date(memo.created_at), "yyyyMMdd")

  // 提取摘要：取前 15 个字符，移除换行和特殊字符
  const summary = memo.content
    .trim()
    .replace(/[\n\r]/g, " ") // 换行转空格
    .replace(/[#*`[\]()]/g, "") // 移除常用 Markdown 符号
    .replace(/[\\/:*?"<>|]/g, "") // 移除文件系统非法字符
    .slice(0, 15)
    .trim()

  const safeSummary = summary || "untitled"

  return `${dateStr}-${safeSummary}`
}
