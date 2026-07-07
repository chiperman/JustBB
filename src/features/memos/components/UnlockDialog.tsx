"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { unlockWithCode } from "@/server/actions/memos/mutate"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CircleLock01Icon as Lock,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
} from "@hugeicons/core-free-icons"

import { useHasMounted } from "@/shared/hooks/useHasMounted"
import { useUnlockedMemos } from "@/state/UnlockedMemosContext"
import { toast } from "@/shared/hooks/use-toast"

interface UnlockDialogProps {
  memoId: string
  isOpen: boolean
  onClose: () => void
  hint?: string | null
}

export function UnlockDialog({ memoId, isOpen, onClose, hint }: UnlockDialogProps) {
  const [code, setCode] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [isTryingSaved, setIsTryingSaved] = useState(false)
  const hasMounted = useHasMounted()
  const { storeUnlockedMemo, verifiedPasswords, addVerifiedPassword } = useUnlockedMemos()

  const resetState = () => {
    setCode("")
    setShowCode(false)
    setIsTryingSaved(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleConfirm = async () => {
    if (!code) return
    setIsPending(true)

    try {
      const res = await unlockWithCode(memoId, code)
      if (res.success && res.data) {
        storeUnlockedMemo(res.data)
        addVerifiedPassword(code)
        handleClose()
      } else {
        toast({
          title: "口令错误",
          description: res.error || "请检查访问口令后重试",
          variant: "destructive",
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleTrySaved = async () => {
    setIsTryingSaved(true)
    try {
      let success = false
      for (const pwd of verifiedPasswords) {
        const res = await unlockWithCode(memoId, pwd)
        if (res.success && res.data) {
          storeUnlockedMemo(res.data)
          handleClose()
          success = true
          break
        }
      }
      if (!success) {
        toast({
          title: "解锁失败",
          description: "当前会话的已存口令均验证失败，请手动输入",
          variant: "destructive",
        })
      }
    } catch (e) {
      toast({
        title: "解锁失败",
        description: "当前会话的已存口令均验证失败，请手动输入",
        variant: "destructive",
      })
    } finally {
      setIsTryingSaved(false)
    }
  }

  if (!hasMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        mobileDensity="compact"
        className="gap-3 rounded-inner border-border/40 bg-card/95 p-4 backdrop-blur-xl sm:max-w-md sm:gap-5 sm:p-6"
      >
        <DialogHeader className="gap-2 pr-8 sm:gap-3">
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

        <div className="space-y-3 sm:space-y-4">
          {hint && (
            <p className="text-sm leading-6 text-muted-foreground">
              提示：
              <span className="ml-1 text-foreground/80">{hint}</span>
            </p>
          )}

          {verifiedPasswords.length > 0 && (
            <div className="rounded-md border border-primary/20 bg-primary/[0.02] p-3.5 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>检测到当前会话存在已验证口令，是否直接尝试？</span>
                <button
                  type="button"
                  onClick={handleTrySaved}
                  disabled={isPending || isTryingSaved}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isTryingSaved ? "尝试中..." : "一键尝试解锁"}
                </button>
              </div>
            </div>
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
                className="h-11 rounded-md border-border/50 bg-background pr-11 focus-visible:ring-primary/20"
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
          </div>
        </div>

        <DialogFooter className="gap-1.5 pt-0 sm:gap-2 sm:pt-1 sm:justify-end sm:space-x-0 [&>button]:w-full sm:[&>button]:w-auto">
          <Button
            variant="ghost"
            className="rounded-md transition-all [@media(pointer:coarse)]:active:scale-95"
            onClick={handleClose}
          >
            取消
          </Button>
          <Button
            className="rounded-md px-5 transition-all [@media(pointer:coarse)]:active:scale-95"
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
