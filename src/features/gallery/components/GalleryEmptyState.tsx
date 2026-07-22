import { Image01Icon as GalleryIcon } from "@hugeicons/core-free-icons"

import { PageEmptyState } from "@/shared/ui/PageEmptyState"

export function GalleryEmptyState() {
  return (
    <PageEmptyState
      icon={GalleryIcon}
      title="暂无图片"
      description="发布带图片的 Memo 后，影像会在这里汇集成你的私人画廊。"
    />
  )
}
