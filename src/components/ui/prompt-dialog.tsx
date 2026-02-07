"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

interface PromptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    placeholder?: string
    defaultValue?: string
    showSecondInput?: boolean
    secondPlaceholder?: string
    secondDefaultValue?: string
    required?: boolean
    isPassword?: boolean
    onConfirm: (value: string, secondValue: string) => void
    onCancel: () => void
}

export function PromptDialog({
    open,
    onOpenChange,
    title,
    description,
    placeholder,
    defaultValue = "",
    showSecondInput = false,
    secondPlaceholder,
    secondDefaultValue = "",
    required = false,
    isPassword = false,
    onConfirm,
    onCancel,
}: PromptDialogProps) {
    const [value, setValue] = React.useState(defaultValue)
    const [secondValue, setSecondValue] = React.useState(secondDefaultValue)
    const [showPassword, setShowPassword] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setValue(defaultValue)
            setSecondValue(secondDefaultValue)
            setShowPassword(false)
        }
    }, [open, defaultValue, secondDefaultValue])

    const handleValueChange = (v: string) => {
        if (isPassword) {
            // 过滤掉所有中文字符
            const filtered = v.replace(/[\u4e00-\u9fa5]/g, "")
            setValue(filtered)
        } else {
            setValue(v)
        }
    }

    const handleConfirm = () => {
        onConfirm(value, secondValue)
        onOpenChange(false)
    }

    const handleCancel = () => {
        onCancel()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="relative">
                        <Input
                            type={isPassword && !showPassword ? "password" : "text"}
                            value={value}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder={placeholder}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleConfirm()
                                }
                            }}
                            autoFocus
                            className={isPassword ? "pr-10" : ""}
                        />
                        {isPassword && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        )}
                    </div>
                    {showSecondInput && (
                        <Input
                            value={secondValue}
                            onChange={(e) => setSecondValue(e.target.value)}
                            placeholder={secondPlaceholder}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleConfirm()
                                }
                            }}
                        />
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancel}>
                        取消
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={required && !value.trim()}
                    >
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
