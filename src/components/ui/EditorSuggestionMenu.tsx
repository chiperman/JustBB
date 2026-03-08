'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';

interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
    count?: number;
    memo_number?: number;
    created_at?: string;
}

interface EditorSuggestionMenuProps {
    suggestions: SuggestionItem[];
    selectedIndex: number;
    isLoading: boolean;
    hasMore: boolean;
    query: string;
    position: { top: number; left: number } | null;
    onSelect: (item: SuggestionItem) => void;
    onScroll: (e: React.UIEvent<HTMLUListElement>) => void;
}

export function EditorSuggestionMenu({
    suggestions,
    selectedIndex,
    isLoading,
    hasMore,
    query,
    position,
    onSelect,
    onScroll
}: EditorSuggestionMenuProps) {
    const listRef = useRef<HTMLUListElement>(null);

    useLayoutEffect(() => {
        if (listRef.current) {
            const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'instant'
                });
            }
        }
    }, [selectedIndex]);

    if (!position || (suggestions.length === 0 && !isLoading)) return null;

    const renderHighlightedText = (text: string, q: string) => {
        if (!q.trim()) return text;
        const parts = text.split(new RegExp(`(${q})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => (
                    part.toLowerCase() === q.toLowerCase() ? (
                        <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded-md font-medium">{part}</mark>
                    ) : (
                        part
                    )
                ))}
            </>
        );
    };

    return (
        <div
            className="absolute z-50 w-full max-w-[350px]"
            style={{
                top: position.top,
                left: position.left,
            }}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="bg-background border border-border rounded-md shadow-xl overflow-hidden flex flex-col max-h-[450px]">
                {isLoading && suggestions.length === 0 ? (
                    <div className="px-3 py-10 text-xs text-muted-foreground/60 text-center animate-pulse font-mono tracking-tight flex flex-col items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        正在拉取建议...
                    </div>
                ) : null}
                
                {suggestions.length > 0 ? (
                    <ul
                        ref={listRef}
                        className="divide-y divide-border/40 overflow-y-auto scrollbar-hover flex-1 min-h-0"
                        onScroll={onScroll}
                    >
                        {suggestions.map((item, index) => (
                            <li
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className={cn(
                                    "flex flex-col gap-1.5 px-3 py-2.5 cursor-pointer outline-none transition-colors relative",
                                    index === selectedIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50 text-foreground"
                                )}
                            >
                                {item.label.startsWith('#') ? (
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-foreground/80">{item.label}</span>
                                            {item.subLabel && (
                                                <span className="text-[10px] text-muted-foreground/60 italic font-mono tracking-tight">
                                                    {item.subLabel}
                                                </span>
                                            )}
                                        </div>
                                        {item.count !== undefined && (
                                            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                                                {item.count}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                                                {item.created_at ? formatDate(item.created_at, 'yyyy-MM-dd HH:mm:ss') : ''}
                                            </span>
                                            {item.memo_number !== undefined && (
                                                <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                                                    #{item.memo_number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs leading-relaxed text-foreground/80 break-words pr-2">
                                            {item.subLabel && renderHighlightedText(item.subLabel, query)}
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}

                        {(isLoading || hasMore) && (
                            <div className="px-3 py-3 border-t border-border/10">
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-widest">
                                            Loading...
                                        </span>
                                    </div>
                                ) : hasMore && (
                                    <div className="text-center">
                                        <span className="text-[10px] text-muted-foreground/20 font-mono uppercase tracking-widest">
                                            Scroll for more
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </ul>
                ) : null}
            </div>
        </div>
    );
}
