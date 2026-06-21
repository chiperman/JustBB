/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { motion } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { EditorContent } from "@tiptap/react"
import { EditorSuggestionMenu } from "@/features/memos/components/EditorSuggestionMenu"
import { MemoPrivateDialog } from "@/features/memos/components/MemoPrivateDialog"
import { LocationPickerDialog } from "@/features/memos/components/LocationPickerDialog"
import { LinkPickerDialog } from "@/features/memos/components/LinkPickerDialog"
import { EditorToolbar } from "@/features/memos/components/editor/EditorToolbar"
import { LinkPasteMenu } from "@/features/memos/components/editor/LinkPasteMenu"
import type { LinkRenderMode } from "@/features/memos/components/editor/smartLink"
import { PLACEHOLDER_TEXT } from "@/features/memos/components/MemoEditor"
import { useLayout } from "@/state/LayoutContext"
import { ImageZoom } from "@/shared/ui/ImageZoom"
import { SmartImage } from "@/shared/ui/SmartImage"

export interface SuggestionItem {
  id: string
  label: string
}

export interface MemoEditorLayoutProps {
  // State
  isActuallyCollapsed: boolean
  shouldAnimateCollapse: boolean
  isFocused: boolean
  isPrivate: boolean
  isPinned: boolean
  isPending: boolean
  isUploadingImage: boolean
  content: string
  mode: "create" | "edit"
  showPlaceholder: boolean
  showSuggestions: boolean
  showPrivateDialog: boolean
  accessCode: string
  setAccessCode: (code: string) => void
  accessHint: string
  setAccessHint: (hint: string) => void
  showLocationPicker: boolean
  showLinkPicker: boolean
  error: string | null
  isDraggingImages: boolean
  suggestions: SuggestionItem[]
  selectedIndex: number
  isLoading: boolean
  hasMoreMentions: boolean
  mentionQuery: string
  suggestionPosition: { top: number; left: number } | null
  pasteMenuPosition: { top: number; left: number } | null
  pendingPasteUrl: string | null
  isPendingPasteImageUrl: boolean
  fetchedMeta: { title: string | null; domain: string | null } | null
  editingLinkInfo: {
    title: string
    url: string
    mode: LinkRenderMode
    updateAttributes: (attrs: Record<string, string | boolean>) => void
  } | null

  // Refs
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  relativeGroupRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  editor: Editor | null

  // Callbacks
  onEditorClick: () => void
  onImageFilesSelect: (files: File[]) => void
  onShowLocationPicker: () => void
  onShowLinkPicker: () => void
  onTogglePrivate: () => void
  onTogglePinned: () => void
  onImageUpload: () => void
  onCancel: () => void
  onPublish: () => void
  onSelectSuggestion: (item: SuggestionItem) => void
  onSuggestionScroll: (e: React.UIEvent<HTMLUListElement>) => void
  onLinkPasteClose: () => void
  onLinkPasteSelect: (mode: LinkRenderMode) => void
  onPrivateDialogOpenChange: (open: boolean) => void
  onPrivateConfirm: () => void
  onLocationPickerOpenChange: (open: boolean) => void
  onLocationConfirm: (loc: string) => void
  onLinkPickerOpenChange: (open: boolean) => void
  onLinkPickerConfirm: (title: string, url: string) => void
  onAttachmentInteract?: () => void

  // Optional
  className?: string
  uploadedImages?: string[]
  queuedImages?: { id: string; previewUrl: string; progress?: number; isUploading?: boolean }[]
  uploadingImages?: { id: string; previewUrl: string; progress: number }[]
  onRemoveImage?: (url: string) => void
  onRemoveQueuedImage?: (id: string) => void
}

