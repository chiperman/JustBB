'use client';

import { AccessCodeDialog } from '@/features/memos/components/AccessCodeDialog';

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
    return (
        <AccessCodeDialog
            open={open}
            onOpenChange={onOpenChange}
            accessCode={accessCode}
            setAccessCode={setAccessCode}
            accessHint={accessHint}
            setAccessHint={setAccessHint}
            onConfirm={onConfirm}
            title="设置访问口令"
            description="为这条私密记录添加访问口令，只有输入正确口令后才能查看内容。"
            confirmLabel="发布"
        />
    );
}
