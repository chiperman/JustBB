'use client';

import { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SearchInput } from './SearchInput';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelection } from '@/context/SelectionContext';
import { useUser } from '@/context/UserContext';
import { X, Trash2, Tag, CheckSquare, ChevronDown, ArrowUpDown, Home, Loader2, RotateCcw } from 'lucide-react';
import { batchDeleteMemos } from '@/actions/delete';
import { batchAddTagsToMemos } from '@/actions/update';
import { TagSelectDialog } from './TagSelectDialog';
import { useToast } from '@/hooks/use-toast';

export function FeedHeader() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentSort = searchParams.get('sort') || 'newest';
    const activeDate = searchParams.get('date');

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { isSelectionMode, toggleSelectionMode, selectedIds, clearSelection } = useSelection();
    const { isAdmin } = useUser();
    const { toast } = useToast();
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`确定要将选中的 ${selectedIds.size} 条笔记放入回收站吗？`)) return;

        setIsDeleting(true);
        try {
            const res = await batchDeleteMemos(Array.from(selectedIds));
            if (res.success) {
                toast({ title: '已批量删除', description: `成功删除 ${selectedIds.size} 条笔记` });
                toggleSelectionMode(false);
            } else {
                toast({ title: '删除失败', description: res.error, variant: 'destructive' });
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBatchAddTags = async (tags: string[]) => {
        const res = await batchAddTagsToMemos(Array.from(selectedIds), tags);
        if (res.success) {
            toast({ title: '已添加标签', description: `成功为 ${selectedIds.size} 条笔记添加了标签` });
            toggleSelectionMode(false);
        } else {
            toast({ title: '添加失败', description: res.error, variant: 'destructive' });
        }
    };

    if (isSelectionMode) {
        return (
            <div className="flex items-center justify-between gap-4 py-2 h-10 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSelectionMode(false)}
                        className="h-8 w-8 p-0 rounded-sm hover:bg-accent"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">已开启选择模式</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50 px-2 py-0.5 bg-accent/30 rounded-full font-mono">
                            {selectedIds.size} selected
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground italic text-xs opacity-50">
                    使用底部菜单进行批量操作
                </div>
            </div>
        );
    }

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', value);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between gap-4 py-2 h-10">
            <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="flex items-baseline whitespace-nowrap">
                    <Link
                        href="/"
                        className="group flex items-baseline gap-1.5 px-2 py-1 rounded-sm hover:bg-primary/5 transition-colors mr-1"
                        title="返回首页并重置过滤器"
                    >
                        <Home className="size-3.5 text-primary/70 group-hover:text-primary transition-colors translate-y-[2px] self-center" />
                        <span className="text-sm font-bold tracking-tight text-primary/90 group-hover:text-primary transition-colors">
                            JustMemo
                        </span>
                    </Link>

                    {activeDate && (
                        <>
                            <span className="text-muted-foreground/30 text-[10px] font-light mx-0.5">/</span>
                            <span className="text-xs font-mono font-medium text-primary tracking-tight tabular-nums">
                                {activeDate}
                            </span>
                        </>
                    )}
                </div>

                {isAdmin && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-sm transition-all focus-visible:ring-0"
                                aria-label="更多选项"
                            >
                                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="bottom" className="w-48">
                            <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => toggleSelectionMode(true)}
                            >
                                <CheckSquare className="w-4 h-4" />
                                <span>选择笔记</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                                    <ArrowUpDown className="w-4 h-4" />
                                    <span>排序方式</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuRadioGroup value={currentSort} onValueChange={handleSortChange}>
                                            <DropdownMenuRadioItem value="newest" className="cursor-pointer">创建时间，从新到旧</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="oldest" className="cursor-pointer">创建时间，从旧到新</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="flex-1 max-w-sm">
                <SearchInput />
            </div>
        </div>
    );
}
