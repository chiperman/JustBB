"use client"

import { useState, useEffect, useCallback } from "react"
import { Memo } from "@/types/memo"
import { createMemo, updateMemoContent } from "@/server/actions/memos/mutate"
import { dispatchMemoEvent } from "@/lib/memos/events"
import { memoCache } from "@/shared/lib/memo-cache"
import { useTags } from "@/state/TagsContext"
import { useStats } from "@/state/StatsContext"
import { Editor } from "@tiptap/react"
import { useToast } from "@/shared/hooks/use-toast"

// Draft Persistence Keys
export const DRAFT_CONTENT_KEY = "memo_editor_draft_content"
export const DRAFT_IS_PRIVATE_KEY = "memo_editor_draft_is_private"
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface UseMemoEditorProps {
  mode: "create" | "edit"
  initialMemo?: Memo
  onSuccess?: (memo?: Memo) => void
  onCancel?: () => void
}

export function useMemoEditor({ mode, initialMemo, onSuccess, onCancel }: UseMemoEditorProps) {
  const { refreshTags } = useTags()
  const { refreshStats } = useStats()
  const { toast } = useToast()

  const [content, setContent] = useState(initialMemo?.content || "")
  const [images, setImages] = useState<string[]>(initialMemo?.images || [])
  const [isPending, setIsPending] = useState(false)
  const [isPrivate, setIsPrivate] = useState(initialMemo?.is_private || false)
  const [accessCode, setAccessCode] = useState("")
  const [accessHint, setAccessHint] = useState("")
  const [isPinned, setIsPinned] = useState(initialMemo?.is_pinned || false)
  const [error, setError] = useState<string | null>(null)

  // UI States that should stay in Hook for consistency
  const [showPrivateDialog, setShowPrivateDialog] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pasteMenuPosition, setPasteMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const isAnyDialogOpen =
    showPrivateDialog ||
    showLocationPicker ||
    showLinkPicker ||
    isMenuOpen ||
    showSuggestions ||
    !!pasteMenuPosition

  // Draft Loading Effect
  useEffect(() => {
    if (mode === "create" && !initialMemo && typeof window !== "undefined") {
      const draftIsPrivate = localStorage.getItem(DRAFT_IS_PRIVATE_KEY)
      if (draftIsPrivate) {
        setIsPrivate(draftIsPrivate === "true")
      }
    }
  }, [mode, initialMemo])

  const handleTogglePrivate = useCallback(() => {
    const newState = !isPrivate
    setIsPrivate(newState)
    if (mode === "create") {
      localStorage.setItem(DRAFT_IS_PRIVATE_KEY, String(newState))
    }
    if (!newState) {
      setAccessCode("")
      setAccessHint("")
    }
  }, [isPrivate, mode])

  const performPublish = async (editor: Editor | null) => {
    const textContent = editor?.getText({ blockSeparator: "\n" }) || content
    if (isPending) {
      const message = "正在提交，请稍候。"
      setError(message)
      toast({ title: "请稍候", description: message })
      return
    }

    if (!textContent.trim()) {
      const message = "内容为空，无法保存。"
      setError(message)
      toast({
        title: mode === "edit" ? "保存失败" : "发布失败",
        description: message,
        variant: "destructive",
      })
      return
    }

    setIsPending(true)
    setError(null)
    setShowPrivateDialog(false)

    const formData = new FormData()
    formData.append("content", textContent)
    formData.append("is_private", String(isPrivate))
    formData.append("is_pinned", String(isPinned))
    formData.append("images", JSON.stringify(images))

    if (isPrivate && accessCode) {
      formData.append("access_code", accessCode)
      formData.append("access_code_hint", accessHint)
    }

    try {
      let result
      if (mode === "edit" && initialMemo) {
        if (!UUID_PATTERN.test(String(initialMemo.id ?? ""))) {
          const message = `无效的ID：${String(initialMemo.id ?? "(空)")}`
          setError(message)
          toast({
            title: "保存失败",
            description: message,
            variant: "destructive",
          })
          return
        }
        formData.append("id", initialMemo.id)
        result = await updateMemoContent(formData)
      } else {
        result = await createMemo(formData)
      }

      if (result.success) {
        const newMemo = result.data as Memo | undefined
        if (newMemo) {
          memoCache.addItem({
            id: newMemo.id,
            memo_number: newMemo.memo_number || 0,
            content: newMemo.content,
            created_at: newMemo.created_at,
          })

          Promise.all([refreshTags?.(), refreshStats?.()]).catch((err) =>
            console.error("[Sync] Stats refresh failed:", err)
          )
        }

        if (mode === "create") {
          localStorage.removeItem(DRAFT_CONTENT_KEY)
          localStorage.removeItem(DRAFT_IS_PRIVATE_KEY)

          editor?.commands.setContent("")
          setContent("")
          setIsPrivate(false)
          setAccessCode("")
          setAccessHint("")
          setIsPinned(false)
          setImages([])

          if (newMemo) {
            dispatchMemoEvent({ type: "create", memo: newMemo })
          }
          toast({ title: "已发布" })
        } else {
          toast({ title: "已保存" })
          onSuccess?.(newMemo)
        }
      } else {
        const message = typeof result.error === "string" ? result.error : "操作失败，请稍后重试"
        setError(message)
        toast({
          title: mode === "edit" ? "保存失败" : "发布失败",
          description: message,
          variant: "destructive",
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "服务器连接失败"
      setError(message)
      toast({
        title: mode === "edit" ? "保存失败" : "发布失败",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = useCallback(() => {
    if (mode === "edit") {
      onCancel?.()
    } else {
      localStorage.removeItem(DRAFT_CONTENT_KEY)
      localStorage.removeItem(DRAFT_IS_PRIVATE_KEY)
      setContent("")
      setIsPrivate(false)
      setAccessCode("")
      setAccessHint("")
      setIsPinned(false)
      setImages([])
      setError(null)
      setShowPrivateDialog(false)
      setShowLocationPicker(false)
      setShowLinkPicker(false)
    }
  }, [mode, onCancel])

  return {
    content,
    setContent,
    images,
    setImages,
    isPending,
    setIsPending,
    isPrivate,
    setIsPrivate,
    accessCode,
    setAccessCode,
    accessHint,
    setAccessHint,
    isPinned,
    setIsPinned,
    error,
    setError,
    showPrivateDialog,
    setShowPrivateDialog,
    isFocused,
    setIsFocused,
    isAnimating,
    setIsAnimating,
    showLocationPicker,
    setShowLocationPicker,
    showLinkPicker,
    setShowLinkPicker,
    isMenuOpen,
    setIsMenuOpen,
    showSuggestions,
    setShowSuggestions,
    pasteMenuPosition,
    setPasteMenuPosition,
    isAnyDialogOpen,
    handleTogglePrivate,
    performPublish,
    handleCancel,
  }
}
