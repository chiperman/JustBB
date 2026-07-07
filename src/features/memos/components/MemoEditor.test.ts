import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "MemoEditor.tsx")
const source = readFileSync(sourcePath, "utf8")
const imageAttachmentsHookSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../hooks/useEditorImageAttachments.ts"),
  "utf8"
)
const layoutSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "MemoEditorLayout.tsx"),
  "utf8"
)

describe("MemoEditor collapse animation", () => {
  it("does not disable collapse animation for scroll-triggered collapse", () => {
    expect(source).toMatch(/const shouldAnimateCollapse\s*=\s*enableCollapseAnimation\b/)
    expect(source).not.toMatch(
      /const shouldAnimateCollapse\s*=\s*enableCollapseAnimation\s*&&\s*!scrollCollapsed\b/
    )
  })

  it("解除 inert 折叠状态后再聚焦编辑器", () => {
    expect(layoutSource).toMatch(/aria-label="展开 Memo 编辑器"[\s\S]*?onClick=\{onEditorClick\}/)
    expect(source).toMatch(
      /const focusEditorAtEnd = useCallback\(\(\) => \{\s*setIsFocused\(true\)\s*window\.requestAnimationFrame\(\(\) => \{\s*editor\?\.commands\.focus\("end"\)/
    )
    expect(source).toContain("onEditorClick={focusEditorAtEnd}")
  })
})

describe("MemoEditor focus bridge", () => {
  it("仅在新建模式响应全局聚焦事件", () => {
    expect(source).toContain('"justmemo:focus-create-editor"')
    expect(source).toMatch(/if \(mode !== "create"\) \{\s*return\s*\}/)
    expect(source).toContain("window.addEventListener")
    expect(source).toContain("window.removeEventListener")
  })
})

describe("MemoEditor image upload", () => {
  it("支持从文件选择器、粘贴和拖拽一次添加多张待发布图片", () => {
    expect(source).toContain("useEditorImageAttachments")
    expect(source).toContain("onImageFilesSelect={handleImageFiles}")
    expect(layoutSource).toMatch(/type="file"[\s\S]*?multiple[\s\S]*?onImageFilesSelect\(files\)/)
    expect(imageAttachmentsHookSource).toMatch(/const imageFiles = Array\.from\(files\)\.filter/)
    expect(imageAttachmentsHookSource).toMatch(/setQueuedImages/)
    expect(imageAttachmentsHookSource).toMatch(/Promise\.all\([\s\S]*queuedImages\.map/)
    expect(imageAttachmentsHookSource).not.toMatch(/Array\.from\(files\)\.find/)
  })

  it("拖拽图片时显示编辑器上传区域", () => {
    expect(imageAttachmentsHookSource).toMatch(/setIsDraggingImages\(true\)/)
    expect(layoutSource).toContain("松开即可添加图片")
  })

  it("附件缩略图保持单行横向滚动，上传进度使用中性灰", () => {
    expect(layoutSource).toContain("flex-nowrap")
    expect(layoutSource).toContain("overflow-x-auto")
    expect(layoutSource).toContain("shrink-0")
    expect(layoutSource).toContain("stroke-zinc-200")
    expect(layoutSource).not.toContain('className="stroke-primary"')
  })

  it("点击预览或删除附件时不触发编辑器收缩", () => {
    expect(source).toMatch(/collapseAfterPopupCloseRef\.current\s*=\s*true/)
    expect(source).toContain("onAttachmentInteract={handleAttachmentInteract}")
    expect(layoutSource).toContain("onAttachmentInteract?.()")
    expect(layoutSource).toContain("onMouseDownCapture")
    expect(layoutSource).not.toContain("setPointerCapture")
  })

  it("待发布徽标不拦截小图预览点击", () => {
    expect(layoutSource).toContain("pointer-events-none absolute bottom-1 left-1")
  })

  it("发布时直接在待发布图片上显示上传进度", () => {
    expect(imageAttachmentsHookSource).toMatch(
      /setQueuedImages\([\s\S]*progress: 0[\s\S]*isUploading: true/
    )
    expect(imageAttachmentsHookSource).toMatch(
      /handleImageFileUpload\(image\.file, \{ id: image\.id/
    )
    expect(imageAttachmentsHookSource).toContain("handleLinkedImageUpload")
    expect(layoutSource).toContain('img.publishStatus === "uploading"')
    expect(layoutSource).toContain('img.publishStatus === "saving"')
    expect(layoutSource).toContain("transition-[width]")
  })

  it("在上传照片时，支持通过哈希进行防重和去重校验", () => {
    expect(imageAttachmentsHookSource).toContain("calculateFileHash")
    expect(imageAttachmentsHookSource).toContain("uploadedImageHashesRef")
    expect(imageAttachmentsHookSource).toContain("shakingQueuedId")
    expect(imageAttachmentsHookSource).toContain("shakingUploadedUrl")
    expect(layoutSource).toContain("animate-shake-highlight")
  })
})
