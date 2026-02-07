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
    onConfirm,
    onCancel,
}: PromptDialogProps) {
    const [value, setValue] = React.useState(defaultValue)
    const [secondValue, setSecondValue] = React.useState(secondDefaultValue)

    React.useEffect(() => {
        if (open) {
            setValue(defaultValue)
            setSecondValue(secondDefaultValue)
        }
    }, [open, defaultValue, secondDefaultValue])

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
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleConfirm()
                            }
                        }}
                        autoFocus
                    />
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
