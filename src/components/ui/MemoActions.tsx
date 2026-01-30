'use client';

import { useState } from 'react';
import { deleteMemo, restoreMemo, permanentDeleteMemo } from '@/actions/delete';
import { Trash2, RotateCcw, MoreHorizontal, Share2, MessageSquare } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface MemoActionsProps {
    id: string;
    isDeleted: boolean;
}

export function MemoActions({ id, isDeleted }: MemoActionsProps) {
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        if (!confirm('确定要删除这条记录吗？它将被移入垃圾箱。')) return;
        setIsPending(true);
        await deleteMemo(id);
        setIsPending(false);
    };

    const handleRestore = async () => {
        setIsPending(true);
        await restoreMemo(id);
        setIsPending(false);
    };

    const handlePermanentDelete = async () => {
        if (!confirm('确定要彻底销毁吗？操作不可逆！')) return;
        setIsPending(true);
        await permanentDeleteMemo(id);
        setIsPending(false);
    };

    if (isDeleted) {
        return (
            <div className="flex gap-2">
                <button
                    onClick={handleRestore}
                    disabled={isPending}
                    className="p-2 hover:bg-muted rounded-full text-green-600 transition-colors"
                    title="恢复"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
                <button
                    onClick={handlePermanentDelete}
                    disabled={isPending}
                    className="p-2 hover:bg-red-100 rounded-full text-red-600 transition-colors"
                    title="彻底删除"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-muted rounded-full transition-colors" title="回复">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-full transition-colors" title="分享">
                <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors outline-none">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
