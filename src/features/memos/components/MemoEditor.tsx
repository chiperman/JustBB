"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/shared/lib/utils"
import { useEditor, type Editor } from "@tiptap/react"
import { getExtensions, textToTiptapHtml } from "@/features/memos/components/editor/extensions"
import { fetchLinkMetadata } from "@/shared/lib/link-preview"
import {
  findPendingMarkupLink,
  replaceSmartLinkToken,
  type LinkRenderMode,
} from "@/features/memos/components/editor/smartLink"
import { TextSelection } from "@tiptap/pm/state"

import { MemoEditorLayout } from "@/features/memos/components/MemoEditorLayout"
import { useState } from "react"
import { toast } from "@/shared/hooks/use-toast"

import { useMemoEditor, DRAFT_CONTENT_KEY } from "@/features/memos/hooks/useMemoEditor"
import { useImageUpload, type UploadedImage } from "@/features/memos/hooks/useImageUpload"
import {
  useEditorSuggestions,
  CustomSuggestionProps,
} from "@/features/memos/hooks/useEditorSuggestions"
import { Memo } from "@/types/memo"
import type { ImageMetadata } from "@/types/memo"

interface MemoEditorProps {
  mode?: "create" | "edit"
  memo?: Memo
  onCancel?: () => void
  onSuccess?: (memo?: Memo) => void
  isCollapsed?: boolean
  scrollCollapsed?: boolean
  className?: string
}

const IMAGE_URL_RE = /\.(?:jpe?g|png|gif|webp|avif|svg|bmp|ico|tiff?)(?:\?|#|$)/i

const isInteractiveElement = (node: Node | null): boolean => {
  if (!node || !(node instanceof Element)) return false

  return Boolean(
    node.closest(
      'button, a, [role="button"], [role="menu"], [role="menuitem"], [role="dialog"], [role="alertdialog"], [role="combobox"], [role="listbox"], [role="option"], [role="tab"], [role="link"], input, textarea, select'
    )
  )
}

type LocalImageAttachment = {
  id: string
  file?: File
  previewUrl: string
  progress?: number
  isUploading?: boolean
  publishStatus?: "queued" | "uploading" | "saving"
  uploaded?: UploadedImage
  hash?: string
}

async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

function revokePreviewUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname
    return IMAGE_URL_RE.test(pathname)
  } catch {
    return IMAGE_URL_RE.test(url)
  }
}

function deriveTitleFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url)
    const path = pathname.replace(/\/+$/, "")
    if (path && path !== "/") {
      const last = path.split("/").pop() || ""
      const cleaned = last.replace(/\.\w+$/, "").replace(/[-_]/g, " ")
      if (cleaned) return cleaned
    }
    return hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export const PLACEHOLDER_TEXT = "Wanna memo something? JustMemo it!"

function isPristineEmptyEditor(editor: Editor | null) {
  if (!editor) {
    return true
  }

  const { doc } = editor.state
  const firstChild = doc.firstChild

  return (
    doc.childCount === 1 && firstChild?.type.name === "paragraph" && firstChild.childCount === 0
  )
}

function getPendingLinkDeleteTo(doc: Editor["state"]["doc"], pos: number) {
  const node = doc.nodeAt(pos)
  if (!node) return pos + 1

  const to = pos + node.nodeSize
  return doc.textBetween(to, to + 1) === " " ? to + 1 : to
}