export function MemoEditorLayout({
  isActuallyCollapsed,
  shouldAnimateCollapse,
  isFocused,
  isPrivate,
  isPinned,
  isPending,
  isUploadingImage,
  content,
  mode,
  showPlaceholder,
  showSuggestions,
  showPrivateDialog,
  accessCode,
  setAccessCode,
  accessHint,
  setAccessHint,
  showLocationPicker,
  showLinkPicker,
  error,
  isDraggingImages,
  suggestions,
  selectedIndex,
  isLoading,
  hasMoreMentions,
  mentionQuery,
  suggestionPosition,
  pasteMenuPosition,
  pendingPasteUrl,
  isPendingPasteImageUrl,
  fetchedMeta,
  editingLinkInfo,
  editorContainerRef,
  relativeGroupRef,
  fileInputRef,
  editor,
  onEditorClick,
  onImageFilesSelect,
  onShowLocationPicker,
  onShowLinkPicker,
  onTogglePrivate,
  onTogglePinned,
  onImageUpload,
  onCancel,
  onPublish,
  onSelectSuggestion,
  onSuggestionScroll,
  onLinkPasteClose,
  onLinkPasteSelect,
  onPrivateDialogOpenChange,
  onPrivateConfirm,
  onLocationPickerOpenChange,
  onLocationConfirm,
  onLinkPickerOpenChange,
  onLinkPickerConfirm,
  onAttachmentInteract,
  className,
  uploadedImages,
  queuedImages,
  uploadingImages,
  onRemoveImage,
  onRemoveQueuedImage,
}: MemoEditorLayoutProps) {
  const { animationMultiplier } = useLayout()
  const attachmentStripRef = React.useRef<HTMLDivElement>(null)
  const hasImageAttachments =
    Boolean(uploadedImages?.length) ||
    Boolean(queuedImages?.length) ||
    Boolean(uploadingImages?.length)
  const attachmentDragRef = React.useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  })

  const handleAttachmentPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onAttachmentInteract?.()
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return

    const strip = attachmentStripRef.current
    if (!strip) return

    attachmentDragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: strip.scrollLeft,
    }
  }

  const handleAttachmentPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = attachmentDragRef.current
    const strip = attachmentStripRef.current
    if (!drag.active || !strip) return

    const deltaX = event.clientX - drag.startX
    if (Math.abs(deltaX) > 4) {
      drag.moved = true
    }

    strip.scrollLeft = drag.scrollLeft - deltaX
  }

  const stopAttachmentDrag = () => {
    attachmentDragRef.current.active = false
  }

  const handleAttachmentClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!attachmentDragRef.current.moved) return

    event.preventDefault()
    event.stopPropagation()
    attachmentDragRef.current.moved = false
  }

  return (
    <motion.section
      initial={false}
      animate={{
        opacity: 1,
        height: isActuallyCollapsed ? "auto" : "auto",
        minHeight: isActuallyCollapsed ? 0 : 120,
        padding: 24,
        boxShadow: isActuallyCollapsed ? "none" : "",
      }}
      exit={{
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        borderWidth: 0,
        boxShadow: "none",
        transition: {
          opacity: { duration: shouldAnimateCollapse ? 0.2 * animationMultiplier : 0 },
          height: {
            duration: shouldAnimateCollapse ? 0.3 * animationMultiplier : 0,
            ease: [0.22, 1, 0.36, 1],
          },
          paddingTop: { duration: shouldAnimateCollapse ? 0.3 * animationMultiplier : 0 },
          paddingBottom: { duration: shouldAnimateCollapse ? 0.3 * animationMultiplier : 0 },
          borderWidth: { duration: shouldAnimateCollapse ? 0.3 * animationMultiplier : 0 },
        },
      }}
      transition={{
        height: isActuallyCollapsed
          ? shouldAnimateCollapse
            ? {
                type: "spring",
                stiffness: 350 / (animationMultiplier * animationMultiplier),
                damping: 40 / animationMultiplier,
              }
            : { duration: 0 }
          : shouldAnimateCollapse
            ? { duration: 0.4 * animationMultiplier, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0 },
        opacity: { duration: shouldAnimateCollapse ? 0.2 * animationMultiplier : 0 },
      }}
      onAnimationStart={() => undefined}
      onAnimationComplete={() => undefined}
      style={{
        willChange: "transform, height, opacity",
        overflow: isActuallyCollapsed || false ? "hidden" : "visible",
      }}
      className={cn(
        "border border-border rounded-lg relative flex flex-col items-stretch selection:bg-primary/30",
        isActuallyCollapsed && "hover:bg-secondary",
        className
      )}
    >
      {isActuallyCollapsed && (
        <button
          type="button"
          aria-label="展开 Memo 编辑器"
          className="absolute inset-0 z-20 rounded-lg bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onEditorClick}
        />
      )}

      <motion.div
        className="absolute inset-0 bg-card rounded-lg pointer-events-none"
        animate={{ opacity: isActuallyCollapsed ? 0 : 1 }}
        transition={{ duration: shouldAnimateCollapse ? 0.2 : 0 }}
      />

      {isDraggingImages && (
        <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-lg border border-dashed border-primary/55 bg-background/85 backdrop-blur-sm">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 text-center",
              isActuallyCollapsed ? "py-1.5" : "flex-col py-4"
            )}
          >
            <span className="text-sm font-semibold text-foreground">松开即可添加图片</span>
            {!isActuallyCollapsed && (
              <span className="text-xs text-muted-foreground">图片会在发布 Memo 时上传</span>
            )}
          </div>
        </div>
      )}

      <div
        className="w-full flex-1 flex flex-col min-h-0"
        inert={isActuallyCollapsed}
        aria-hidden={isActuallyCollapsed}
      >
        <div ref={relativeGroupRef} className="relative group w-full flex-1 flex flex-col min-h-0">
          <motion.div
            ref={editorContainerRef}
            animate={{
              height: isActuallyCollapsed ? 26 : "auto",
              minHeight: isActuallyCollapsed ? 0 : 120,
            }}
            transition={{
              height: shouldAnimateCollapse
                ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 },
              minHeight: { duration: shouldAnimateCollapse ? 0.35 : 0 },
            }}
            className={cn(
              "relative",
              isActuallyCollapsed
                ? "min-h-0 scrollbar-hide overflow-hidden"
                : "overflow-y-auto scrollbar-hover"
            )}
            style={{
              maxHeight: 500,
              maskImage: isActuallyCollapsed
                ? "linear-gradient(to bottom, black 90%, transparent 100%)"
                : "none",
            }}
          >
            {/* 占位符 Overlay - 仅在编辑器处于初始空白态时显示 */}
            {showPlaceholder && (
              <div className="absolute inset-x-0 top-0 h-[26px] flex items-center px-0 pointer-events-none z-10 transition-opacity duration-200">
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isActuallyCollapsed ? "text-muted-foreground/30" : "text-muted-foreground/40"
                  )}
                >
                  {PLACEHOLDER_TEXT}
                </span>
              </div>
            )}
            <EditorContent editor={editor} className="flex-1 flex flex-col min-h-0" />

            {/* 上传图片缩略图展示区 */}
            {hasImageAttachments && (
              <div
                ref={attachmentStripRef}
                className="flex flex-nowrap gap-2 mt-3 mb-1 select-none relative z-10 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hover cursor-grab active:cursor-grabbing"
                onPointerDown={handleAttachmentPointerDown}
                onPointerMove={handleAttachmentPointerMove}
                onPointerUp={stopAttachmentDrag}
                onPointerCancel={stopAttachmentDrag}
                onClickCapture={handleAttachmentClickCapture}
                onMouseDownCapture={() => onAttachmentInteract?.()}
              >
                {/* 已上传图片 */}
                {uploadedImages &&
                  uploadedImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden ring-1 ring-border group/img"
                    >
                      <ImageZoom
                        src={url}
                        groupImages={uploadedImages}
                        currentGroupIndex={idx}
                        alt="Uploaded attachment"
                        className="w-full h-full"
                        noHoverScale
                      >
                        <SmartImage
                          src={url}
                          alt="Uploaded attachment"
                          containerClassName="w-full h-full min-h-0"
                          fallbackClassName="rounded-md"
                          className="w-full h-full object-cover cursor-zoom-in"
                        />
                      </ImageZoom>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAttachmentInteract?.()
                          onRemoveImage?.(url)
                        }}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-100 md:opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-5 h-5 border-none z-20"
                        title="移除图片"
                      >
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                {/* 待发布图片 */}
                {queuedImages &&
                  queuedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden ring-1 ring-border group/img"
                    >
                      <ImageZoom
                        src={img.previewUrl}
                        groupImages={queuedImages.map((q) => q.previewUrl)}
                        currentGroupIndex={idx}
                        alt="Queued attachment"
                        className="w-full h-full"
                        noHoverScale
                      >
                        <SmartImage
                          src={img.previewUrl}
                          alt="Queued attachment"
                          containerClassName="w-full h-full min-h-0"
                          fallbackClassName="rounded-md"
                          className="w-full h-full object-cover cursor-zoom-in"
                        />
                      </ImageZoom>
                      <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        {img.isUploading ? "上传中" : "待发布"}
                      </span>
                      {img.isUploading && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[0.5px]">
                          <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                className="stroke-zinc-200/35"
                                strokeWidth="2.5"
                                fill="transparent"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                className="stroke-zinc-200"
                                strokeWidth="2.5"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 16}
                                strokeDashoffset={
                                  2 * Math.PI * 16 * (1 - (img.progress ?? 0) / 100)
                                }
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-[10px] font-semibold text-zinc-100">
                              {img.progress ?? 0}%
                            </span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAttachmentInteract?.()
                          onRemoveQueuedImage?.(img.id)
                        }}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-100 md:opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-5 h-5 border-none z-20"
                        title="移除图片"
                      >
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                {/* 正在上传图片 */}
                {uploadingImages &&
                  uploadingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden ring-1 ring-border bg-muted flex items-center justify-center"
                    >
                      <img
                        src={img.previewUrl}
                        alt="Uploading preview"
                        className="w-full h-full object-cover opacity-60 blur-[0.5px]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[0.5px]">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              className="stroke-zinc-200/35"
                              strokeWidth="2.5"
                              fill="transparent"
                            />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              className="stroke-zinc-200"
                              strokeWidth="2.5"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - img.progress / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-semibold text-zinc-100">
                            {img.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>

          {showSuggestions && (
            <EditorSuggestionMenu
              suggestions={suggestions}
              selectedIndex={selectedIndex}
              isLoading={isLoading}
              hasMore={hasMoreMentions}
              query={mentionQuery}
              position={suggestionPosition}
              onSelect={(item) => onSelectSuggestion(item)}
              onScroll={onSuggestionScroll}
            />
          )}

          <LinkPasteMenu
            position={pasteMenuPosition}
            isImageUrl={isPendingPasteImageUrl}
            onClose={onLinkPasteClose}
            onSelect={onLinkPasteSelect}
          />
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-500 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">
            {error}
          </div>
        )}

        <EditorToolbar
          isActuallyCollapsed={isActuallyCollapsed}
          animateStateChanges={shouldAnimateCollapse}
          isPrivate={isPrivate}
          isPinned={isPinned}
          isPending={isPending}
          isUploadingImage={isUploadingImage}
          content={content}
          hasImages={hasImageAttachments}
          mode={mode}
          onTogglePrivate={onTogglePrivate}
          onTogglePinned={onTogglePinned}
          onShowLocationPicker={onShowLocationPicker}
          onShowLinkPicker={onShowLinkPicker}
          onImageUpload={onImageUpload}
          onCancel={onCancel}
          onPublish={onPublish}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) {
              onImageFilesSelect(files)
              e.target.value = ""
            }
          }}
        />
      </div>

      <MemoPrivateDialog
        open={showPrivateDialog}
        onOpenChange={(open) => {
          onPrivateDialogOpenChange(open)
          if (!open) {
            // MemoEditor 不传 setIsFocused 给 Layout，此处回调由 MemoEditor 处理
          }
        }}
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        accessHint={accessHint}
        setAccessHint={setAccessHint}
        onConfirm={onPrivateConfirm}
      />

      <LocationPickerDialog
        open={showLocationPicker}
        onOpenChange={(open) => {
          onLocationPickerOpenChange(open)
        }}
        onConfirm={onLocationConfirm}
      />

      <LinkPickerDialog
        open={showLinkPicker}
        onOpenChange={(open) => {
          onLinkPickerOpenChange(open)
        }}
        mode={editingLinkInfo ? "edit" : "create"}
        initialTitle={editingLinkInfo?.title}
        initialUrl={editingLinkInfo?.url}
        onConfirm={onLinkPickerConfirm}
      />
    </motion.section>
  )
}
