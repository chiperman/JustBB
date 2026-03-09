'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { PinIcon, ChatLock01Icon as LockIcon, Link02Icon } from '@hugeicons/core-free-icons';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MemoActions } from '../MemoActions';
import { Memo } from '@/types/memo';

interface MemoCardHeaderProps {
    memo: Memo;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: () => void;
    showOriginalOnly: boolean;
    showBacklinks: boolean;
    onToggleBacklinks: () => void;
    onEdit: () => void;
    onMenuOpenChange: (open: boolean) => void;
    isAdmin: boolean;
    isMenuOpen: boolean;
    hasMounted: boolean;
}

export function MemoCardHeader({
    memo,
    isSelectionMode,
    isSelected,
    onToggleSelection,
    showOriginalOnly,
    showBacklinks,
    onToggleBacklinks,
    onEdit,
    onMenuOpenChange,
    isAdmin,
    isMenuOpen,
    hasMounted,
}: MemoCardHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {/* 选择模式下的多选框 */}
                {isSelectionMode && (
                    <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onToggleSelection();
                        }}
                    >
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelection}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="h-3.5 w-3.5 rounded-full border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-[background-color,border-color] duration-200 cursor-pointer"
                        />
                    </div>
                )}
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    #{memo.memo_number}
                </span>
                <time className="text-xs text-muted-foreground font-sans">
                    {hasMounted ? (
                        memo.is_locked
                            ? `${formatDate(memo.created_at, 'yyyy-MM-dd HH:mm')} **:**`
                            : formatDate(memo.created_at, 'yyyy-MM-dd HH:mm')
                    ) : (
                        '--:--'
                    )}
                </time>
                {memo.is_pinned && <HugeiconsIcon icon={PinIcon} size={14} className="text-primary fill-current" aria-hidden="true" />}
                {memo.is_private && <HugeiconsIcon icon={LockIcon} size={14} className="text-muted-foreground" aria-hidden="true" />}
                {memo.word_count !== undefined && (
                    <span className="text-[10px] text-muted-foreground/60">
                        {memo.is_locked ? '*' : memo.word_count} 字
                    </span>
                )}
            </div>
            {!memo.is_locked && !isSelectionMode && (
                <div className="flex items-center gap-2">
                    {showOriginalOnly ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.location.assign(`/?num=${memo.memo_number}`);
                            }}
                            className="h-7 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 z-10 pointer-events-auto"
                        >
                            查看原始数据
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleBacklinks}
                                className={cn(
                                    "h-8 w-8 rounded-md transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:scale-95",
                                    showBacklinks ? "bg-primary/10 text-primary opacity-100" : "text-muted-foreground",
                                    (showBacklinks || isMenuOpen) && "opacity-100",
                                )}
                                aria-expanded={showBacklinks}
                                aria-label="查看引用"
                                title="查看引用"
                            >
                                <HugeiconsIcon icon={Link02Icon} size={16} />
                            </Button>
                            <MemoActions
                                id={memo.id}
                                isDeleted={!!memo.deleted_at}
                                isPinned={memo.is_pinned}
                                isPrivate={memo.is_private}
                                content={memo.content}
                                createdAt={memo.created_at}
                                tags={memo.tags ?? []}
                                onEdit={onEdit}
                                onOpenChange={onMenuOpenChange}
                                isAdmin={isAdmin}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
