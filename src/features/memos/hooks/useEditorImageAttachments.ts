"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { toast } from "@/shared/hooks/use-toast"
import type { ImageMetadata } from "@/types/memo"
import { useImageUpload, type UploadedImage } from "@/features/memos/hooks/useImageUpload"

export type LocalImageAttachment = {
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

interface UseEditorImageAttachmentsOptions {
  images: string[]
  setImages: Dispatch<SetStateAction<string[]>>
  imageMetadata: ImageMetadata
  setImageMetadata: Dispatch<SetStateAction<ImageMetadata>>
}

export function useEditorImageAttachments({
  images,
  setImages,
  imageMetadata,
  setImageMetadata,
}: UseEditorImageAttachmentsOptions) {
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
            // 忽略哈希失败，上传结果本身仍然有效
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

      if (newImagesToAdd.some((img) => img.hash === hash)) {
        duplicateCount++
        continue
      }

      const existingQueued = queuedImagesRef.current.find((img) => img.hash === hash)
      if (existingQueued) {
        duplicateCount++
        matchedQueuedId = existingQueued.id
        continue
      }

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

  const resetQueuedImagesPublishState = useCallback(() => {
    setQueuedImages((prev) =>
      prev.map((image) => ({
        ...image,
        isUploading: false,
        publishStatus: "queued",
      }))
    )
  }, [])

  return {
    queuedImages,
    uploadingImages,
    isDraggingImages,
    isPublishingQueuedImages,
    isUploading,
    shakingQueuedId,
    shakingUploadedUrl,
    handleImageFiles,
    handleRemoveUploadedImage,
    addImageUrlAttachment,
    handleRemoveQueuedImage,
    clearImageSessionState,
    uploadQueuedImages,
    resetQueuedImagesPublishState,
  }
}
