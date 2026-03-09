'use client';

import { useState } from "react";
import { cn } from '@/lib/utils';
import { useSelection } from '@/context/UIContext';
import { Memo } from '@/types/memo';
import { MemoContent } from '../MemoContent';
import { UnlockDialog } from '../UnlockDialog';
import { MemoCardHeader } from './MemoCardHeader';
import { MemoCardBacklinks } from './MemoCardBacklinks';
import { MemoCardLockOverlay } from './MemoCardLockOverlay';
import { useMemoBacklinks } from '@/hooks/useMemoBacklinks';

interface MemoCardViewProps {
    memo: Memo;
    isAdmin: boolean;
    showOriginalOnly: boolean;
    onEdit: () => void;
    shouldReduceMotion: boolean;
    hasMounted: boolean;
}

export function MemoCardView({
    memo,
    isAdmin,
    showOriginalOnly,
    onEdit,
    shouldReduceMotion,
    hasMounted,
}: MemoCardViewProps) {
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isSelectionMode, selectedIds, toggleId } = useSelection();
    const isSelected = selectedIds.has(memo.id);

    const { 
        backlinks, 
        isLoading: loadingBacklinks, 
        showBacklinks, 
        toggleBacklinks 
    } = useMemoBacklinks(memo.memo_number);

    const handleCardClick = () => {
        if (isSelectionMode) {
            toggleId(memo.id);
        }
    };

    return (
        <article
            onClick={handleCardClick}
            className={cn(
                "relative bg-card rounded-card p-6 transition-all border border-border focus-within:ring-2 focus-within:ring-primary/10 group",
                memo.is_pinned && "bg-primary/5 border-primary/20",
                isSelectionMode && "cursor-pointer hover:border-primary/40 select-none",
                isSelectionMode && isSelected && "ring-2 ring-primary border-primary/50 shadow-sm"
            )}
        >
            <MemoCardHeader 
                memo={memo}
                isSelectionMode={isSelectionMode}
                isSelected={isSelected}
                onToggleSelection={() => toggleId(memo.id)}
                showOriginalOnly={showOriginalOnly}
                showBacklinks={showBacklinks}
                onToggleBacklinks={toggleBacklinks}
                onEdit={onEdit}
                onMenuOpenChange={setIsMenuOpen}
                isAdmin={isAdmin}
                isMenuOpen={isMenuOpen}
                hasMounted={hasMounted}
            />

            <div className={cn("w-full transition-all", memo.is_locked && "blur-sm select-none")}>
                {memo.is_locked ? (
                    <div className="text-base leading-relaxed text-muted-foreground italic opacity-60">
                        这一条私密记录已被锁定，输入口令后即可解锁阅读。
                    </div>
                ) : (
                    <MemoContent
                        content={memo.content}
                        disablePreview={showOriginalOnly}
                    />
                )}
            </div>

            {!showOriginalOnly && (
                <MemoCardBacklinks 
                    memoId={memo.id}
                    showBacklinks={showBacklinks}
                    isLoading={loadingBacklinks}
                    backlinks={backlinks}
                />
            )}

            {memo.is_locked && (
                <MemoCardLockOverlay 
                    onUnlock={() => setIsUnlockOpen(true)}
                    shouldReduceMotion={shouldReduceMotion}
                />
            )}

            <UnlockDialog
                isOpen={isUnlockOpen}
                onClose={() => setIsUnlockOpen(false)}
                hint={memo.access_code_hint}
            />
        </article>
    );
}
