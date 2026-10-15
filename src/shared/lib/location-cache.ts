import type { Location, Memo } from "@/types/memo"

export interface MapMarker extends Location {
  items: Memo[]
  // 以下字段保持可选以兼容旧逻辑，但逻辑上应该优先使用 items
  memoId?: string
  memoNumber?: number
  content?: string
}
