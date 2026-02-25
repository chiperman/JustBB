'use client';

import { useState, useRef, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Cancel01Icon, Calendar03Icon, Tag01Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from './input';
import { cn } from "@/lib/utils";

export function SearchInput() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [value, setValue] = useState(searchParams.get('q') || '');

    // 同步 URL 参数到本地状态
    useEffect(() => {
        setValue(searchParams.get('q') || '');
    }, [searchParams]);

    const activeDate = searchParams.get('date');
    const activeTag = searchParams.get('tag');
    const activeYear = searchParams.get('year');
    const activeMonth = searchParams.get('month');

    const hasContext = !!(activeDate || activeTag || (activeYear && activeMonth));

    const performSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term.trim()) {
            params.set('q', term.trim());
        } else {
            params.delete('q');
        }
        replace(`/?${params.toString()}`);
    };

    const handleClear = () => {
        setValue('');
        performSearch('');
    };

    const handleGlobalSearch = () => {
        const params = new URLSearchParams();
        if (value.trim()) {
            params.set('q', value.trim());
        }
        replace(`/?${params.toString()}`);
    };

    return (
        <div className="relative w-full group">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 transition-colors">
                    <HugeiconsIcon
                        icon={Search01Icon}
                        size={16}
                        className={value ? "text-primary/70" : "text-muted-foreground/50"}
                    />
                </div>
                <Input
                    type="text"
                    placeholder={hasContext ? "在当前结果中搜索..." : "键入关键字搜索..."}
                    className={cn(
                        "pl-9 pr-10 rounded-md border-border bg-background/50 focus:bg-background transition-all outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9",
                        hasContext && "border-primary/20 bg-primary/[0.02]"
                    )}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            performSearch(value);
                        }
                    }}
                />
                <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1 z-20">
                    {value && (
                        <button
                            onClick={handleClear}
                            className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                            title="清空搜索"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        </button>
                    )}
                </div>
            </div>

            {hasContext && (
                <div className="absolute top-full left-0 right-0 pt-1 flex items-center justify-between px-0.5 animate-in fade-in slide-in-from-top-1 duration-200 pointer-events-auto h-7">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70 flex-1 min-w-0 h-full">
                        <HugeiconsIcon
                            icon={activeDate || activeYear ? Calendar03Icon : Tag01Icon}
                            size={12}
                            className="text-primary/40 shrink-0"
                        />
                        <span className="truncate">
                            正在
                            <span className="text-primary/80 mx-0.5">
                                {activeDate || (activeYear && activeMonth ? `${activeYear}-${activeMonth}` : activeTag)}
                            </span>
                            中搜索
                        </span>
                    </div>

                    {(value.trim() || searchParams.get('q')) && (
                        <button
                            onClick={handleGlobalSearch}
                            className="group flex items-center gap-1 px-1.5 h-5 rounded-md bg-primary/[0.03] hover:bg-primary/10 text-[10px] text-primary/60 hover:text-primary transition-all border border-primary/10 whitespace-nowrap ml-2"
                        >
                            <HugeiconsIcon icon={Globe02Icon} size={10} className="group-hover:rotate-12 transition-transform" />
                            <span>全量搜索</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
