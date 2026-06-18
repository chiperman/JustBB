/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type { RefObject } from "react"
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
  onImageFileSelect: (file: File) => void
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

  // Optional
  className?: string
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
  onImageFileSelect,
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
  className,
}: MemoEditorLayoutProps) {
  const { animationMultiplier } = useLayout()
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
          onClick={() => editor?.commands.focus("end")}
        />
      )}

      <motion.div
        className="absolute inset-0 bg-card rounded-lg pointer-events-none"
        animate={{ opacity: isActuallyCollapsed ? 0 : 1 }}
        transition={{ duration: shouldAnimateCollapse ? 0.2 : 0 }}
      />

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
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onImageFileSelect(file)
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
