"use client"

import { useState, useCallback } from "react"

const MAX_SIZE = 2 * 1024 * 1024 // 超过 2MB 压缩
const MAX_DIMENSION = 2048 // 最大宽/高

async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_SIZE) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
  })

  if (blob.size >= file.size) {
    return file
  }

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  })
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (
      file: File
    ): Promise<{ url: string | null; error: string | null }> => {
      setIsUploading(true)
      setError(null)

      try {
        const processed = await compressImage(file)

        const formData = new FormData()
        formData.append("file", processed)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "上传失败")
        }

        const { url } = await res.json()
        return { url, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : "上传失败"
        setError(message)
        return { url: null, error: message }
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  return { uploadFile, isUploading, error }
}