export function MemoEditor({
  mode = "create",
  memo,
  onCancel,
  onSuccess,
  isCollapsed: isPropCollapsed = false,
  scrollCollapsed = false,
  className,
}: MemoEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const relativeGroupRef = useRef<HTMLDivElement>(null)
  const previousPendingRef = useRef(false)
  const suppressSuggestionRestoreRef = useRef(true)
  const mousedownInsideEditorRef = useRef(false)
  const collapseAfterPopupCloseRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)

  const { uploadFile, isUploading } = useImageUpload()
  const [queuedImages, setQueuedImages] = useState<LocalImageAttachment[]>([])
  const queuedImagesRef = useRef<LocalImageAttachment[]>([])
  const uploadedImageHashesRef = useRef<Map<string, string>>(new Map())
  const [shakingQueuedId, setShakingQueuedId] = useState<string | null>(null)
  const [shakingUploadedUrl, setShakingUploadedUrl] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState<
    {
      id: string
      previewUrl: string
      progress: number
    }[]
  >([])

  const {
    content,
    setContent,
    images,
    setImages,
    imageMetadata,
    setImageMetadata,
    isPending,
    isPrivate,
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
    isAnyDialogOpen,
    setIsMenuOpen,
    showSuggestions,
    setShowSuggestions,
    pasteMenuPosition,
    setPasteMenuPosition,
    handleTogglePrivate,
    performPublish,
    handleCancel,
  } = useMemoEditor({ mode, initialMemo: memo, onSuccess, onCancel })
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [isPublishingQueuedImages, setIsPublishingQueuedImages] = useState(false)

  const handleImageFileUpload = useCallback(
    async (file: File, attachment?: { id: string; previewUrl: string }) => {
      const id = attachment?.id ?? Math.random().toString(36).substring(2, 9)
      const previewUrl = attachment?.previewUrl ?? URL.createObjectURL(file)
      const isQueuedAttachment = Boolean(attachment)

      if (isQueuedAttachment) {
        setQueuedImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? { ...img, progress: 0, isUploading: true, publishStatus: "uploading" }
              : img
          )
        )
      } else {
        setUploadingImages((prev) => [...prev, { id, previewUrl, progress: 0 }])
      }

      const result = await uploadFile(file, (progress) => {
        if (isQueuedAttachment) {
          setQueuedImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, progress, isUploading: true } : img))
          )
        } else {
          setUploadingImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, progress } : img))
          )
        }
      })

      if (isQueuedAttachment) {
        setQueuedImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? {
                  ...img,
                  progress: result.url ? 100 : undefined,
                  isUploading: false,
                  publishStatus: result.url ? "queued" : "queued",
                  uploaded: result.image ?? img.uploaded,
                }
              : img
          )
        )
      } else {
        setUploadingImages((prev) => prev.filter((img) => img.id !== id))
        URL.revokeObjectURL(previewUrl)
      }

      if (result.url) {
        let fileHash = queuedImagesRef.current.find((img) => img.id === id)?.hash
        if (!fileHash && file) {
          try {
            fileHash = await calculateFileHash(file)
          } catch {
            // ignore
          }
        }
        if (fileHash) {
          uploadedImageHashesRef.current.set(result.url, fileHash)
        }

        if (result.warning) {
          toast({
            title: "图片已上传",
            description: result.warning,
          })
        }
        const uploadedImage = result.image
        if (uploadedImage?.url && uploadedImage.width && uploadedImage.height) {
          setImageMetadata((prev) => ({
            ...prev,
            [uploadedImage.url]: {
              width: uploadedImage.width!,
              height: uploadedImage.height!,
            },
          }))
        }
        return uploadedImage
      } else if (result.error) {
        toast({
          title: "图片上传失败",
          description: result.error,
          variant: "destructive",
        })
      }

      return null
    },
    [setImageMetadata, uploadFile]
  )

  const handleLinkedImageUpload = useCallback(async (image: LocalImageAttachment) => {
    const progressSteps = [0, 18, 36, 58, 78, 92, 100]

    for (const progress of progressSteps) {
      setQueuedImages((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? {
                ...item,
                progress,
                isUploading: true,
                publishStatus: "uploading",
              }
            : item
        )
      )
      await wait(progress === 100 ? 80 : 120)
    }

    setQueuedImages((prev) =>
      prev.map((item) =>
        item.id === image.id
          ? {
              ...item,
              progress: 100,
              isUploading: false,
              publishStatus: "queued",
            }
          : item
      )
    )

    return image.uploaded ?? { url: image.previewUrl }
  }, [])

  const handleImageFiles = useCallback(async (files: File[] | FileList) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))
    if (imageFiles.length === 0) return

    const filesWithHash = await Promise.all(
      imageFiles.map(async (file) => {
        try {
          const hash = await calculateFileHash(file)
          return { file, hash }
        } catch {
          return { file, hash: undefined }
        }
      })
    )

    const newImagesToAdd: LocalImageAttachment[] = []
    let duplicateCount = 0
    let matchedQueuedId: string | null = null
    let matchedUploadedUrl: string | null = null

    for (const item of filesWithHash) {
      const { file, hash } = item
      if (!hash) {
        newImagesToAdd.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
        })
        continue
      }

      // 1. 检查当前本次选择中是否重复
      if (newImagesToAdd.some((img) => img.hash === hash)) {
        duplicateCount++
        continue
      }

      // 2. 检查待上传队列 queuedImages 中的哈希
      const existingQueued = queuedImagesRef.current.find((img) => img.hash === hash)
      if (existingQueued) {
        duplicateCount++
        matchedQueuedId = existingQueued.id
        continue
      }

      // 3. 检查已上传到当前会话的图片的哈希
      let isUploadedDuplicate = false
      for (const [url, uploadedHash] of uploadedImageHashesRef.current.entries()) {
        if (uploadedHash === hash) {
          duplicateCount++
          matchedUploadedUrl = url
          isUploadedDuplicate = true
          break
        }
      }
      if (isUploadedDuplicate) continue

      newImagesToAdd.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        hash,
      })
    }

    if (duplicateCount > 0) {
      toast({
        title: "已过滤重复图片",
        description: `自动过滤了 ${duplicateCount} 张重复的图片。`,
      })

      if (matchedQueuedId) {
        setShakingQueuedId(matchedQueuedId)
        setTimeout(() => setShakingQueuedId(null), 800)
      }
      if (matchedUploadedUrl) {
        setShakingUploadedUrl(matchedUploadedUrl)
        setTimeout(() => setShakingUploadedUrl(null), 800)
      }
    }

    if (newImagesToAdd.length > 0) {
      setQueuedImages((prev) => prev.concat(newImagesToAdd))
    }
  }, [])

  const handleRemoveUploadedImage = useCallback(
    (urlToRemove: string) => {
      setImages((prev) => prev.filter((url) => url !== urlToRemove))
      setImageMetadata((prev) => {
        const next = { ...prev }
        delete next[urlToRemove]
        return next
      })
      uploadedImageHashesRef.current.delete(urlToRemove)
    },
    [setImageMetadata, setImages]
  )

  const addImageUrlAttachment = useCallback(
    (url: string) => {
      if (images.includes(url)) return

      setQueuedImages((prev) => {
        if (prev.some((image) => image.uploaded?.url === url || image.previewUrl === url)) {
          return prev
        }

        return [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            previewUrl: url,
            publishStatus: "queued",
            uploaded: { url },
          },
        ]
      })
    },
    [images]
  )

  const handleRemoveQueuedImage = useCallback((idToRemove: string) => {
    setQueuedImages((prev) => {
      const target = prev.find((image) => image.id === idToRemove)
      if (target) revokePreviewUrl(target.previewUrl)
      return prev.filter((image) => image.id !== idToRemove)
    })
  }, [])

  const handleAttachmentInteract = useCallback(() => {
    collapseAfterPopupCloseRef.current = true
    setIsFocused(true)
  }, [setIsFocused])

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    const getImageFiles = (files: FileList | null | undefined) =>
      Array.from(files ?? []).filter((file) => file.type.startsWith("image/"))
    const hasImageItems = (items: DataTransferItemList | null | undefined) =>
      Array.from(items ?? []).some((item) => item.kind === "file" && item.type.startsWith("image/"))

    const handleWindowDragOver = (event: DragEvent) => {
      if (
        getImageFiles(event.dataTransfer?.files).length === 0 &&
        !hasImageItems(event.dataTransfer?.items)
      ) {
        return
      }
      event.preventDefault()
      setIsDraggingImages(true)
    }

    const handleWindowDrop = (event: DragEvent) => {
      setIsDraggingImages(false)
      if (event.defaultPrevented) return

      const imageFiles = getImageFiles(event.dataTransfer?.files)
      if (imageFiles.length === 0) return

      event.preventDefault()
      handleImageFiles(imageFiles)
    }

    const handleWindowDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) {
        setIsDraggingImages(false)
      }
    }

    window.addEventListener("dragover", handleWindowDragOver)
    window.addEventListener("drop", handleWindowDrop)
    window.addEventListener("dragleave", handleWindowDragLeave)

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver)
      window.removeEventListener("drop", handleWindowDrop)
      window.removeEventListener("dragleave", handleWindowDragLeave)
    }
  }, [handleImageFiles])

  useEffect(() => {
    queuedImagesRef.current = queuedImages
  }, [queuedImages])

  useEffect(
    () => () => {
      queuedImagesRef.current.forEach((image) => revokePreviewUrl(image.previewUrl))
    },
    []
  )

  const clearQueuedImages = useCallback(() => {
    setQueuedImages((prev) => {
      prev.forEach((image) => revokePreviewUrl(image.previewUrl))
      return []
    })
  }, [])

  const clearImageSessionState = useCallback(() => {
    clearQueuedImages()
    uploadedImageHashesRef.current.clear()
    setShakingQueuedId(null)
    setShakingUploadedUrl(null)
  }, [clearQueuedImages])

  const uploadQueuedImages = useCallback(async () => {
    if (queuedImages.length === 0) return { urls: images, metadata: imageMetadata }

    setIsPublishingQueuedImages(true)
    try {
      const uploadedImages = await Promise.all(
        queuedImages.map((image) =>
          image.file
            ? handleImageFileUpload(image.file, { id: image.id, previewUrl: image.previewUrl })
            : handleLinkedImageUpload(image)
        )
      )
      const validImages = uploadedImages.filter((image): image is UploadedImage =>
        Boolean(image?.url)
      )

      if (validImages.length !== queuedImages.length) {
        setQueuedImages((prev) =>
          prev.map((image) =>
            image.uploaded?.url
              ? image
              : {
                  ...image,
                  progress: undefined,
                  isUploading: false,
                  publishStatus: "queued",
                }
          )
        )
        return null
      }

      const nextMetadata: ImageMetadata = { ...imageMetadata }
      validImages.forEach((image) => {
        if (image.width && image.height) {
          nextMetadata[image.url] = {
            width: image.width,
            height: image.height,
          }
        }
      })

      setImageMetadata(nextMetadata)
      const uploadedById = new Map(
        queuedImages.map((image, index) => [image.id, validImages[index]] as const)
      )
      setQueuedImages((prev) =>
        prev.map((image) => ({
          ...image,
          progress: 100,
          isUploading: true,
          publishStatus: "saving",
          uploaded: uploadedById.get(image.id) ?? image.uploaded,
        }))
      )

      return {
        urls: [...images, ...validImages.map((image) => image.url)],
        metadata: nextMetadata,
      }
    } finally {
      setIsPublishingQueuedImages(false)
    }
  }, [
    handleImageFileUpload,
    handleLinkedImageUpload,
    imageMetadata,
    images,
    queuedImages,
    setImageMetadata,
  ])

  // 智能链接系统相关状态
  const [pendingPasteUrl, setPendingPasteUrl] = useState<string | null>(null)
  const [pendingPastePos, setPendingPastePos] = useState<number | null>(null)
  const [fetchedMeta, setFetchedMeta] = useState<{
    title: string | null
    domain: string | null
  } | null>(null)
  const [showPlaceholder, setShowPlaceholder] = useState(mode === "create")
  const [enableCollapseAnimation, setEnableCollapseAnimation] = useState(false)
  const [isCollapseProtected, setIsCollapseProtected] = useState(false)
  const [editingLinkInfo, setEditingLinkInfo] = useState<{
    title: string
    url: string
    mode: LinkRenderMode
    updateAttributes: (attrs: Record<string, string | boolean>) => void
  } | null>(null)

  const {
    suggestions,
    selectedIndex,
    setSelectedIndex,
    mentionQuery,
    isLoading,
    hasMoreMentions,
    suggestionPosition,
    suggestionsRef,
    selectedIndexRef,
    suggestionPropsRef,
    fetchMentionSuggestions,
    fetchHashtagSuggestions,
    updateSuggestionPosition,
    handleSelectSuggestion,
    handleSuggestionScroll,
  } = useEditorSuggestions({ setShowSuggestions })

  const hasDraftIntent =
    content.trim().length > 0 ||
    images.length > 0 ||
    queuedImages.length > 0 ||
    uploadingImages.length > 0
  const isBaseCollapsed = isPropCollapsed && !hasDraftIntent && !isCollapseProtected
  const isScrollCollapsed = scrollCollapsed && !isCollapseProtected
  const isActuallyCollapsed =
    (isBaseCollapsed || isScrollCollapsed) && !isFocused && !isAnyDialogOpen && mode === "create"
  const shouldAnimateCollapse = enableCollapseAnimation
  const needsPrivateDialog = isPrivate && (mode === "create" || !memo?.is_private)

  // 将 pending 的 markupLink 节点转为默认模式（图片 URL 转图片，普通 URL 转提及）
  const resolvePendingLink = useCallback(
    (view?: Editor["view"] | null) => {
      if (!pendingPasteUrl || !view) return
      const pendingLink = findPendingMarkupLink(view.state.doc, {
        url: pendingPasteUrl,
        pos: pendingPastePos,
      })
      if (pendingLink) {
        const isImg = isImageUrl(pendingPasteUrl)

        if (isImg) {
          const deleteTo = getPendingLinkDeleteTo(view.state.doc, pendingLink.pos)
          view.dispatch(view.state.tr.delete(pendingLink.pos, deleteTo))
          addImageUrlAttachment(pendingPasteUrl)
        } else {
          const node = view.state.doc.nodeAt(pendingLink.pos)
          if (node) {
            const finalTitle =
              fetchedMeta?.title || fetchedMeta?.domain || deriveTitleFromUrl(pendingPasteUrl)
            view.dispatch(
              view.state.tr.setNodeMarkup(pendingLink.pos, undefined, {
                ...node.attrs,
                isPending: false,
                mode: "mention",
                label: finalTitle,
              })
            )
          }
        }
      }
    },
    [addImageUrlAttachment, pendingPasteUrl, pendingPastePos, fetchedMeta]
  )

  // 关闭粘贴菜单并清理状态
  const closePasteMenu = useCallback(() => {
    setPasteMenuPosition(null)
    setPendingPasteUrl(null)
    setPendingPastePos(null)
    setFetchedMeta(null)
  }, [])

  const handlePublishWithQueuedImages = useCallback(async () => {
    const currentEditor = editorRef.current
    resolvePendingLink(currentEditor?.view)
    const uploaded = await uploadQueuedImages()
    if (!uploaded) return

    const didPublish = await performPublish(currentEditor, uploaded.urls, uploaded.metadata)
    if (didPublish) {
      clearImageSessionState()
      if (mode === "create") {
        currentEditor?.commands.blur()
        setIsFocused(false)
      }
    } else {
      setQueuedImages((prev) =>
        prev.map((image) => ({
          ...image,
          isUploading: false,
          publishStatus: "queued",
        }))
      )
    }
  }, [
    clearImageSessionState,
    performPublish,
    resolvePendingLink,
    uploadQueuedImages,
    mode,
    setIsFocused,
  ])

  useEffect(() => {
    if (!isCollapseProtected) return

    const timerId = window.setTimeout(() => {
      setIsCollapseProtected(false)
    }, 1500)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [isCollapseProtected, content, images.length, queuedImages.length, uploadingImages.length])

  const extensions = useMemo(
    () =>
      getExtensions({
        shouldAllowMentionSuggestion: () => !suppressSuggestionRestoreRef.current,
        onMentionStart: (props) => {
          if (suppressSuggestionRestoreRef.current) {
            return
          }
          suggestionPropsRef.current = props
          setShowSuggestions(true)
          fetchMentionSuggestions(props.query, 0)
          updateSuggestionPosition(props)
        },
        onMentionUpdate: (props) => {
          if (suppressSuggestionRestoreRef.current) {
            return
          }
          suggestionPropsRef.current = props
          fetchMentionSuggestions(props.query, 0)
          updateSuggestionPosition(props)
        },
        onMentionExit: () => {
          setShowSuggestions(false)
          suggestionPropsRef.current = null
        },
        onMentionKeyDown: (props) => {
          if (props.event.key === "Escape") {
            setShowSuggestions(false)
            return true
          }
          if (props.event.key === " " && suggestionPropsRef.current) {
            const query = suggestionPropsRef.current.query
            if (/^\d+$/.test(query)) {
              suggestionPropsRef.current.command({ id: query, label: query })
              props.event.preventDefault()
              return true
            }
          }
          if (props.event.key === "ArrowUp") {
            const len = suggestionsRef.current?.length || 0
            setSelectedIndex((prev) => (prev + len - 1) % (len || 1))
            props.event.preventDefault()
            return true
          }
          if (props.event.key === "ArrowDown") {
            const len = suggestionsRef.current?.length || 0
            setSelectedIndex((prev) => (prev + 1) % (len || 1))
            props.event.preventDefault()
            return true
          }
          if (props.event.key === "Enter") {
            const item = suggestionsRef.current?.[selectedIndexRef.current]
            if (item && suggestionPropsRef.current) {
              const label = item.label.startsWith("@") ? item.label.slice(1) : item.label
              suggestionPropsRef.current.command({ id: label, label: label })
              props.event.preventDefault()
              props.event.stopPropagation()
              return true
            }
          }
          return false
        },
        shouldAllowHashtagSuggestion: () => !suppressSuggestionRestoreRef.current,
        onHashtagStart: (props) => {
          if (suppressSuggestionRestoreRef.current) {
            return
          }
          suggestionPropsRef.current = props
          setShowSuggestions(true)
          fetchHashtagSuggestions(props.query)
          updateSuggestionPosition(props)
        },
        onHashtagUpdate: (props) => {
          if (suppressSuggestionRestoreRef.current) {
            return
          }
          suggestionPropsRef.current = props
          fetchHashtagSuggestions(props.query)
          updateSuggestionPosition(props)
        },
        onHashtagExit: () => {
          setShowSuggestions(false)
          suggestionPropsRef.current = null
        },
        onHashtagKeyDown: (props) => {
          if (props.event.key === "Escape") {
            setShowSuggestions(false)
            return true
          }
          if (props.event.key === " " && suggestionPropsRef.current) {
            const query = suggestionPropsRef.current.query
            if (/^[\w\u4e00-\u9fa5]+$/.test(query)) {
              suggestionPropsRef.current.command({ id: query, label: query })
              props.event.preventDefault()
              return true
            }
          }
          if (props.event.key === "ArrowUp") {
            const len = suggestionsRef.current?.length || 0
            setSelectedIndex((prev) => (prev + len - 1) % (len || 1))
            props.event.preventDefault()
            return true
          }
          if (props.event.key === "ArrowDown") {
            const len = suggestionsRef.current?.length || 0
            setSelectedIndex((prev) => (prev + 1) % (len || 1))
            props.event.preventDefault()
            return true
          }
          if (props.event.key === "Enter") {
            const item = suggestionsRef.current?.[selectedIndexRef.current]
            if (suggestionPropsRef.current && item) {
              const rawLabel = item.label
              const label = rawLabel.startsWith("#") ? rawLabel.slice(1) : rawLabel
              suggestionPropsRef.current.command({ id: label, label: label })
              props.event.preventDefault()
              props.event.stopPropagation()
              return true
            }
          }
          return false
        },
      }),
    [
      fetchHashtagSuggestions,
      fetchMentionSuggestions,
      setSelectedIndex,
      setShowSuggestions,
      updateSuggestionPosition,
      selectedIndexRef,
      suggestionPropsRef,
      suggestionsRef,
    ]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: memo?.content || "",
    onUpdate: ({ editor, transaction }) => {
      const text = editor.getText({ blockSeparator: "\n" })
      if (transaction.docChanged) {
        setShowPlaceholder(false)
        setIsCollapseProtected(true)
      }
      setContent(text)
      setError(null)
      if (mode === "create") {
        localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(editor.getJSON()))
      }
    },
    onFocus: () => {
      setIsFocused(true)
      collapseAfterPopupCloseRef.current = false

      if (suppressSuggestionRestoreRef.current) {
        return
      }

      setTimeout(() => {
        if (!editor) return
        const { from } = editor.state.selection
        const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from)
        const mentionMatch = textBefore.match(/(?:^|\s)(@|#)(\w*)$/)
        if (mentionMatch) {
          const char = mentionMatch[1]
          const query = mentionMatch[2]
          const startPos = from - mentionMatch[2].length - 1
          suggestionPropsRef.current = {
            editor,
            query,
            range: { from: startPos, to: from },
            command: (props: { label: string }) => {
              editor
                .chain()
                .focus()
                .deleteRange({ from: startPos, to: from })
                .insertContent([
                  {
                    type: char === "@" ? "mention" : "hashtag",
                    attrs: { id: props.label, label: props.label },
                  },
                  { type: "text", text: " " },
                ])
                .run()
            },
          } as CustomSuggestionProps
          setShowSuggestions(true)
          if (char === "@") fetchMentionSuggestions(query, 0)
          else fetchHashtagSuggestions(query)
        }
      }, 100)
    },
    onBlur: () => {
      // 只有当页面仍然拥有焦点时（即：用户点击了页面内其他地方），才执行收起逻辑
      // 如果是因为切换程序导致的窗口失焦，则保持展开状态，避免用户切回时看到"跳动"
      if (document.hasFocus()) {
        resolvePendingLink(editor?.view)
        closePasteMenu()
        setShowSuggestions(false)
        // 点击外部关闭弹窗时，只关闭弹窗不收缩编辑器
        if (isAnyDialogOpen || collapseAfterPopupCloseRef.current) {
          collapseAfterPopupCloseRef.current = false
          return
        }
        setIsFocused(false)
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm max-w-none focus:outline-none text-foreground/80 leading-relaxed tracking-normal",
          "min-h-[120px] text-base"
        ),
      },
      handleDOMEvents: {
        mousedown: (_view, event) => {
          suppressSuggestionRestoreRef.current = false
          // 记录点击位置，供 onBlur 判断是否需要收缩
          mousedownInsideEditorRef.current = _view.dom.contains(event.target as Node)
          // 点击编辑器外部时，关闭弹窗但标记不收缩
          if (!mousedownInsideEditorRef.current && isAnyDialogOpen) {
            collapseAfterPopupCloseRef.current = true
            resolvePendingLink(_view)
            closePasteMenu()
            setShowSuggestions(false)
          }
          return false
        },
        keydown: (_view, event) => {
          suppressSuggestionRestoreRef.current = false

          // ESC 关闭所有弹窗，不触发编辑器收缩
          if (event.key === "Escape" && isAnyDialogOpen) {
            event.preventDefault()
            resolvePendingLink(_view)
            closePasteMenu()
            setShowSuggestions(false)
            return true
          }

          return false
        },
      },
      handlePaste: (view, event) => {
        // 优先处理剪贴板中的图片文件
        const files = event.clipboardData?.files
        if (files && files.length > 0) {
          const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"))
          if (imageFiles.length > 0) {
            event.preventDefault()
            handleImageFiles(imageFiles)
            return true
          }
        }

        const text = event.clipboardData?.getData("text/plain")
        if (!text) return false

        const urlRegex = /^https?:\/\/[^\s]+$/
        if (!urlRegex.test(text.trim())) return false

        const url = text.trim()
        const { state, dispatch } = view
        const { selection } = state
        const { from } = selection

        // 立即插入待确认状态的节点
        const tr = state.tr.insert(
          from,
          state.schema.nodes.markupLink.create({
            id: url,
            label: url,
            isPending: true,
          })
        )
        tr.insert(from + 1, state.schema.text(" "))

        // 将光标移动到插入的内容之后
        const selectionAfter = TextSelection.create(tr.doc, from + 2)
        tr.setSelection(selectionAfter)

        dispatch(tr)

        // 获取并保存位置（由于插入了节点，位置是 from）
        setPendingPastePos(from)
        setPendingPasteUrl(url)
        setFetchedMeta(null)

        // 立即开始预获取元数据，节省时间
        fetchLinkMetadata(url).then((meta) => {
          setFetchedMeta(meta)
          const bestTitle = meta?.title || meta?.domain || deriveTitleFromUrl(url)
          if (editor) {
            // 更新节点显示标题（无论是否仍在 pending 状态）
            editor.state.doc.descendants((node, pos) => {
              if (node.type.name === "markupLink" && node.attrs.id === url) {
                editor.view.dispatch(
                  editor.state.tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    label: bestTitle,
                  })
                )
                return false
              }
              return true
            })
          }
        })

        // 获取粘贴位置的坐标显示菜单
        const coords = view.coordsAtPos(from)
        setPasteMenuPosition({
          top: coords.bottom,
          left: coords.left,
        })

        return true
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (files && files.length > 0) {
          const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"))
          if (imageFiles.length > 0) {
            event.preventDefault()
            handleImageFiles(imageFiles)
            return true
          }
        }
        return false
      },
    },
  })

  const focusEditorAtEnd = useCallback(() => {
    setIsFocused(true)
    window.requestAnimationFrame(() => {
      editor?.commands.focus("end")
    })
  }, [editor, setIsFocused])

  useEffect(() => {
    if (mode !== "create") {
      return
    }

    window.addEventListener("justmemo:focus-create-editor", focusEditorAtEnd)
    return () => {
      window.removeEventListener("justmemo:focus-create-editor", focusEditorAtEnd)
    }
  }, [focusEditorAtEnd, mode])

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    const editorDom = editor.view.dom

    const handleMenuChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>
      setIsMenuOpen(customEvent.detail.open)
    }

    const handleEditLink = (e: Event) => {
      const customEvent = e as CustomEvent<{
        title: string
        url: string
        mode: LinkRenderMode
        updateAttributes: (attrs: Record<string, string | boolean>) => void
      }>
      const { title, url, mode, updateAttributes } = customEvent.detail
      setEditingLinkInfo({ title, url, mode, updateAttributes })
      setShowLinkPicker(true)
    }

    editorDom.addEventListener("memo-internal-menu-change", handleMenuChange as EventListener)
    editorDom.addEventListener("edit-link", handleEditLink as EventListener)

    return () => {
      editorDom.removeEventListener("memo-internal-menu-change", handleMenuChange as EventListener)
      editorDom.removeEventListener("edit-link", handleEditLink as EventListener)
    }
  }, [editor, setIsMenuOpen, setShowLinkPicker])

  useEffect(() => {
    if (!isFocused || mode !== "create") {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const layoutContainer = editorContainerRef.current?.closest("section")
      const target = event.target as Node | null
      const isInsideEditor = Boolean(layoutContainer && target && layoutContainer.contains(target))

      if (!isInsideEditor && isInteractiveElement(target)) {
        setIsCollapseProtected(true)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [isFocused, mode])

  useEffect(() => {
    if (editor) {
      if (mode === "edit" && memo?.content) {
        editor.commands.setContent(textToTiptapHtml(memo.content))
      } else if (mode === "create") {
        const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY)
        if (draftContent && draftContent.trim() && editor.getText().trim() === "") {
          try {
            const json = JSON.parse(draftContent)
            editor.commands.setContent(json)
          } catch {
            editor.commands.setContent(textToTiptapHtml(draftContent))
          }
          setContent(editor.getText())
          setShowPlaceholder(false)
        } else {
          setShowPlaceholder(isPristineEmptyEditor(editor))
        }
      }
    }
  }, [editor, memo, mode, setContent])

  useEffect(() => {
    if (
      mode === "create" &&
      previousPendingRef.current &&
      !isPending &&
      content === "" &&
      images.length === 0 &&
      queuedImages.length === 0 &&
      isPristineEmptyEditor(editor)
    ) {
      setShowPlaceholder(true)
    }

    previousPendingRef.current = isPending
  }, [content, editor, images.length, isPending, mode, queuedImages.length])

  useEffect(() => {
    if (mode !== "create" || !editor) {
      return
    }

    setShowPlaceholder(
      content.trim() === "" &&
        images.length === 0 &&
        queuedImages.length === 0 &&
        isPristineEmptyEditor(editor)
    )
  }, [content, editor, images.length, mode, queuedImages.length])

  useEffect(() => {
    if (!editor || !pendingPasteUrl) {
      return
    }

    const syncPendingPasteMenu = () => {
      const pendingLink = findPendingMarkupLink(editor.state.doc, {
        url: pendingPasteUrl,
        pos: pendingPastePos,
      })

      if (pendingLink) {
        if (pendingLink.pos !== pendingPastePos) {
          setPendingPastePos(pendingLink.pos)
        }
        return
      }

      setPasteMenuPosition(null)
      setPendingPasteUrl(null)
      setPendingPastePos(null)
      setFetchedMeta(null)
    }

    syncPendingPasteMenu()
    editor.on("update", syncPendingPasteMenu)

    return () => {
      editor.off("update", syncPendingPasteMenu)
    }
  }, [editor, pendingPastePos, pendingPasteUrl])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setEnableCollapseAnimation(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    if (!editor) {
      return
    }

    const clearEditorUiState = () => {
      suppressSuggestionRestoreRef.current = true
      suggestionPropsRef.current = null
      setShowSuggestions(false)
      setIsFocused(false)
      setPasteMenuPosition(null)
      setPendingPasteUrl(null)
      setPendingPastePos(null)
      setFetchedMeta(null)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearEditorUiState()
        editor.commands.blur()
      }
    }

    window.addEventListener("pagehide", clearEditorUiState)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("pagehide", clearEditorUiState)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearEditorUiState()
      editor.commands.blur()
    }
  }, [editor, setIsFocused, setShowSuggestions, suggestionPropsRef])

  const handleToolbarCancel = () => {
    if (mode === "create") {
      editor?.commands.clearContent()
      editor?.commands.focus("end")
      setShowPlaceholder(true)
    }
    clearImageSessionState()
    handleCancel()
  }

  return (
    <MemoEditorLayout
      isActuallyCollapsed={isActuallyCollapsed}
      shouldAnimateCollapse={shouldAnimateCollapse}
      isFocused={isFocused}
      isPrivate={isPrivate}
      isPinned={isPinned}
      isPending={isPending || isPublishingQueuedImages}
      isUploadingImage={isUploading || isPublishingQueuedImages || isPending}
      content={content}
      uploadedImages={images}
      queuedImages={queuedImages}
      uploadingImages={uploadingImages}
      isDraggingImages={isDraggingImages}
      shakingQueuedId={shakingQueuedId}
      shakingUploadedUrl={shakingUploadedUrl}
      onRemoveImage={handleRemoveUploadedImage}
      onRemoveQueuedImage={handleRemoveQueuedImage}
      onAttachmentInteract={handleAttachmentInteract}
      mode={mode}
      showPlaceholder={showPlaceholder}
      showSuggestions={showSuggestions}
      showPrivateDialog={showPrivateDialog}
      accessCode={accessCode}
      setAccessCode={setAccessCode}
      accessHint={accessHint}
      setAccessHint={setAccessHint}
      showLocationPicker={showLocationPicker}
      showLinkPicker={showLinkPicker}
      error={error}
      suggestions={suggestions}
      selectedIndex={selectedIndex}
      isLoading={isLoading}
      hasMoreMentions={hasMoreMentions}
      mentionQuery={mentionQuery}
      suggestionPosition={suggestionPosition}
      pasteMenuPosition={pasteMenuPosition}
      pendingPasteUrl={pendingPasteUrl}
      isPendingPasteImageUrl={pendingPasteUrl ? isImageUrl(pendingPasteUrl) : false}
      fetchedMeta={fetchedMeta}
      editingLinkInfo={editingLinkInfo}
      editorContainerRef={editorContainerRef}
      relativeGroupRef={relativeGroupRef}
      fileInputRef={fileInputRef}
      editor={editor}
      onEditorClick={focusEditorAtEnd}
      onImageFilesSelect={handleImageFiles}
      onShowLocationPicker={() => setShowLocationPicker(true)}
      onShowLinkPicker={() => setShowLinkPicker(true)}
      onTogglePrivate={handleTogglePrivate}
      onTogglePinned={() => setIsPinned(!isPinned)}
      onImageUpload={handleImageButtonClick}
      onCancel={handleToolbarCancel}
      onPublish={() => {
        if (needsPrivateDialog) {
          setShowPrivateDialog(true)
        } else {
          handlePublishWithQueuedImages()
        }
      }}
      onSelectSuggestion={(item) => handleSelectSuggestion(item, editor)}
      onSuggestionScroll={handleSuggestionScroll}
      onLinkPasteClose={() => {
        if (pendingPasteUrl && editor) {
          const pendingLink = findPendingMarkupLink(editor.state.doc, {
            url: pendingPasteUrl,
            pos: pendingPastePos,
          })

          if (pendingLink) {
            const isImg = isImageUrl(pendingPasteUrl)

            if (isImg) {
              const deleteTo = getPendingLinkDeleteTo(editor.state.doc, pendingLink.pos)
              editor
                .chain()
                .deleteRange({
                  from: pendingLink.pos,
                  to: deleteTo,
                })
                .focus()
                .run()
              addImageUrlAttachment(pendingPasteUrl)
            } else {
              const finalTitle =
                fetchedMeta?.title || fetchedMeta?.domain || deriveTitleFromUrl(pendingPasteUrl)
              editor
                .chain()
                .setNodeSelection(pendingLink.pos)
                .updateAttributes("markupLink", {
                  isPending: false,
                  mode: "mention",
                  label: finalTitle,
                })
                .focus()
                .run()
            }
          }
        }
        closePasteMenu()
      }}
      onLinkPasteSelect={(linkMode) => {
        if (pendingPasteUrl && editor) {
          if (linkMode === "image") {
            const pendingLink = findPendingMarkupLink(editor.state.doc, {
              url: pendingPasteUrl,
              pos: pendingPastePos,
            })
            if (pendingLink) {
              const deleteTo = getPendingLinkDeleteTo(editor.state.doc, pendingLink.pos)
              editor
                .chain()
                .deleteRange({
                  from: pendingLink.pos,
                  to: deleteTo,
                })
                .focus()
                .run()
              addImageUrlAttachment(pendingPasteUrl)
            }
            closePasteMenu()
            return
          }

          const pendingLink = findPendingMarkupLink(editor.state.doc, {
            url: pendingPasteUrl,
            pos: pendingPastePos,
          })

          if (pendingLink) {
            const finalTitle =
              fetchedMeta?.title || fetchedMeta?.domain || deriveTitleFromUrl(pendingPasteUrl)

            editor
              .chain()
              .setNodeSelection(pendingLink.pos)
              .updateAttributes("markupLink", {
                isPending: false,
                mode: linkMode,
                label: finalTitle,
              })
              .setTextSelection(pendingLink.pos + 2)
              .focus()
              .run()
          }
        }
        closePasteMenu()
      }}
      onPrivateDialogOpenChange={(open) => {
        setShowPrivateDialog(open)
        if (!open) {
          setIsFocused(true)
          editor?.commands.focus()
        }
      }}
      onPrivateConfirm={() => {
        handlePublishWithQueuedImages()
      }}
      onLocationPickerOpenChange={(open) => {
        setShowLocationPicker(open)
        if (!open) {
          setIsFocused(true)
          editor?.commands.focus()
        }
      }}
      onLocationConfirm={(loc) =>
        editor
          ?.chain()
          .focus()
          .insertContent(loc + " ")
          .run()
      }
      onLinkPickerOpenChange={(open) => {
        setShowLinkPicker(open)
        if (!open) {
          setIsFocused(true)
          editor?.commands.focus()
          setEditingLinkInfo(null)
        }
      }}
      onLinkPickerConfirm={(title, url) => {
        if (editingLinkInfo) {
          const docText = editor?.getText({ blockSeparator: "\n" }) || ""
          const newDocText = replaceSmartLinkToken(docText, editingLinkInfo, {
            title,
            url,
          })

          if (newDocText) {
            editor?.commands.setContent(textToTiptapHtml(newDocText))
          }
        } else {
          editor
            ?.chain()
            .focus()
            .insertContent([
              {
                type: "markupLink",
                attrs: { id: url, label: title },
              },
              { type: "text", text: " " },
            ])
            .run()
        }
      }}
      className={className}
    />
  )
}
