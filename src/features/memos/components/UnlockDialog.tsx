"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { unlockWithCode } from "@/actions/memos/mutate"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CircleLock01Icon as Lock,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
} from "@hugeicons/core-free-icons"

import { useHasMounted } from "@/hooks/useHasMounted"
import { useUnlockedMemos } from "@/context/UnlockedMemosContext"

interface UnlockDialogProps {
  memoId: string
  isOpen: boolean
  onClose: () => void
  hint?: string | null
}

export function UnlockDialog({
  memoId,
  isOpen,
  onClose,
  hint,
}: UnlockDialogProps) {
  const [code, setCode] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const hasMounted = useHasMounted()
  const { storeUnlockedMemo } = useUnlockedMemos()

  const resetState = () => {
    setCode("")
    setError(null)
    setShowCode(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleConfirm = async () => {
    if (!code) return
    setIsPending(true)
    setError(null)

    try {
      const res = await unlockWithCode(memoId, code)
      if (res.success && res.data) {
        storeUnlockedMemo(res.data)
        handleClose()
      } else {
        setError(res.error || "验证失败")
      }
    } finally {
      setIsPending(false)
    }
  }

  if (!hasMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md gap-5 rounded-inner border-border/40 bg-card/95 p-6 shadow-xl backdrop-blur-xl">
        <DialogHeader className="gap-3 pr-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={Lock} size={20} />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                输入访问口令
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                这是一条私密记录，验证口令后即可解锁并查看完整内容。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {hint && (
            <p className="text-sm leading-6 text-muted-foreground">
              提示：
              <span className="ml-1 text-foreground/80">{hint}</span>
            </p>
          )}

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label
                htmlFor="unlock-code"
                className="text-sm font-medium leading-none text-foreground"
              >
                访问口令
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                输入正确口令后，本条记录会在当前页面立即解锁。
              </p>
            </div>
            <div className="relative">
              <Input
                id="unlock-code"
                type={showCode ? "text" : "password"}
                placeholder="请输入访问口令"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 rounded-md border-border/50 bg-background pr-11 shadow-none focus-visible:ring-primary/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowCode((prev) => !prev)}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                aria-label={showCode ? "隐藏口令" : "显示口令"}
              >
                {showCode ? (
                  <HugeiconsIcon icon={EyeOff} size={16} aria-hidden="true" />
                ) : (
                  <HugeiconsIcon icon={Eye} size={16} aria-hidden="true" />
                )}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-1 sm:justify-end sm:space-x-0">
          <Button
            variant="ghost"
            className="rounded-md transition-all active:scale-95"
            onClick={handleClose}
          >
            取消
          </Button>
          <Button
            className="rounded-md px-5 transition-all active:scale-95"
            onClick={handleConfirm}
            disabled={isPending || !code}
          >
            {isPending ? "验证中..." : "解锁"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
