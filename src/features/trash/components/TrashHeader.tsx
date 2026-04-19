'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon as Trash2, Archive02Icon as Archive, Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';

import { Button } from "@/components/ui/button";
import { ContextPageHeader } from '@/components/layout/ContextPageShell';
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
        <ContextPageHeader
            icon={Archive}
            title="回收站"
            showTitle={false}
            description={count > 0
                ? `这里按最近删除排序，共 ${count} 条记录。`
                : '这里暂时没有已删除记录。'}
            actions={count > 0 ? (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-border/60 bg-background/80 text-muted-foreground shadow-none hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <HugeiconsIcon icon={Loader2} size={14} className="animate-spin" />
                            ) : (
                                <HugeiconsIcon icon={Trash2} size={14} />
                            )}
                            清空回收站
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
            ) : null}
        />
    );
}
