'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { ChatLock01Icon as LockIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface MemoCardLockOverlayProps {
    onUnlock: () => void;
    shouldReduceMotion: boolean;
}

export function MemoCardLockOverlay({
    onUnlock,
    shouldReduceMotion,
}: MemoCardLockOverlayProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-card pointer-events-none z-10">
            <button
                onClick={onUnlock}
                className={cn(
                    "bg-background/80 backdrop-blur-md border border-primary/20 px-5 py-2.5 rounded-md text-xs font-medium pointer-events-auto cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ring-offset-2",
                    !shouldReduceMotion && "active:scale-95"
                )}
                aria-label="解密内容"
            >
                <HugeiconsIcon icon={LockIcon} size={12} className="text-primary" aria-hidden="true" />
                <span>解密记录以阅读正文</span>
            </button>
        </div>
    );
}
