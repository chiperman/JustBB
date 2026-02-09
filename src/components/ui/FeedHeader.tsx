'use client';

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

import { useRouter, useSearchParams } from 'next/navigation';

export function FeedHeader() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'newest';

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', value);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-1 group">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-1 px-2 gap-1 hover:bg-accent rounded-sm transition-all focus-visible:ring-0">
                            <span className="text-xl font-bold tracking-tight text-primary">JustMemo</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
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
            </div>

            <div className="flex-1 max-w-sm">
                <SearchInput />
            </div>
        </div>
    );
}
