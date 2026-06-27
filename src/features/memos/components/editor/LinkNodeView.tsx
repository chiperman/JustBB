"use client"

import React from "react"
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Link01Icon,
  Copy01Icon,
  PencilEdit02Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { LinkPreview } from "@/shared/ui/LinkPreview"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/shared/ui/hover-card"
import { useToast } from "@/shared/hooks/use-toast"
import { SmartImage } from "@/shared/ui/SmartImage"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import type { LinkRenderMode } from "./smartLink"

export const LinkNodeView = (props: NodeViewProps) => {
  const { node, updateAttributes, editor } = props
  const { id: url, label: title, mode = "mention", isPending = false } = node.attrs
  const { toast } = useToast()
  const editorDom = editor.view.dom

  const handleCopy = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    navigator.clipboard.writeText(url)
    toast({ title: "链接已拷贝" })
  }

  const handleEdit = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const event = new CustomEvent("edit-link", {
      detail: {
        url,
        title,
        mode: mode as LinkRenderMode,
        node,
        updateAttributes,
      },
    })
    editorDom.dispatchEvent(event)
  }

  const renderMenu = () => (
    <DropdownMenu
      onOpenChange={(open) => {
        editorDom.dispatchEvent(new CustomEvent("memo-internal-menu-change", { detail: { open } }))
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          onMouseDown={(e) => e.preventDefault()}
          className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={handleCopy} className="gap-2">
          <HugeiconsIcon icon={Copy01Icon} size={14} />
          拷贝链接
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="gap-2">
          <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
          编辑
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (isPending) {
    return (
      <NodeViewWrapper className="inline-block align-middle leading-none my-0.5">
        <span className="text-primary/60 border-b border-primary/40 pb-0.5 font-mono text-sm italic animate-pulse">
          {url}
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="inline-block align-middle leading-none my-0.5">
      {mode === "mention" && (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-sm transition-colors group">
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md hover:bg-primary/20 transition-colors overflow-hidden"
              >
                <span>🔗</span>
                <span className="truncate max-w-[200px]">{title}</span>
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-0 overflow-hidden border-none">
              <LinkPreview
                url={url}
                customTitle={title}
                className="m-0 border-none rounded-none h-auto"
              />
            </HoverCardContent>
          </HoverCard>
          <div className="ml-1 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity">
            {renderMenu()}
          </div>
        </div>
      )}

      {mode === "pill" && (
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-card/50 hover:bg-accent/30 transition-all group">
          <HugeiconsIcon icon={Link01Icon} size={14} className="text-muted-foreground/60" />
          <span className="text-xs text-foreground/80 font-medium truncate max-w-[200px]">
            {title}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCopy}
                  className="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="拷贝链接"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">拷贝链接</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleEdit}
                  className="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="编辑"
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">编辑</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {mode === "card" && (
        <div className="relative group max-w-2xl my-2">
          <LinkPreview url={url} customTitle={title} className="m-0" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border border-border/50 p-0.5 z-10">
            {renderMenu()}
          </div>
        </div>
      )}

      {mode === "image" && (
        <div className="relative group my-2 max-w-2xl overflow-hidden rounded-md border border-border/50 bg-muted/20">
          <SmartImage
            src={url}
            alt={title || "图片"}
            className="max-h-[420px] w-full object-contain"
            draggable={false}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border border-border/50 p-0.5 z-10">
            {renderMenu()}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
