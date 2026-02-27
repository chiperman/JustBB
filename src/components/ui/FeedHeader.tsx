'use client';

import { cn } from "@/lib/utils";
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
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSelection } from '@/context/SelectionContext';
import { useUser } from '@/context/UserContext';
import {
    HugeiconsIcon,
} from '@hugeicons/react';
import {
    CheckmarkSquare02Icon,
    ArrowDown01Icon,
    Sorting05Icon,
    Home01Icon,
} from '@hugeicons/core-free-icons';


export function FeedHeader() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get('sort') || 'newest';
    const activeDate = searchParams.get('date');

    const { isSelectionMode, toggleSelectionMode, selectedIds } = useSelection();
    const { isAdmin } = useUser();

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', value);
        router.push(`?${params.toString()}`);
    };

    const hasContext = !!(activeDate || searchParams.get('tag') || (searchParams.get('year') && searchParams.get('month')));

    return (
        <div className={cn(
            "flex items-center justify-between gap-4 py-2 h-10 transition-all duration-300",
            hasContext && "mb-9" // 为 SearchInput 的绝对定位提示预留更多留白
        )}>
            {isSelectionMode ? (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                            {selectedIds.size} SELECTED
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="flex items-center whitespace-nowrap h-8">
                        <Link
                            href="/"
                            onClick={() => {
                                // 强制重置路由以清除缓存和参数
                                router.push('/');
                            }}
                            className="group flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent transition-all mr-1 h-full"
                            title="回到首页"
                        >
                            <HugeiconsIcon
                                icon={Home01Icon}
                                size={14}
                                className="text-primary/70 group-hover:text-primary transition-colors"
                            />
                            <span className="text-sm font-bold tracking-tight text-primary/90 group-hover:text-primary transition-colors leading-none">
                                JustMemo
                            </span>
                        </Link>

                        {activeDate && (
                            <div className="flex items-center gap-1.5 h-full px-1">
                                <span className="text-muted-foreground/30 text-[10px] font-light">/</span>
                                <span className="text-xs font-mono font-medium text-primary tracking-tight tabular-nums leading-none">
                                    {activeDate}
                                </span>
                            </div>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-md transition-all focus-visible:ring-0"
                                aria-label="更多选项"
                            >
                                <HugeiconsIcon
                                    icon={ArrowDown01Icon}
                                    size={14}
                                    className="transition-transform group-data-[state=open]:rotate-180"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="bottom" className="w-48">
                            {isAdmin && (
                                <>
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2"
                                        onClick={() => toggleSelectionMode(true)}
                                    >
                                        <HugeiconsIcon icon={CheckmarkSquare02Icon} size={16} />
                                        <span>选择笔记</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                                    <HugeiconsIcon icon={Sorting05Icon} size={16} />
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
                </div>
            )}

            {!isSelectionMode && (
                <div className="flex-1 max-w-sm">
                    <SearchInput />
                </div>
            )}
        </div>
    );
}
