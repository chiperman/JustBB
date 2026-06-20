"use client"

import { useState, useCallback } from "react"

const MAX_SIZE = 2 * 1024 * 1024 // 超过 2MB 压缩
const MAX_DIMENSION = 2048 // 最大宽/高

type UploadResponse = {
  url: string
  warning?: string | null
}

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
  const [pendingUploads, setPendingUploads] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<{ url: string | null; error: string | null; warning?: string | null }> => {
      setPendingUploads((count) => count + 1)
      setError(null)

      try {
        const processed = await compressImage(file)

        const formData = new FormData()
        formData.append("file", processed)

        const response = await new Promise<UploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open("POST", "/api/upload")

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                onProgress(percentComplete)
              }
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const parsed = JSON.parse(xhr.responseText)
                if (typeof parsed.url !== "string") {
                  reject(new Error("上传响应缺少图片地址"))
                  return
                }
                resolve(parsed)
              } catch (e) {
                reject(new Error("解析响应失败"))
              }
            } else {
              try {
                const response = JSON.parse(xhr.responseText)
                reject(new Error(response.error || `上传失败: ${xhr.status}`))
              } catch (e) {
                reject(new Error(`上传失败: ${xhr.status}`))
              }
            }
          }

          xhr.onerror = () => {
            reject(new Error("网络错误，上传失败"))
          }

          xhr.send(formData)
        })

        return { url: response.url, error: null, warning: response.warning ?? null }
      } catch (err) {
        const message = err instanceof Error ? err.message : "上传失败"
        setError(message)
        return { url: null, error: message }
      } finally {
        setPendingUploads((count) => Math.max(0, count - 1))
      }
    },
    []
  )

  return { uploadFile, isUploading: pendingUploads > 0, error }
}
