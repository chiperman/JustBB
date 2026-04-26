"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CircleLock01Icon as Lock,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AccessCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accessCode: string
  setAccessCode: (code: string) => void
  accessHint: string
  setAccessHint: (hint: string) => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
}

export function AccessCodeDialog({
  open,
  onOpenChange,
  accessCode,
  setAccessCode,
  accessHint,
  setAccessHint,
  onConfirm,
  title = "设置访问口令",
  description = "为这条私密记录添加访问口令，只有输入正确口令后才能查看内容。",
  confirmLabel = "保存",
}: AccessCodeDialogProps) {
  const [showAccessCode, setShowAccessCode] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowAccessCode(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-5 rounded-inner border-border/40 bg-card/95 p-6 shadow-xl backdrop-blur-xl">
        <DialogHeader className="gap-3 pr-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={Lock} size={20} />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2.5">
            <div className="space-y-1">
              <label
                htmlFor="access-code"
                className="text-sm font-medium leading-none text-foreground"
              >
                访问口令
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                建议使用便于记忆但不易被猜到的短语或组合。
              </p>
            </div>
            <div className="relative">
              <Input
                id="access-code"
                type={showAccessCode ? "text" : "password"}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="请输入访问口令"
                className="h-11 rounded-md border-border/50 bg-background pr-11 shadow-none focus-visible:ring-primary/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowAccessCode((prev) => !prev)}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                aria-label={showAccessCode ? "隐藏口令" : "显示口令"}
              >
                {showAccessCode ? (
                  <HugeiconsIcon
                    icon={EyeOff}
                    size={16}
                    className="text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <HugeiconsIcon
                    icon={Eye}
                    size={16}
                    className="text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="space-y-1">
              <label
                htmlFor="access-hint"
                className="text-sm font-medium leading-none text-foreground"
              >
                口令提示
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (选填)
                </span>
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                提示会展示给需要解锁的人，但不会泄露真实口令。
              </p>
            </div>
            <Input
              id="access-hint"
              value={accessHint}
              onChange={(e) => setAccessHint(e.target.value)}
              placeholder="例如：我的生日"
              className="h-11 rounded-md border-border/50 bg-background shadow-none focus-visible:ring-primary/20"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-1 sm:justify-end sm:space-x-0">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="rounded-md transition-all active:scale-95"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!accessCode}
            className="rounded-md px-5 transition-all active:scale-95"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
