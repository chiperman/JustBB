'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon as Trash2, Archive02Icon as Archive, Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrashHeaderProps {
    count: number;
    isPending: boolean;
    onEmptyTrash: () => void;
}

export function TrashHeader({ count, isPending, onEmptyTrash }: TrashHeaderProps) {
    return (
        <header className="mb-10 flex items-end justify-between border-b border-border/20 pb-8">
            <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight italic flex items-center gap-3 text-foreground/80">
                    <HugeiconsIcon icon={Archive} size={32} className="text-muted-foreground/40" /> 回收站
                </h2>
                <p className="text-muted-foreground text-sm font-sans tracking-wide opacity-70 italic">
                    Fragments intended for oblivion. {"\n"}
                    被遗忘的片段，在这里等待最后的归宿。
                </p>
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                    Total: {count.toString().padStart(2, '0')}
                </div>
                {count > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all text-[10px] uppercase font-mono tracking-widest gap-2 rounded-sm h-7"
                                disabled={isPending}
                            >
                                {isPending ? <HugeiconsIcon icon={Loader2} size={12} className="animate-spin" /> : <HugeiconsIcon icon={Trash2} size={12} />}
                                Empty Trash
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>清空回收站？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作将永久删除回收站内的所有记录。该操作不可逆，请谨慎操作。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-sm">取消</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={onEmptyTrash}
                                    className="bg-destructive hover:bg-destructive/90 rounded-sm"
                                >
                                    确认清空
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </header>
    );
}
