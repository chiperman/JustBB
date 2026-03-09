'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unlockWithCode } from '@/actions/memos/mutate';
import { HugeiconsIcon } from '@hugeicons/react';
import { CircleLock01Icon as Lock } from '@hugeicons/core-free-icons';

import { useHasMounted } from '@/hooks/useHasMounted';

interface UnlockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    hint?: string | null;
}

export function UnlockDialog({ isOpen, onClose, hint }: UnlockDialogProps) {
    const [code, setCode] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasMounted = useHasMounted();

    const handleConfirm = async () => {
        if (!code) return;
        setIsPending(true);
        setError(null);

        try {
            const res = await unlockWithCode('', code); // ID can be empty as we use cookie based auth
            if (res.success) {
                onClose();
                window.location.reload(); // 刷新以应用 Cookie
            } else {
                setError(res.error || '验证失败');
            }
        } finally {
            setIsPending(false);
        }
    };

    if (!hasMounted) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[320px] rounded-card p-6">
                <DialogHeader className="items-center pb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <HugeiconsIcon icon={Lock} size={24} />
                    </div>
                    <DialogTitle className="text-xl font-bold">需要访问口令</DialogTitle>
                    {hint && (
                        <p className="text-xs text-muted-foreground pt-1">提示：{hint}</p>
                    )}
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Input
                        type="password"
                        placeholder="请输入访问口令"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="text-center tracking-widest h-11"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                    {error && <p className="text-[10px] text-red-500 text-center">{error}</p>}
                </div>

                <DialogFooter className="sm:justify-center flex-col gap-2">
                    <Button 
                        className="w-full h-11 rounded-md" 
                        onClick={handleConfirm}
                        disabled={isPending || !code}
                    >
                        {isPending ? '验证中...' : '确认解锁'}
                    </Button>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={onClose}>
                        取消
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
