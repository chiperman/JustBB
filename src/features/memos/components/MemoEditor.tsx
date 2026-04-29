"use client"

import { useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import { motion } from "framer-motion"
import { TextSelection } from "@tiptap/pm/state"

import { EditorSuggestionMenu } from "@/features/memos/components/EditorSuggestionMenu"
import { MemoPrivateDialog } from "@/features/memos/components/MemoPrivateDialog"
import { LocationPickerDialog } from "@/features/memos/components/LocationPickerDialog"
import { LinkPickerDialog } from "@/features/memos/components/LinkPickerDialog"
import { EditorToolbar } from "@/features/memos/components/editor/EditorToolbar"
import {
  getExtensions,
  textToTiptapHtml,
} from "@/features/memos/components/editor/extensions"
import { fetchLinkMetadata } from "@/lib/link-preview"
import { LinkPasteMenu } from "@/features/memos/components/editor/LinkPasteMenu"
import {
  findPendingMarkupLink,
  replaceSmartLinkToken,
  type LinkRenderMode,
} from "@/features/memos/components/editor/smartLink"
import { useState } from "react"

import {
  useMemoEditor,
  DRAFT_CONTENT_KEY,
} from "@/features/memos/hooks/useMemoEditor"
import {
  useEditorSuggestions,
  CustomSuggestionProps,
} from "@/features/memos/hooks/useEditorSuggestions"
import { Memo } from "@/types/memo"

interface MemoEditorProps {
  mode?: "create" | "edit"
  memo?: Memo
  onCancel?: () => void
  onSuccess?: (memo?: Memo) => void
  isCollapsed?: boolean
  scrollCollapsed?: boolean
  className?: string
}

const PLACEHOLDER_TEXT = "Wanna memo something? JustMemo it!"

function isPristineEmptyEditor(editor: Editor | null) {
  if (!editor) {
    return true
  }

  const { doc } = editor.state
  const firstChild = doc.firstChild

  return (
    doc.childCount === 1 &&
    firstChild?.type.name === "paragraph" &&
    firstChild.childCount === 0
  )
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

  const {
    content,
    setContent,
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
    handleTogglePrivate,
    performPublish,
    handleCancel,
  } = useMemoEditor({ mode, initialMemo: memo, onSuccess, onCancel })

  // 智能链接系统相关状态
  const [pasteMenuPosition, setPasteMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const [pendingPasteUrl, setPendingPasteUrl] = useState<string | null>(null)
  const [pendingPastePos, setPendingPastePos] = useState<number | null>(null)
  const [fetchedMeta, setFetchedMeta] = useState<{
    title: string | null
    domain: string | null
  } | null>(null)
  const [showPlaceholder, setShowPlaceholder] = useState(mode === "create")
  const [enableCollapseAnimation, setEnableCollapseAnimation] = useState(false)
  const [editingLinkInfo, setEditingLinkInfo] = useState<{
    title: string
    url: string
    mode: LinkRenderMode
    updateAttributes: (attrs: Record<string, string | boolean>) => void
  } | null>(null)

  const {
    suggestions,
    showSuggestions,
    setShowSuggestions,
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
  } = useEditorSuggestions()

  const isActuallyCollapsed =
    (isPropCollapsed || scrollCollapsed) &&
    !isFocused &&
    !isAnyDialogOpen &&
    mode === "create"
  const shouldAnimateCollapse = enableCollapseAnimation && !scrollCollapsed
  const needsPrivateDialog =
    isPrivate && (mode === "create" || !memo?.is_private)

  const extensions = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      getExtensions({
        shouldAllowMentionSuggestion: () =>
          !suppressSuggestionRestoreRef.current,
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
              const label = item.label.startsWith("@")
                ? item.label.slice(1)
                : item.label
              suggestionPropsRef.current.command({ id: label, label: label })
              props.event.preventDefault()
              props.event.stopPropagation()
              return true
            }
          }
          return false
        },
        shouldAllowHashtagSuggestion: () =>
          !suppressSuggestionRestoreRef.current,
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
              const label = rawLabel.startsWith("#")
                ? rawLabel.slice(1)
                : rawLabel
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
      }
      setContent(text)
      setError(null)
      if (mode === "create") {
        localStorage.setItem(
          DRAFT_CONTENT_KEY,
          JSON.stringify(editor.getJSON())
        )
      }
    },
    onFocus: () => {
      setIsFocused(true)

      if (suppressSuggestionRestoreRef.current) {
        return
      }

      setTimeout(() => {
        if (!editor) return
        const { from } = editor.state.selection
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, from - 20),
          from
        )
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
      // 如果是因为切换程序导致的窗口失焦，则保持展开状态，避免用户切回时看到“跳动”
      if (document.hasFocus()) {
        setIsFocused(false)
        setShowSuggestions(false)
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
        mousedown: () => {
          suppressSuggestionRestoreRef.current = false
          return false
        },
        keydown: () => {
          suppressSuggestionRestoreRef.current = false
          return false
        },
      },
      handlePaste: (view, event) => {
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
        })

        // 获取粘贴位置的坐标显示菜单
        const coords = view.coordsAtPos(from)
        setPasteMenuPosition({
          top: coords.bottom,
          left: coords.left,
        })

        return true
      },
    },
  })

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

    editorDom.addEventListener(
      "memo-internal-menu-change",
      handleMenuChange as EventListener
    )
    editorDom.addEventListener("edit-link", handleEditLink as EventListener)

    return () => {
      editorDom.removeEventListener(
        "memo-internal-menu-change",
        handleMenuChange as EventListener
      )
      editorDom.removeEventListener(
        "edit-link",
        handleEditLink as EventListener
      )
    }
  }, [editor, setIsMenuOpen, setShowLinkPicker])

  const prevScrollCollapsed = useRef(scrollCollapsed)

  // 监听滚动收缩信号，如果在聚焦状态下发生深滚，主动失焦以触发收缩
  useEffect(() => {
    // 只有当 scrollCollapsed 从 false 变为 true 的“入场瞬间”且正在聚焦时才触发 blur
    if (
      scrollCollapsed &&
      !prevScrollCollapsed.current &&
      isFocused &&
      mode === "create" &&
      editor
    ) {
      editor.commands.blur()
    }
    prevScrollCollapsed.current = scrollCollapsed
  }, [scrollCollapsed, isFocused, editor, mode])

  useEffect(() => {
    if (editor) {
      if (mode === "edit" && memo?.content) {
        editor.commands.setContent(textToTiptapHtml(memo.content))
      } else if (mode === "create") {
        const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY)
        if (
          draftContent &&
          draftContent.trim() &&
          editor.getText().trim() === ""
        ) {
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
      isPristineEmptyEditor(editor)
    ) {
      setShowPlaceholder(true)
    }

    previousPendingRef.current = isPending
  }, [content, editor, isPending, mode])

  useEffect(() => {
    if (mode !== "create" || !editor) {
      return
    }

    setShowPlaceholder(content.trim() === "" && isPristineEmptyEditor(editor))
  }, [content, editor, mode])

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
      editor?.commands.blur()
      setShowPlaceholder(true)
    }
    handleCancel()
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
        marginTop: -24,
        marginBottom: -24,
        borderWidth: 0,
        boxShadow: "none",
        transition: {
          opacity: { duration: shouldAnimateCollapse ? 0.2 : 0 },
          height: {
            duration: shouldAnimateCollapse ? 0.3 : 0,
            ease: [0.22, 1, 0.36, 1],
          },
          paddingTop: { duration: shouldAnimateCollapse ? 0.3 : 0 },
          paddingBottom: { duration: shouldAnimateCollapse ? 0.3 : 0 },
          marginTop: { duration: shouldAnimateCollapse ? 0.3 : 0 },
          marginBottom: { duration: shouldAnimateCollapse ? 0.3 : 0 },
          borderWidth: { duration: shouldAnimateCollapse ? 0.3 : 0 },
        },
      }}
      transition={{
        height: isActuallyCollapsed
          ? shouldAnimateCollapse
            ? { type: "spring", stiffness: 350, damping: 40 }
            : { duration: 0 }
          : shouldAnimateCollapse
            ? { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0 },
        opacity: { duration: shouldAnimateCollapse ? 0.2 : 0 },
      }}
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      style={{
        willChange: "transform, height, opacity",
        overflow: isActuallyCollapsed || isAnimating ? "hidden" : "visible",
      }}
      className={cn(
        "border border-border rounded-lg relative flex flex-col items-stretch selection:bg-primary/30",
        isActuallyCollapsed && "-none cursor-pointer hover:bg-secondary",
        className
      )}
      onClick={() => {
        if (isActuallyCollapsed && editor) {
          const selection = window.getSelection()
          if (!selection || selection.toString().length === 0) {
            editor.commands.focus("end")
          }
        }
      }}
    >
      <motion.div
        className="absolute inset-0 bg-card rounded-lg pointer-events-none"
        animate={{ opacity: isActuallyCollapsed ? 0 : 1 }}
        transition={{ duration: shouldAnimateCollapse ? 0.2 : 0 }}
      />

      <div className="w-full flex-1 flex flex-col min-h-0">
        <div
          ref={relativeGroupRef}
          className="relative group w-full flex-1 flex flex-col min-h-0"
        >
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
                    isActuallyCollapsed
                      ? "text-muted-foreground/30"
                      : "text-muted-foreground/40"
                  )}
                >
                  {PLACEHOLDER_TEXT}
                </span>
              </div>
            )}
            <EditorContent
              editor={editor}
              className="flex-1 flex flex-col min-h-0"
            />
          </motion.div>

          {showSuggestions && (
            <EditorSuggestionMenu
              suggestions={suggestions}
              selectedIndex={selectedIndex}
              isLoading={isLoading}
              hasMore={hasMoreMentions}
              query={mentionQuery}
              position={suggestionPosition}
              onSelect={(item) => handleSelectSuggestion(item, editor)}
              onScroll={handleSuggestionScroll}
            />
          )}

          <LinkPasteMenu
            position={pasteMenuPosition}
            onClose={() => {
              // 如果关闭了菜单但没有选择，则保持 pending 状态或者转为默认
              // 这里我们选择转为默认 mention 模式并取消 pending
              if (pendingPasteUrl && editor) {
                const pendingLink = findPendingMarkupLink(editor.state.doc, {
                  url: pendingPasteUrl,
                  pos: pendingPastePos,
                })

                if (pendingLink) {
                  editor
                    .chain()
                    .setNodeSelection(pendingLink.pos)
                    .updateAttributes("markupLink", {
                      isPending: false,
                      mode: "mention",
                    })
                    .focus()
                    .run()
                }
              }
              setPasteMenuPosition(null)
              setPendingPasteUrl(null)
              setPendingPastePos(null)
              setFetchedMeta(null)
            }}
            onSelect={(mode) => {
              if (pendingPasteUrl && editor) {
                const pendingLink = findPendingMarkupLink(editor.state.doc, {
                  url: pendingPasteUrl,
                  pos: pendingPastePos,
                })

                if (pendingLink) {
                  const finalTitle =
                    fetchedMeta?.title || fetchedMeta?.domain || pendingPasteUrl

                  editor
                    .chain()
                    .setNodeSelection(pendingLink.pos)
                    .updateAttributes("markupLink", {
                      isPending: false,
                      mode,
                      label: finalTitle, // 如果已经获取到了，直接填入
                    })
                    .setTextSelection(pendingLink.pos + 2)
                    .focus()
                    .run()

                  // 如果还没获取到，则等待并更新
                  if (!fetchedMeta) {
                    fetchLinkMetadata(pendingPasteUrl).then((meta) => {
                      const asyncTitle =
                        meta?.title || meta?.domain || pendingPasteUrl
                      editor.state.doc.descendants((node, pos) => {
                        if (
                          node.type.name === "markupLink" &&
                          node.attrs.id === pendingPasteUrl &&
                          !node.attrs.isPending
                        ) {
                          editor.view.dispatch(
                            editor.state.tr.setNodeMarkup(pos, undefined, {
                              ...node.attrs,
                              label: asyncTitle,
                            })
                          )
                          return false
                        }
                        return true
                      })
                    })
                  }
                }
              }
              setPasteMenuPosition(null)
              setPendingPasteUrl(null)
              setPendingPastePos(null)
              setFetchedMeta(null)
            }}
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
          content={content}
          mode={mode}
          onTogglePrivate={handleTogglePrivate}
          onTogglePinned={() => setIsPinned(!isPinned)}
          onShowLocationPicker={() => setShowLocationPicker(true)}
          onShowLinkPicker={() => setShowLinkPicker(true)}
          onCancel={handleToolbarCancel}
          onPublish={() =>
            needsPrivateDialog
              ? setShowPrivateDialog(true)
              : performPublish(editor)
          }
        />
      </div>

      <MemoPrivateDialog
        open={showPrivateDialog}
        onOpenChange={(open) => {
          setShowPrivateDialog(open)
          if (!open) {
            setIsFocused(true)
            editor?.commands.focus()
          }
        }}
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        accessHint={accessHint}
        setAccessHint={setAccessHint}
        onConfirm={() => performPublish(editor)}
      />

      <LocationPickerDialog
        open={showLocationPicker}
        onOpenChange={(open) => {
          setShowLocationPicker(open)
          if (!open) {
            setIsFocused(true)
            editor?.commands.focus()
          }
        }}
        onConfirm={(loc) =>
          editor
            ?.chain()
            .focus()
            .insertContent(loc + " ")
            .run()
        }
      />

      <LinkPickerDialog
        open={showLinkPicker}
        onOpenChange={(open) => {
          setShowLinkPicker(open)
          if (!open) {
            setIsFocused(true)
            editor?.commands.focus()
            setEditingLinkInfo(null)
          }
        }}
        mode={editingLinkInfo ? "edit" : "create"}
        initialTitle={editingLinkInfo?.title}
        initialUrl={editingLinkInfo?.url}
        onConfirm={(title, url) => {
          if (editingLinkInfo) {
            // 编辑模式下更新属性
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
      />
    </motion.section>
  )
}
