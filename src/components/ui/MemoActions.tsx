'use client';

import { useState } from 'react';
import { deleteMemo, restoreMemo, permanentDeleteMemo } from '@/actions/delete';
import { updateMemoState } from '@/actions/update';
import { Trash2, RotateCcw, MoreHorizontal, MessageSquare, Pin, Lock, LockOpen, Share2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted rounded-full transition-all outline-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {!isDeleted && (
                        <>
                            <DropdownMenuItem onClick={onEdit}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                编辑
                            </DropdownMenuItem>
                            <MemoShare
                                memo={{ id, content, created_at: createdAt, tags, is_pinned: isPinned, is_private: isPrivate, memo_number: 0 } as Memo}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        分享海报
                                    </DropdownMenuItem>
                                }
                            />
                        </>
                    )}
                    <DropdownMenuCheckboxItem
                        checked={isPinned}
                        onCheckedChange={handleTogglePin}
                        disabled={isPending}
                    >
                        <Pin className="w-4 h-4 mr-2" />
                        置顶
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuCheckboxItem
                        checked={isPrivate}
                        onCheckedChange={handleTogglePrivate}
                        disabled={isPending}
                    >
                        {isPrivate ? <Lock className="w-4 h-4 mr-2" /> : <LockOpen className="w-4 h-4 mr-2" />}
                        私密内容
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        移入垃圾箱
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
