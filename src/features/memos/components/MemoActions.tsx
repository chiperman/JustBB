"use client"

import { useState } from "react"
import {
  deleteMemo,
  restoreMemo,
  permanentDeleteMemo,
} from "@/actions/memos/trash"
import { updateMemoState } from "@/actions/memos/mutate"
import { dispatchMemoEvent } from "@/lib/memos/events"
import { memoCache } from "@/lib/memo-cache"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  RotateLeft01Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  Share01Icon,
  PinIcon,
  ChatLock01Icon,
  ChatUnlock01Icon,
} from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AccessCodeDialog } from "@/features/memos/components/AccessCodeDialog"
import { useToast } from "@/hooks/use-toast"
import { MemoShare } from "@/features/memos/components/MemoShare"
import { Memo } from "@/types/memo"
import { useHasMounted } from "@/hooks/useHasMounted"

interface MemoActionsProps {
  id: string
  isDeleted: boolean
  isPinned?: boolean
  isPrivate?: boolean
  content?: string
  createdAt?: string
  tags?: string[]
  onEdit?: () => void
  onOpenChange?: (open: boolean) => void
  isOwner?: boolean
}

export function MemoActions({
  id,
  isDeleted,
  isPinned = false,
  isPrivate = false,
  content = "",
  createdAt = "",
  tags = [],
  onEdit,
  onOpenChange,
  isOwner = false,
}: MemoActionsProps) {
  const [isPending, setIsPending] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showPermanentDeleteAlert, setShowPermanentDeleteAlert] =
    useState(false)
  const [showPublicConfirm, setShowPublicConfirm] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [accessHint, setAccessHint] = useState("")
  const { toast } = useToast()
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return <div className="w-8 h-8" />
  }

  const handleDelete = async () => {
    setIsPending(true)
    await deleteMemo(id)
    memoCache.removeItem(id)
    setIsPending(false)
    dispatchMemoEvent({ type: "delete", id })
    toast({
      title: "已删除",
      description: "记录已移至回收站",
    })
  }

  const handleRestore = async () => {
    setIsPending(true)
    await restoreMemo(id)
    setIsPending(false)
    dispatchMemoEvent({ type: "delete", id })
    toast({
      title: "已恢复",
      description: "记录已恢复至首页",
    })
  }

  const handlePermanentDelete = async () => {
    setIsPending(true)
    await permanentDeleteMemo(id)
    setIsPending(false)
    dispatchMemoEvent({ type: "delete", id })
    toast({
      title: "已彻底删除",
      description: "这条记录已从数据库中移除",
      variant: "destructive",
    })
  }

  const handleTogglePin = async () => {
    setIsPending(true)
    const formData = new FormData()
    formData.append("id", id)
    formData.append("is_pinned", String(!isPinned))
    await updateMemoState(formData)
    setIsPending(false)
    dispatchMemoEvent({ type: "update", id, updates: { is_pinned: !isPinned } })
    toast({
      title: !isPinned ? "已置顶" : "已取消置顶",
    })
  }

  const confirmMakePublic = async () => {
    setIsPending(true)
    const formData = new FormData()
    formData.append("id", id)
    formData.append("is_private", "false")
    const result = await updateMemoState(formData)
    if (result?.error) {
      toast({
        title: "错误",
        description: result.error,
        variant: "destructive",
      })
    } else {
      dispatchMemoEvent({ type: "update", id, updates: { is_private: false } })
      toast({ title: "已公开", description: "该记录现在所有人可见" })
    }
    setIsPending(false)
  }

  const handleTogglePrivate = async () => {
    if (isPrivate) {
      setShowPublicConfirm(true)
    } else {
      setShowPrompt(true)
    }
  }

  const handlePromptOpenChange = (open: boolean) => {
    setShowPrompt(open)
    if (!open) {
      setAccessCode("")
      setAccessHint("")
    }
  }

  const handlePromptConfirm = async (code: string, hint: string) => {
    handlePromptOpenChange(false)
    setIsPending(true)
    const formData = new FormData()
    formData.append("id", id)
    formData.append("is_private", "true")
    if (code) {
      formData.append("access_code", code)
      if (hint) {
        formData.append("access_code_hint", hint)
      }
    }

    const result = await updateMemoState(formData)
    if (result?.error) {
      toast({
        title: "错误",
        description: result.error,
        variant: "destructive",
      })
    } else {
      dispatchMemoEvent({ type: "update", id, updates: { is_private: true } })
      toast({
        title: "已设为私密",
        description: code
          ? "这条记录现在需要口令才能查看"
          : "这条记录现在仅自己可见",
      })
    }
    setIsPending(false)
  }

  if (isDeleted) {
    return (
      <div className="flex items-center gap-2">
        {isOwner && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestore}
              disabled={isPending}
              className="rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 active:scale-95 transition-all"
              title="恢复"
            >
              <HugeiconsIcon icon={RotateLeft01Icon} size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPermanentDeleteAlert(true)}
              disabled={isPending}
              className="rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-all"
              title="彻底删除"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </Button>

            <AlertDialog
              open={showPermanentDeleteAlert}
              onOpenChange={setShowPermanentDeleteAlert}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>彻底删除这条记录？</AlertDialogTitle>
                  <AlertDialogDescription>
                    删除后将直接从数据库移除，无法恢复。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePermanentDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    彻底删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-accent rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 transition-all active:scale-95"
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={16}
              className="text-muted-foreground"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isDeleted && (
            <>
              {isOwner && (
                <DropdownMenuItem onClick={onEdit}>
                  <HugeiconsIcon
                    icon={PencilEdit01Icon}
                    size={16}
                    className="mr-2"
                  />
                  编辑
                </DropdownMenuItem>
              )}
              {!isPrivate && (
                <MemoShare
                  memo={
                    {
                      id,
                      content,
                      created_at: createdAt,
                      tags,
                      is_pinned: isPinned,
                      is_private: isPrivate,
                      memo_number: 0,
                      owner_id: "",
                    } as Memo
                  }
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <HugeiconsIcon
                        icon={Share01Icon}
                        size={16}
                        className="mr-2"
                      />
                      分享
                    </DropdownMenuItem>
                  }
                />
              )}
            </>
          )}
          {isOwner && (
            <>
              <DropdownMenuItem onClick={handleTogglePin} disabled={isPending}>
                <HugeiconsIcon icon={PinIcon} size={16} className="mr-2" />
                {isPinned ? "取消置顶" : "置顶"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleTogglePrivate}
                disabled={isPending}
              >
                <HugeiconsIcon
                  icon={isPrivate ? ChatUnlock01Icon : ChatLock01Icon}
                  size={16}
                  className="mr-2"
                />
                {isPrivate ? "取消私密" : "设为私密"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowDeleteAlert(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/5"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-2" />
                删除
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这条记录？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后会移至回收站，之后仍可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 rounded-md"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPublicConfirm} onOpenChange={setShowPublicConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>设为公开？</AlertDialogTitle>
            <AlertDialogDescription>
              设为公开后，所有人都可以看到此内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMakePublic}
              className="rounded-md"
            >
              设为公开
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessCodeDialog
        open={showPrompt}
        onOpenChange={handlePromptOpenChange}
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        accessHint={accessHint}
        setAccessHint={setAccessHint}
        onConfirm={() => handlePromptConfirm(accessCode, accessHint)}
        title="设置访问口令"
        description="请设置访问口令以保护此内容。设为私密后，查看这条记录将需要输入该口令。"
        confirmLabel="设为私密"
      />
    </div>
  )
}
