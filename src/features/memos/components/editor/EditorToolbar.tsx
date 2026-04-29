"use client"

import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinIcon as Pin,
  LockIcon as Lock,
  CircleUnlock01Icon as LockOpen,
  Location04Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { spring, ease, duration } from "@/lib/animation"

interface EditorToolbarProps {
  isActuallyCollapsed: boolean
  animateStateChanges?: boolean
  isPrivate: boolean
  isPinned: boolean
  isPending: boolean
  content: string
  mode: "create" | "edit"
  onTogglePrivate: () => void
  onTogglePinned: () => void
  onShowLocationPicker: () => void
  onShowLinkPicker: () => void
  onCancel: () => void
  onPublish: () => void
}

export function EditorToolbar({
  isActuallyCollapsed,
  animateStateChanges = true,
  isPrivate,
  isPinned,
  isPending,
  content,
  mode,
  onTogglePrivate,
  onTogglePinned,
  onShowLocationPicker,
  onShowLinkPicker,
  onCancel,
  onPublish,
}: EditorToolbarProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: isActuallyCollapsed ? 0 : "auto",
        opacity: isActuallyCollapsed ? 0 : 1,
      }}
      transition={{
        height: animateStateChanges
          ? isActuallyCollapsed
            ? spring.default
            : { duration: duration.default, ease: ease.out }
          : { duration: 0 },
        opacity: { duration: animateStateChanges ? duration.fast : 0 },
      }}
      style={{ willChange: "opacity, height" }}
      className="overflow-hidden bg-transparent"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="pt-5 mt-4 border-t border-border/50 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePrivate}
            className={cn(
              "h-8 px-2 gap-1.5 transition-all text-muted-foreground",
              isPrivate
                ? "text-primary bg-[#fdf5f2] hover:text-primary/80"
                : "hover:text-foreground"
            )}
          >
            {isPrivate ? (
              <HugeiconsIcon icon={Lock} size={16} />
            ) : (
              <HugeiconsIcon icon={LockOpen} size={16} />
            )}
            <span className="text-xs font-medium">
              {isPrivate ? "私密" : "公开"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePinned}
            className={cn(
              "h-8 px-2 gap-1.5 transition-all text-muted-foreground",
              isPinned
                ? "text-primary bg-[#fdf5f2] hover:text-primary/80"
                : "hover:text-foreground"
            )}
          >
            <HugeiconsIcon
              icon={Pin}
              size={16}
              className={cn(isPinned && "fill-current")}
            />
            <span className="text-xs font-medium">置顶</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShowLocationPicker}
            className="h-8 px-2 gap-1.5 text-muted-foreground transition-all hover:text-foreground"
            aria-label="添加定位"
          >
            <HugeiconsIcon icon={Location04Icon} size={16} />
            <span className="text-xs font-medium">定位</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShowLinkPicker}
            className="h-8 px-2 gap-1.5 text-muted-foreground transition-all hover:text-foreground"
            aria-label="添加链接"
          >
            <HugeiconsIcon icon={Link01Icon} size={16} />
            <span className="text-xs font-medium">链接</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {content.trim().length > 0 && (
            <span className="text-[10px] caption opacity-40 tabular-nums ml-1">
              {content.trim().length} 字
            </span>
          )}
          <div className="flex items-center gap-2">
            {(mode === "edit" || content.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 px-3 text-muted-foreground hover:text-foreground transition-all"
              >
                {mode === "edit" ? "取消" : "清空"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={onPublish}
              disabled={!content.trim() || isPending}
              className="h-8 px-4 bg-primary text-primary-foreground transition-all"
            >
              {isPending ? "提交中..." : mode === "edit" ? "保存" : "发布"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
