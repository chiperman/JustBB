'use client';

import { useState } from 'react';
import { deleteMemo, restoreMemo, permanentDeleteMemo } from '@/actions/delete';
import { updateMemoState } from '@/actions/update';
import { Trash2, RotateCcw, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { useToast } from '@/hooks/use-toast';
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
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showPermanentDeleteAlert, setShowPermanentDeleteAlert] = useState(false);
    const [showPublicConfirm, setShowPublicConfirm] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsPending(true);
        await deleteMemo(id);
        setIsPending(false);
        toast({
            title: "已删除",
            description: "记录已移至回收站",
        });
    };

    const handleRestore = async () => {
        setIsPending(true);
        await restoreMemo(id);
        setIsPending(false);
        toast({
            title: "已恢复",
            description: "记录已恢复至首页",
            variant: "success"
        });
    };

    const handlePermanentDelete = async () => {
        setIsPending(true);
        await permanentDeleteMemo(id);
        setIsPending(false);
        toast({
            title: "彻底销毁",
            description: "该记录已从数据库物理删除",
            variant: "destructive"
        });
    };

    const handleTogglePin = async () => {
        setIsPending(true);
        const formData = new FormData();
        formData.append('id', id);
        formData.append('is_pinned', String(!isPinned));
        await updateMemoState(formData);
        setIsPending(false);
        toast({
            title: !isPinned ? "已置顶" : "已取消置顶",
        });
    };

    const confirmMakePublic = async () => {
        setIsPending(true);
        const formData = new FormData();
        formData.append('id', id);
        formData.append('is_private', 'false');
        const result = await updateMemoState(formData);
        if (result?.error) {
            toast({ title: "错误", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "已公开", description: "该记录现在所有人可见" });
        }
        setIsPending(false);
    };

    const handleTogglePrivate = async () => {
        if (isPrivate) {
            setShowPublicConfirm(true);
        } else {
            // 直接弹出口令询问
            setShowPrompt(true);
        }
    };

    const handlePromptConfirm = async (code: string, hint: string) => {
        setIsPending(true);
        const formData = new FormData();
        formData.append('id', id);
        formData.append('is_private', 'true');
        if (code) {
            formData.append('access_code', code);
            if (hint) {
                formData.append('access_code_hint', hint);
            }
        }

        const result = await updateMemoState(formData);
        if (result?.error) {
            toast({ title: "错误", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "已设为私密", description: code ? "已启用口令保护" : "已设为仅自己可见" });
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
                    className="rounded-sm text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="恢复"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPermanentDeleteAlert(true)}
                    disabled={isPending}
                    className="rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="彻底删除"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>

                <AlertDialog open={showPermanentDeleteAlert} onOpenChange={setShowPermanentDeleteAlert}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确定要彻底销毁吗？</AlertDialogTitle>
                            <AlertDialogDescription>
                                此操作不可逆，该记录将从数据库中物理删除。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">彻底销毁</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-accent rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all">
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

                    <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-destructive focus:text-destructive focus:bg-destructive/5">
                        删除
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Alert */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除这条记录吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            记录将被移至回收站，你可以在 30 天内恢复它。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">确定删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Public Confirm Alert */}
            <AlertDialog open={showPublicConfirm} onOpenChange={setShowPublicConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要设为公开吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            设为公开后，所有人都可以看到此内容。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmMakePublic}>确定公开</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Private Prompt Dialog */}
            <PromptDialog
                open={showPrompt}
                onOpenChange={setShowPrompt}
                title="设为私密内容"
                description="请设置访问口令以保护此内容。设为私密后，查看此记录将需要输入该口令。"
                placeholder="访问口令 (必填)"
                showSecondInput={true}
                secondPlaceholder="口令提示词 (可选)"
                required={true}
                isPassword={true}
                onConfirm={handlePromptConfirm}
                onCancel={() => { }}
            />
        </div>
    );
}
