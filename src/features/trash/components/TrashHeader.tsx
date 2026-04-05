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
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-border/10 pb-10">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-12 h-12 flex items-center justify-center border border-primary/10 rounded-full bg-background/50 backdrop-blur-sm">
                            <HugeiconsIcon icon={Archive} size={22} className="text-primary/60" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight italic text-foreground/90 selection:bg-primary/20">
                            回收站
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-px w-8 bg-primary/20" />
                            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-muted-foreground/50">
                                Ethereal Archive
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-muted-foreground/60 text-xs font-sans tracking-wide leading-relaxed italic max-w-sm">
                    Fragments intended for oblivion. 
                    被遗忘的片段，在这里等待最后的归宿。
                </p>
            </div>
            <div className="flex flex-col items-end gap-5 mt-6 md:mt-0">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-[0.4em] mb-1">
                        Record Sequence
                    </span>
                    <div className="text-2xl font-mono text-foreground/60 tracking-tighter">
                        <span className="opacity-20">NO.</span>{count.toString().padStart(4, '0')}
                    </div>
                </div>
                {count > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-all text-[9px] uppercase font-mono tracking-[0.2em] gap-2 rounded-sm h-8 border border-border/30 px-4 group"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <HugeiconsIcon icon={Loader2} size={14} className="animate-spin" />
                                ) : (
                                    <HugeiconsIcon 
                                        icon={Trash2} 
                                        size={14} 
                                        className="transition-transform group-hover:rotate-12" 
                                    />
                                )}
                                Purge Archive
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
