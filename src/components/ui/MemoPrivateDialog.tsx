'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from './button';
import { Input } from './input';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ViewIcon as Eye,
    ViewOffSlashIcon as EyeOff,
} from '@hugeicons/core-free-icons';

interface MemoPrivateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accessCode: string;
    setAccessCode: (code: string) => void;
    accessHint: string;
    setAccessHint: (hint: string) => void;
    onConfirm: () => void;
}

export function MemoPrivateDialog({
    open,
    onOpenChange,
    accessCode,
    setAccessCode,
    accessHint,
    setAccessHint,
    onConfirm
}: MemoPrivateDialogProps) {
    const [showAccessCode, setShowAccessCode] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>设置访问口令</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="access-code" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 after:content-['*'] after:ml-0.5 after:text-red-500">
                            访问口令
                        </label>
                        <div className="relative">
                            <Input
                                id="access-code"
                                type={showAccessCode ? "text" : "password"}
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="请输入访问口令"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowAccessCode(!showAccessCode)}
                                className="absolute right-0 top-0 h-full"
                                aria-label={showAccessCode ? "隐藏口令" : "显示口令"}
                            >
                                {showAccessCode ? (
                                    <HugeiconsIcon icon={EyeOff} size={16} className="text-muted-foreground" aria-hidden="true" />
                                ) : (
                                    <HugeiconsIcon icon={Eye} size={16} className="text-muted-foreground" aria-hidden="true" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="access-hint" className="text-sm font-medium leading-none">
                            口令提示 (选填)
                        </label>
                        <Input
                            id="access-hint"
                            value={accessHint}
                            onChange={(e) => setAccessHint(e.target.value)}
                            placeholder="例如：我的生日"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={onConfirm} disabled={!accessCode}>发布</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
