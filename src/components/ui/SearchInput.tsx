'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Cancel01Icon, Calendar03Icon, Tag01Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from "@/lib/utils";

export function SearchInput() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const q = searchParams.get('q') || '';
    const tag = searchParams.get('tag');
    const num = searchParams.get('num');
    const date = searchParams.get('date');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const [value, setValue] = useState(q);

    // 同步 URL 参数到本地状态 (渲染期间同步模式)
    const [prevQ, setPrevQ] = useState(q);
    if (prevQ !== q) {
        setPrevQ(q);
        setValue(q);
    }

    const hasContext = !!(tag || num || date || (year && month));

    const removeParam = (param: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(param);
        replace(`/?${params.toString()}`);
    };

    const performSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmedTerm = term.trim();

        if (trimmedTerm.startsWith('#')) {
            const tagValue = trimmedTerm.slice(1).trim();
            if (tagValue) {
                params.set('tag', tagValue);
                params.delete('q');
                setValue('');
            }
        } else if (/^\d+$/.test(trimmedTerm)) {
            params.set('num', trimmedTerm);
            params.delete('q');
            setValue('');
        } else {
            if (trimmedTerm) {
                params.set('q', trimmedTerm);
            } else {
                params.delete('q');
            }
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
            <div className="relative flex items-center min-h-[36px] bg-background/50 border border-border rounded-md px-2 focus-within:ring-0 focus-within:border-primary/30 transition-all hover:bg-background/80 group">
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 pr-8 py-1.5">
                    <HugeiconsIcon
                        icon={Search01Icon}
                        size={16}
                        className={cn("shrink-0 ml-1 transition-colors", value || hasContext ? "text-primary/70" : "text-muted-foreground/50")}
                    />

                    {/* Chips Section */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {tag && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-md border border-primary/20 shrink-0 h-5">
                                <HugeiconsIcon icon={Tag01Icon} size={10} />
                                <span>{tag}</span>
                                <button
                                    onClick={() => removeParam('tag')}
                                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors ml-0.5"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} size={8} />
                                </button>
                            </div>
                        )}
                        {num && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 text-[10px] font-mono font-medium rounded-md border border-amber-200 dark:border-amber-800/50 shrink-0 h-5">
                                <span>#{num}</span>
                                <button
                                    onClick={() => removeParam('num')}
                                    className="hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-full p-0.5 transition-colors ml-0.5"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} size={8} />
                                </button>
                            </div>
                        )}
                        {date && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 text-[10px] font-medium rounded-md border border-blue-200 dark:border-blue-800/50 shrink-0 h-5">
                                <HugeiconsIcon icon={Calendar03Icon} size={10} />
                                <span>{date}</span>
                                <button
                                    onClick={() => removeParam('date')}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors ml-0.5"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} size={8} />
                                </button>
                            </div>
                        )}
                        {year && month && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 text-[10px] font-medium rounded-md border border-blue-200 dark:border-blue-800/50 shrink-0 h-5">
                                <HugeiconsIcon icon={Calendar03Icon} size={10} />
                                <span>{year}-{month}</span>
                                <button
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.delete('year');
                                        params.delete('month');
                                        replace(`/?${params.toString()}`);
                                    }}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors ml-0.5"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} size={8} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Editable Search Input */}
                    <input
                        type="text"
                        placeholder={hasContext ? "" : "键入关键词搜索..."}
                        className="flex-1 min-w-[60px] bg-transparent border-none outline-none ring-0 p-0 h-full text-sm text-foreground placeholder:text-muted-foreground/40"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                performSearch(value);
                            } else if (e.key === 'Backspace' && !value && hasContext) {
                                // Optional feature: delete last chip on backspace if input is empty
                                // We'll keep it simple for now and only use the 'x' buttons
                            }
                        }}
                    />
                </div>

                <div className="shrink-0 flex items-center gap-1">
                    {value && (
                        <button
                            onClick={handleClear}
                            className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors active:scale-90"
                            title="清空搜索"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        </button>
                    )}
                </div>
            </div>

            {hasContext && (
                <div className="absolute top-full left-0 right-0 pt-1 flex items-center justify-end px-0.5 animate-in fade-in slide-in-from-top-1 duration-200 pointer-events-auto h-7">
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
