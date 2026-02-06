'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { unlockWithCode } from '@/actions/unlock';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UnlockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    hint?: string;
}

export function UnlockDialog({ isOpen, onClose, hint }: UnlockDialogProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleUnlock = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await unlockWithCode(code);
            if (result.success) {
                onClose();
                window.location.reload(); // 强制全量刷新以应用 Cookie
            } else {
                setError(result.error || '解锁失败');
            }
        } catch (err) {
            setError('发生未知错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Lock className="w-5 h-5" aria-hidden="true" />
                        <DialogTitle>请输入解锁口令</DialogTitle>
                    </div>
                    {hint && (
                        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                            <span className="font-semibold text-xs uppercase opacity-70 block mb-1">Hint:</span>
                            {hint}
                        </p>
                    )}
                </DialogHeader>
                <div className="py-4">
                    <label htmlFor="unlock-code" className="sr-only">解锁口令</label>
                    <input
                        id="unlock-code"
                        type="password"
                        placeholder="口令..."
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        autoFocus
                    />
                    {error && <p className="text-xs text-red-500 mt-2 ml-1" role="alert">{error}</p>}
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-muted transition-colors"
                    >
                        取消
                    </button>
                    <button
                        disabled={loading || !code}
                        onClick={handleUnlock}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                        {loading ? '解锁中...' : '确认解锁'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
