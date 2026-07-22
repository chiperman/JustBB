import { Tag01Icon } from "@hugeicons/core-free-icons"

import { PageEmptyState } from "@/shared/ui/PageEmptyState"

export function TagsEmptyState() {
  return (
    <PageEmptyState
      icon={Tag01Icon}
      title="暂无标签"
      description="写下第一条带标签的 Memo 之后，这里会自动形成索引。"
    />
  )
}
