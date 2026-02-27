'use client';

import { useState } from 'react';
import { useSelection } from '@/context/SelectionContext';
import { useRouter } from 'next/navigation';
import { useView } from '@/context/ViewContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Delete02Icon as Trash2,
    Tag01Icon as Tag,
    Cancel01Icon as X,
    ArrowTurnBackwardIcon as RotateCcw,
    ArchiveRestore as ArchiveRestore,
    Loading01Icon as Loader2,
    AlertCircleIcon as ShieldAlert
} from '@hugeicons/core-free-icons';
import { useToast } from '@/hooks/use-toast';
import { batchDeleteMemos, batchRestoreMemos, batchPermanentDeleteMemos } from '@/actions/delete';
import { batchAddTagsToMemos } from '@/actions/update';
import { TagSelectDialog } from './TagSelectDialog';
import { useTags } from '@/context/TagsContext';
import { useStats } from '@/context/StatsContext';

export function SelectionToolbar() {
    const { currentView } = useView();
    const router = useRouter();
    const { isSelectionMode, selectedIds, clearSelection, toggleSelectionMode } = useSelection();
    const { refreshTags } = useTags();
    const { refreshStats } = useStats();
    const { toast } = useToast();

    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const isTrashPage = currentView === '/trash';
    const hasSelection = selectedIds.size > 0;

    if (!isSelectionMode) return null;

    const handleBatchDelete = async () => {
        if (!hasSelection) return;
        if (!window.confirm(`确定要将选中的 ${selectedIds.size} 条笔记放入回收站吗？`)) return;

        setIsPending(true);
        try {
            const res = await batchDeleteMemos(Array.from(selectedIds));
            if (res.success) {
                toast({ title: '已批量删除', description: `成功删除 ${selectedIds.size} 条笔记` });
                clearSelection();
                refreshTags();
                refreshStats();
                router.refresh();
            } else {
                toast({ title: '删除失败', description: res.error, variant: 'destructive' });
            }
        } finally {
            setIsPending(false);
        }
    };

    const handleBatchRestore = async () => {
        if (!hasSelection) return;

        setIsPending(true);
        try {
            const res = await batchRestoreMemos(Array.from(selectedIds));
            if (res.success) {
                toast({ title: '已恢复', description: `成功恢复 ${selectedIds.size} 条笔记` });
                clearSelection();
                refreshTags();
                refreshStats();
                router.refresh();
            } else {
                toast({ title: '操作失败', description: res.error, variant: 'destructive' });
            }
        } finally {
            setIsPending(false);
        }
    };

    const handleBatchPermanentDelete = async () => {
        if (!hasSelection) return;
        if (!window.confirm(`确定要永久删除选中的 ${selectedIds.size} 条笔记吗？此操作不可逆。`)) return;

        setIsPending(true);
        try {
            const res = await batchPermanentDeleteMemos(Array.from(selectedIds));
            if (res.success) {
                toast({ title: '永久删除成功', description: `已彻底删除 ${selectedIds.size} 条笔记`, variant: 'destructive' });
                clearSelection();
                refreshTags();
                refreshStats();
                router.refresh();
            } else {
                toast({ title: '操作失败', description: res.error, variant: 'destructive' });
            }
        } finally {
            setIsPending(false);
        }
    };

    const handleBatchAddTags = async (tags: string[]) => {
        setIsPending(true);
        try {
            const res = await batchAddTagsToMemos(Array.from(selectedIds), tags);
            if (res.success) {
                toast({ title: '已批量添加标签', description: `成功为 ${selectedIds.size} 条笔记添加了标签` });
                clearSelection();
                refreshTags();
                refreshStats();
                router.refresh();
            } else {
                toast({ title: '添加失败', description: res.error, variant: 'destructive' });
            }
        } finally {
            setIsPending(false);
            setIsTagDialogOpen(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: 100, opacity: 0, x: '-50%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-8 left-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-inner min-w-[320px] max-w-[90vw]"
                    >
                        <div className="flex items-center gap-1 flex-1 px-2">
                            {isTrashPage ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBatchRestore}
                                        disabled={!hasSelection || isPending}
                                        className="h-8 gap-2 text-xs hover:bg-primary/5 hover:text-primary rounded-md transition-all"
                                    >
                                        <HugeiconsIcon icon={ArchiveRestore} size={14} />
                                        <span>恢复</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBatchPermanentDelete}
                                        disabled={!hasSelection || isPending}
                                        className="h-8 gap-2 text-xs hover:bg-destructive/5 hover:text-destructive rounded-md transition-all"
                                    >
                                        <HugeiconsIcon icon={ShieldAlert} size={14} />
                                        <span>彻底删除</span>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsTagDialogOpen(true)}
                                        disabled={!hasSelection || isPending}
                                        className="h-8 gap-2 text-xs hover:bg-primary/5 hover:text-primary rounded-md transition-all"
                                    >
                                        <HugeiconsIcon icon={Tag} size={14} />
                                        <span>添加标签</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBatchDelete}
                                        disabled={!hasSelection || isPending}
                                        className="h-8 gap-2 text-xs hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
                                    >
                                        {isPending ? <HugeiconsIcon icon={Loader2} size={14} className="animate-spin" /> : <HugeiconsIcon icon={Trash2} size={14} />}
                                        <span>删除</span>
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1 pl-3 border-l border-border/40 ml-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                disabled={!hasSelection || isPending}
                                className="h-8 px-2 rounded-md text-muted-foreground hover:text-primary transition-colors"
                                title="重置选择"
                            >
                                <HugeiconsIcon icon={RotateCcw} size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSelectionMode(false)}
                                className="h-8 w-8 p-0 rounded-md hover:bg-accent transition-colors"
                            >
                                <HugeiconsIcon icon={X} size={16} className="text-muted-foreground" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >

            {!isTrashPage && (
                <TagSelectDialog
                    isOpen={isTagDialogOpen}
                    onClose={() => setIsTagDialogOpen(false)}
                    onConfirm={handleBatchAddTags}
                />
            )
            }
        </>
    );
}
