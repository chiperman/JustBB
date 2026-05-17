"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

type DialogType = "alert" | "confirm" | "prompt"

interface ConfirmOptions {
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  // Prompt specific
  label?: string
  placeholder?: string
  defaultValue?: string
}

type DialogValue = boolean | string | null | void

interface DialogState extends ConfirmOptions {
  type: DialogType
  resolve: (value: DialogValue) => void
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: Omit<ConfirmOptions, "cancelLabel">) => Promise<void>
  prompt: (options: ConfirmOptions) => Promise<string | null>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const showDialog = useCallback(
    (type: DialogType, options: ConfirmOptions) => {
      return new Promise<DialogValue>((resolve) => {
        setDialog({
          ...options,
          type,
          resolve,
        })
        if (type === "prompt") {
          setInputValue(options.defaultValue || "")
        }
      })
    },
    []
  )

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      showDialog("confirm", options) as Promise<boolean>,
    [showDialog]
  )

  const alert = useCallback(
    (options: Omit<ConfirmOptions, "cancelLabel">) =>
      showDialog("alert", options) as Promise<void>,
    [showDialog]
  )

  const prompt = useCallback(
    (options: ConfirmOptions) =>
      showDialog("prompt", options) as Promise<string | null>,
    [showDialog]
  )

  const handleConfirm = () => {
    if (!dialog) return
    const value = dialog.type === "prompt" ? inputValue : true
    dialog.resolve(value)
    setDialog(null)
    setInputValue("")
  }

  const handleCancel = () => {
    if (!dialog) return
    dialog.resolve(dialog.type === "prompt" ? null : false)
    setDialog(null)
    setInputValue("")
  }

  return (
    <ConfirmContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      <AlertDialog
        open={!!dialog}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog?.title}</AlertDialogTitle>
            {dialog?.description && (
              <AlertDialogDescription>
                {dialog.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {dialog?.type === "prompt" && (
            <div className="py-2">
              {dialog.label && (
                <label className="text-sm font-medium mb-2 block">
                  {dialog.label}
                </label>
              )}
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialog.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleConfirm()
                  }
                }}
                autoFocus
              />
            </div>
          )}

          <AlertDialogFooter>
            {dialog?.type !== "alert" && (
              <AlertDialogCancel onClick={handleCancel} className="rounded-md">
                {dialog?.cancelLabel || "取消"}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                "rounded-md",
                dialog?.variant === "destructive" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {dialog?.confirmLabel || "确定"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context
}
