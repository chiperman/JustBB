"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CircleLock01Icon as Lock,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AdminDialogShell } from "@/components/ui/AdminDialogShell"

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
    <AdminDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      subtitle={description}
      icon={Lock}
      footer={
        <div className="w-full flex justify-end gap-2">
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
        </div>
      }
    >
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
              className="h-11 rounded-md border-border/50 bg-background pr-11-none focus-visible:ring-primary/20"
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
            className="h-11 rounded-md border-border/50 bg-background-none focus-visible:ring-primary/20"
          />
        </div>
      </div>
    </AdminDialogShell>
  )
}
