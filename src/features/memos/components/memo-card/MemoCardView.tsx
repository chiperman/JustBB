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
import { useMemoBacklinks } from '../../hooks/useMemoBacklinks';
import { ExpandableContent } from '@/components/ui/expandable-content';
import { useUnlockedMemos } from '@/context/UnlockedMemosContext';

interface MemoCardViewProps {
    memo: Memo;
    showOriginalOnly: boolean;
    onEdit: () => void;
    shouldReduceMotion: boolean;
    hasMounted: boolean;
    isLastCreated?: boolean;
    showViewOriginal?: boolean;
}

export function MemoCardView({
    memo,
    showOriginalOnly,
    onEdit,
    shouldReduceMotion,
    hasMounted,
    isLastCreated,
    showViewOriginal,
}: MemoCardViewProps) {
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isSelectionMode, selectedIds, toggleId } = useSelection();
    const { getUnlockedMemo } = useUnlockedMemos();
    const displayMemo = getUnlockedMemo(memo.id) || memo;
    const isSelected = selectedIds.has(memo.id);

    const { 
        backlinks, 
        isLoading: loadingBacklinks, 
        showBacklinks, 
        toggleBacklinks 
    } = useMemoBacklinks(displayMemo.memo_number);

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
                displayMemo.is_pinned && "bg-primary/5 border-primary/20",
                isSelectionMode && "cursor-pointer hover:border-primary/40 select-none",
                isSelectionMode && isSelected && "ring-2 ring-primary border-primary/50 shadow-sm",
                isLastCreated && "animate-new-memo-highlight"
            )}
        >
                <MemoCardHeader
                memo={displayMemo}
                isSelectionMode={isSelectionMode}
                isSelected={isSelected}
                onToggleSelection={() => toggleId(memo.id)}
                showOriginalOnly={showOriginalOnly}
                showViewOriginal={showViewOriginal}
                showBacklinks={showBacklinks}
                onToggleBacklinks={toggleBacklinks}
                onEdit={onEdit}
                onMenuOpenChange={setIsMenuOpen}
                isMenuOpen={isMenuOpen}
                hasMounted={hasMounted}
            />

            <div className={cn("w-full transition-all mt-2", displayMemo.is_locked && "blur-sm select-none")}>
                {displayMemo.is_locked ? (
                    <div className="text-base leading-relaxed text-muted-foreground italic opacity-60">
                        这一条私密记录已被锁定，输入口令后即可解锁阅读。
                    </div>
                ) : (
                    <ExpandableContent
                        needsExpansion={!showOriginalOnly && (displayMemo.content.length > 300 || displayMemo.content.split('\n').length > 8)}
                        collapsedHeight={200}
                    >
                        <MemoContent
                            content={displayMemo.content}
                            disablePreview={showOriginalOnly}
                        />
                    </ExpandableContent>
                )}
            </div>

            {!showOriginalOnly && (
                <MemoCardBacklinks 
                    memoId={displayMemo.id}
                    showBacklinks={showBacklinks}
                    isLoading={loadingBacklinks}
                    backlinks={backlinks}
                />
            )}

            {displayMemo.is_locked && (
                <MemoCardLockOverlay 
                    onUnlock={() => setIsUnlockOpen(true)}
                    shouldReduceMotion={shouldReduceMotion}
                />
            )}

            <UnlockDialog
                memoId={displayMemo.id}
                isOpen={isUnlockOpen}
                onClose={() => setIsUnlockOpen(false)}
                hint={displayMemo.access_code_hint}
            />
        </article>
    );
}
