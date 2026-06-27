"use client"

import { useEffect, useState, useRef } from "react"
import { deleteMemo, restoreMemo, permanentDeleteMemo } from "@/server/actions/memos/trash"
import { updateMemoState } from "@/server/actions/memos/mutate"
import { dispatchMemoEvent } from "@/lib/memos/events"
import { memoCache } from "@/shared/lib/memo-cache"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  ArchiveRestore,
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
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { AccessCodeDialog } from "@/features/memos/components/AccessCodeDialog"
import { useToast } from "@/shared/hooks/use-toast"
import { MemoShare } from "@/features/memos/components/MemoShare"
import { Memo } from "@/types/memo"
import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { useConfirm } from "@/state/ConfirmContext"
import { cn } from "@/shared/lib/utils"

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
  const [showPrompt, setShowPrompt] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [accessHint, setAccessHint] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const preventCloseFocusRef = useRef(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const hasMounted = useHasMounted()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  useEffect(() => {
    if (!isOpen) return

    const closeOnScroll = () => {
      handleOpenChange(false)
    }

    window.addEventListener("scroll", closeOnScroll, true)
    return () => window.removeEventListener("scroll", closeOnScroll, true)
  }, [isOpen])

  if (!hasMounted) {
    return <div className="w-8 h-8" />
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "删除这条记录？",
      description: "删除后会移至回收站，之后仍可恢复。",
      confirmLabel: "删除",
      variant: "destructive",
    })
    if (!ok) return

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
    const ok = await confirm({
      title: "彻底删除这条记录？",
      description: "删除后将直接从数据库移除，无法恢复。",
      confirmLabel: "彻底删除",
      variant: "destructive",
    })
    if (!ok) return

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
    dispatchMemoEvent({
      type: "update",
      id,
      updates: {
        is_pinned: !isPinned,
        pinned_at: !isPinned ? new Date().toISOString() : null,
      },
    })
    toast({
      title: !isPinned ? "已置顶" : "已取消置顶",
    })
  }

  const handleTogglePrivate = async () => {
    if (isPrivate) {
      const ok = await confirm({
        title: "设为公开？",
        description: "设为公开后，所有人都可以看到此内容。",
        confirmLabel: "设为公开",
      })
      if (!ok) return

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
        dispatchMemoEvent({
          type: "update",
          id,
          updates: { is_private: false },
        })
        toast({ title: "已公开", description: "该记录现在所有人可见" })
      }
      setIsPending(false)
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
        description: code ? "这条记录现在需要口令才能查看" : "这条记录现在仅自己可见",
      })
    }
    setIsPending(false)
  }

  if (isDeleted) {
    return (
      <div className="flex items-center gap-2">
        {isOwner && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRestore}
                  disabled={isPending}
                  className="rounded-md text-green hover:bg-green/10 [@media(pointer:coarse)]:active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="恢复"
                >
                  <HugeiconsIcon icon={ArchiveRestore} size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">恢复</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePermanentDelete}
                  disabled={isPending}
                  className="rounded-md text-destructive hover:bg-destructive/10 [@media(pointer:coarse)]:active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="彻底删除"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">彻底删除</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 p-0 hover:bg-accent rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 hover:scale-100 active:scale-100 transition-[background-color,opacity]",
              isOpen && "opacity-100"
            )}
          >
            <span className="flex items-center justify-center w-full h-full [@media(pointer:coarse)]:active:scale-95 transition-transform duration-200">
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={16}
                className="text-muted-foreground"
              />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-20 w-48"
          onCloseAutoFocus={(e) => {
            if (preventCloseFocusRef.current) {
              e.preventDefault()
              preventCloseFocusRef.current = false
            }
          }}
        >
          {!isDeleted && (
            <>
              {isOwner && (
                <DropdownMenuItem onClick={onEdit}>
                  <HugeiconsIcon icon={PencilEdit01Icon} size={16} className="mr-2" />
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
                      <HugeiconsIcon icon={Share01Icon} size={16} className="mr-2" />
                      分享
                    </DropdownMenuItem>
                  }
                />
              )}
            </>
          )}
          {isOwner && (
            <>
              <DropdownMenuItem
                onClick={handleTogglePin}
                disabled={isPending}
                onSelect={() => {
                  preventCloseFocusRef.current = true
                }}
              >
                <HugeiconsIcon icon={PinIcon} size={16} className="mr-2" />
                {isPinned ? "取消置顶" : "置顶"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleTogglePrivate} disabled={isPending}>
                <HugeiconsIcon
                  icon={isPrivate ? ChatUnlock01Icon : ChatLock01Icon}
                  size={16}
                  className="mr-2"
                />
                {isPrivate ? "取消私密" : "设为私密"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/5"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-2" />
                删除
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
