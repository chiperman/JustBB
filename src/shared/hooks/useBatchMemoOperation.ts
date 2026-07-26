"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import type { ActionResponse } from "@/server/actions/shared/types"
import { useSelection } from "@/state/UIContext"
import { useTags } from "@/state/TagsContext"
import { useStats } from "@/state/StatsContext"
import { useConfirm } from "@/state/ConfirmContext"
import { useToast } from "@/shared/hooks/use-toast"
import { dispatchMemoEvent, type MemoEventPayload } from "@/lib/memos/events"

type BatchToast = {
  title: string
  description?: string | null
  variant?: "default" | "destructive" | "success"
}

type BatchConfirmation = {
  title: string
  description: string
  confirmLabel: string
  variant?: "default" | "destructive"
}

export type BatchMemoOperation<Result> = {
  confirmation?: BatchConfirmation
  action: (ids: string[]) => Promise<ActionResponse<Result>>
  successToast: (count: number) => BatchToast
  failureTitle: string
  events?: (ids: string[], data: Result | undefined) => MemoEventPayload[]
  onSettled?: () => void
}

type BatchMemoOperationDependencies = {
  confirm: (options: BatchConfirmation) => Promise<boolean>
  toast: (toast: BatchToast) => void
  setPending: (pending: boolean) => void
  dispatch: (event: MemoEventPayload) => void
  clearSelection: () => void
  refreshTags: () => void | Promise<void>
  refreshStats: () => void | Promise<void>
  refreshRoute: () => void
}

export async function executeBatchMemoOperation<Result>(
  ids: string[],
  operation: BatchMemoOperation<Result>,
  dependencies: BatchMemoOperationDependencies
) {
  if (ids.length === 0) return false
  if (operation.confirmation && !(await dependencies.confirm(operation.confirmation))) return false

  dependencies.setPending(true)
  try {
    const result = await operation.action(ids)
    if (!result.success) {
      dependencies.toast({
        title: operation.failureTitle,
        description: result.error,
        variant: "destructive",
      })
      return false
    }

    dependencies.toast(operation.successToast(ids.length))
    operation.events?.(ids, result.data).forEach(dependencies.dispatch)
    dependencies.clearSelection()
    void Promise.all([dependencies.refreshTags(), dependencies.refreshStats()])
    dependencies.refreshRoute()
    return true
  } catch (error) {
    dependencies.toast({
      title: operation.failureTitle,
      description: error instanceof Error ? error.message : "操作失败，请稍后重试",
      variant: "destructive",
    })
    return false
  } finally {
    dependencies.setPending(false)
    operation.onSettled?.()
  }
}

export function useBatchMemoOperation() {
  const router = useRouter()
  const { selectedIds, clearSelection } = useSelection()
  const { refreshTags } = useTags()
  const { refreshStats } = useStats()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)

  const run = useCallback(
    <Result>(operation: BatchMemoOperation<Result>) =>
      executeBatchMemoOperation(Array.from(selectedIds), operation, {
        confirm,
        toast,
        setPending: setIsPending,
        dispatch: dispatchMemoEvent,
        clearSelection,
        refreshTags,
        refreshStats,
        refreshRoute: router.refresh,
      }),
    [clearSelection, confirm, refreshStats, refreshTags, router.refresh, selectedIds, toast]
  )

  return { run, isPending }
}
