"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  Loading01Icon as Loader2,
} from "@hugeicons/core-free-icons"

import { Button } from "@/shared/ui/button"
import { ContextPageHeader } from "@/shared/layout/ContextPageShell"
import { useConfirm } from "@/state/ConfirmContext"

interface TrashHeaderProps {
  count: number
  isPending: boolean
  onEmptyTrash: () => void
}

export function TrashHeader({
  count,
  isPending,
  onEmptyTrash,
}: TrashHeaderProps) {
  const { confirm } = useConfirm()

  const handleEmptyTrash = async () => {
    const ok = await confirm({
      title: "清空回收站？",
      description: "清空后，回收站内的所有记录都会被彻底删除，且无法恢复。",
      confirmLabel: "清空回收站",
      variant: "destructive",
    })
    if (ok) {
      onEmptyTrash()
    }
  }

  return (
    <ContextPageHeader
      icon={Delete02Icon}
      title="回收站"
      showTitle={false}
      description={
        count > 0
          ? `这里按最近删除排序，共 ${count} 条记录。`
          : "这里暂时没有已删除记录。"
      }
      actions={
        count > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="border-border/60 bg-background/80 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive rounded-md"
            disabled={isPending}
            onClick={handleEmptyTrash}
          >
            {isPending ? (
              <HugeiconsIcon
                icon={Loader2}
                size={14}
                className="animate-spin"
              />
            ) : (
              <HugeiconsIcon icon={Delete02Icon} size={15} />
            )}
            清空回收站
          </Button>
        ) : null
      }
    />
  )
}
