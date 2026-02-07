'use client';

import { useState } from 'react';
import { deleteMemo, restoreMemo, permanentDeleteMemo } from '@/actions/delete';
import { updateMemoState } from '@/actions/update';
import { Trash2, RotateCcw, MoreHorizontal, MessageSquare, Pin, Lock, LockOpen, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MemoCard } from './MemoCard';
import { MemoShare } from './MemoShare';
import { Memo } from '@/types/memo';

interface MemoActionsProps {
    id: string;
    isDeleted: boolean;
    isPinned?: boolean;
    isPrivate?: boolean;
    content?: string;
    createdAt?: string;
    tags?: string[];
    onEdit?: () => void;
}

export function MemoActions({
    id,
    isDeleted,
    isPinned = false,
    isPrivate = false,
    content = '',
    createdAt = '',
    tags = [],
    onEdit
}: MemoActionsProps) {
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        if (!confirm('确定要删除这条记录吗？')) return;
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

    const handleTogglePin = async () => {
        setIsPending(true);
        const formData = new FormData();
        formData.append('id', id);
        formData.append('is_pinned', String(!isPinned));
        await updateMemoState(formData);
        setIsPending(false);
    };

    const handleTogglePrivate = async () => {
        let accessCode = undefined;
        let hint = undefined;

        // 如果当前是私密，要转为公开，需要二次确认
        if (isPrivate) {
            const confirmPublic = confirm('⚠️ 确定要将该内容设为公开吗？\n\n设为公开后，所有人都可以看到此内容。');
            if (!confirmPublic) {
                return; // 用户取消
            }
        } else if (!isPrivate) {
            const wantCode = confirm('是否要为该条私密内容设置访问口令？\n点击“确定”设置口令，点击“取消”仅设为私密（无额外口令）。');
            if (wantCode) {
                const code = prompt('请输入访问口令：');
                if (code) {
                    accessCode = code;
                    hint = prompt('请输入口令提示词 (可选)：') || '';
                }
            }
        }

        setIsPending(true);
        const formData = new FormData();
        formData.append('id', id);
        formData.append('is_private', String(!isPrivate));
        if (accessCode) {
            formData.append('access_code', accessCode);
            formData.append('access_code_hint', hint || '');
        }

        const result = await updateMemoState(formData);
        if (result?.error) {
            alert(result.error);
        }
        setIsPending(false);
    };

    if (isDeleted) {
        return (
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRestore}
                    disabled={isPending}
                    className="rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="恢复"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePermanentDelete}
                    disabled={isPending}
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="彻底删除"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-[rgba(0,0,0,0.05)] rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {!isDeleted && (
                        <>
                            <DropdownMenuItem onClick={onEdit}>
                                编辑
                            </DropdownMenuItem>
                            <MemoShare
                                memo={{ id, content, created_at: createdAt, tags, is_pinned: isPinned, is_private: isPrivate, memo_number: 0 } as Memo}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        分享
                                    </DropdownMenuItem>
                                }
                            />
                        </>
                    )}
                    <DropdownMenuItem
                        onClick={handleTogglePin}
                        disabled={isPending}
                    >
                        {isPinned ? '取消置顶' : '置顶'}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleTogglePrivate}
                        disabled={isPending}
                    >
                        {isPrivate ? '取消私密' : '设为私密'}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/5">
                        删除
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
