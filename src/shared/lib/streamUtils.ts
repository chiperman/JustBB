import { Memo } from "@/types/memo"

/**
 * 双向流数据合并工具
 * 确保数据在向上或向下加载后：
 * 1. 唯一性：基于 ID 去重
 * 2. 顺序性：始终保持 created_at 降序（最新在顶）
 */
export function mergeMemos(existing: Memo[], incoming: Memo[]): Memo[] {
  const map = new Map<string, Memo>()

  // 将现有数据和新数据放入 Map 自动去重
  existing.forEach((m) => map.set(m.id, m))
  incoming.forEach((m) => map.set(m.id, m))

  // 转化为数组并按优先级排列：1. 置顶优先 2. 创建时间降序
  return Array.from(map.values()).sort((a, b) => {
    // 首先比较置顶状态
    if (a.is_pinned !== b.is_pinned) {
      return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)
    }
    // 置顶状态相同时，按创建时间降序
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
