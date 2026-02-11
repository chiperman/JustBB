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
import { ChevronDown, CheckCircle, ArrowUpDown } from 'lucide-react';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

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

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', value);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between gap-4 py-2 h-10">
            <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="flex items-center whitespace-nowrap">
                    <Link
                        href="/"
                        className="text-sm font-bold tracking-tight text-primary/90 hover:text-primary transition-colors px-2 py-1 rounded-sm hover:bg-primary/5 mr-1"
                    >
                        JustMemo
                    </Link>

                    {activeDate && (
                        <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-300">
                            <span className="text-muted-foreground/30 text-[10px] font-light">/</span>
                            <div className="flex items-center bg-primary/[0.03] dark:bg-primary/[0.05] border border-primary/10 px-2 py-0.5 rounded-full shadow-sm">
                                <span className="text-[10px] font-mono font-bold text-primary/70 tracking-tighter uppercase mr-1 opacity-50">DATE</span>
                                <span className="text-xs font-mono font-medium text-primary tracking-tight tabular-nums">
                                    {activeDate}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {mounted && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-sm transition-all focus-visible:ring-0" aria-label="更多选项">
                                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="bottom" className="w-48">
                            <DropdownMenuItem className="cursor-pointer gap-2">
                                <CheckCircle className="w-4 h-4" />
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
